import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { z } from 'zod';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';  // For prod logging
import { verifySession } from '../../../lib/auth';
import { collection } from '../../../lib/db';
import { generateStudentDID } from '../../../lib/vc-utills';
// @ts-ignore
import { MerkleTree } from 'merkletreejs';
import { randomUUID } from 'crypto';
import bs58 from 'bs58';

// Helper function to convert hex string to Base58 (for Blockcerts compatibility)
function hexToBase58(hex: string): string {
  try {
    // Remove '0x' prefix if present
    const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
    // Convert hex string to Buffer
    const buffer = Buffer.from(hexWithoutPrefix, 'hex');
    // Encode to Base58
    return bs58.encode(buffer);
  } catch (error) {
    console.error('Error converting hex to Base58:', error);
    return hex; // Fallback to original hex if conversion fails
  }
}

const CERTIFICATE_REGISTRY_ABI = [
  'function batchRegister(bytes32[] calldata didHashes, bytes32[] calldata merkleRoots)',
  'function authorizeIssuer(address newIssuer)',
  'function authorizedIssuers(address) view returns (bool)',
  'function initialIssuer() view returns (address)'
];

const schema = z.object({
  students: z.array(z.object({
    name: z.string().min(1).max(100),
    id: z.string().min(1),
    program: z.string().min(1),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    did: z.string().regex(/^did:ethr:/).optional() // DID is now optional, will be generated if not provided
  })).min(1).max(10),
  uniDID: z.string().regex(/^did:ethr:/),
  walletAddress: z.string().refine((val) => {
    try {
      ethers.getAddress(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid Ethereum address' })
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Prod: Rate limiting (implement via Upstash or middleware)
    // Prod: CORS check if needed

    // Auth (enhanced with Sentry)
    const token = req.cookies.get('token')?.value;
    let session: { adminId?: string; isSuperAdmin?: boolean } | null = null;
    let adminInfo: any = null;
    if (token) {
      session = verifySession(token);
      if (session) {
        const allowCol = await collection('adminAllowlist');
        adminInfo = await allowCol.findOne({ 
          email: String(session.adminId).toLowerCase(), 
          status: { $in: ['active', 'pending'] } 
        }) as any;
        if (!adminInfo) {
          Sentry.captureException(new Error('Forbidden admin'), { tags: { endpoint: 'issue-vc' } });
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      Sentry.captureException(new Error('Invalid input'), { 
        tags: { endpoint: 'issue-vc' },
        extra: { errors: errorMessages }
      });
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.errors[0].message }, { status: 400 });
    }
    const { students, uniDID, walletAddress } = parsed.data;

    // Database collection for students
    const studentsCol = await collection('students');

    // Create index on studentId for better query performance (idempotent)
    try {
      await studentsCol.createIndex({ studentId: 1 }, { unique: true });
    } catch (indexError: any) {
      // Index might already exist, ignore error
      if (indexError.code !== 85) { // 85 = IndexOptionsConflict
        Sentry.captureException(indexError, { tags: { endpoint: 'issue-vc', action: 'create_index' } });
      }
    }

    // Process each student: check DB, validate name, generate/get DID
    let processedStudents;
    try {
      processedStudents = await Promise.all(students.map(async (student) => {
      // Check if student exists in DB by student ID
      const existingStudent = await studentsCol.findOne({ studentId: student.id }) as any;

      if (existingStudent) {
        // Student exists - verify name matches
        const existingName = existingStudent.name?.trim().toLowerCase();
        const incomingName = student.name.trim().toLowerCase();

        if (existingName !== incomingName) {
          // Name mismatch - return error
          const errorMsg = `Name mismatch for student ID "${student.id}". Previous name: "${existingStudent.name}", Current name: "${student.name}". Please verify the name matches the previous record.`;
          Sentry.captureException(new Error(errorMsg), { 
            tags: { endpoint: 'issue-vc', action: 'name_validation' },
            extra: { studentId: student.id, existingName: existingStudent.name, incomingName: student.name }
          });
          throw new Error(errorMsg);
        }

        // Name matches - use existing DID
        return {
          ...student,
          did: existingStudent.did
        };
      } else {
        // New student - generate DID
        const timestamp = Date.now();
        const generatedDID = await generateStudentDID(student.name, timestamp);

        // Store student in DB
        const studentDoc = {
          studentId: student.id,
          name: student.name,
          did: generatedDID,
          program: student.program,
          date: student.date,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          issuerDID: uniDID,
          issuerAddress: walletAddress
        };

        try {
          await studentsCol.insertOne(studentDoc as any);
          Sentry.addBreadcrumb({ 
            category: 'db', 
            message: `Created new student record: ${student.id}`, 
            level: 'info',
            data: { studentId: student.id, did: generatedDID }
          });
        } catch (dbError: any) {
          // Handle duplicate key error (race condition)
          if (dbError.code === 11000) {
            // Student was just created by another request - fetch it
            const raceConditionStudent = await studentsCol.findOne({ studentId: student.id }) as any;
            if (raceConditionStudent) {
              // Verify name still matches
              const existingName = raceConditionStudent.name?.trim().toLowerCase();
              const incomingName = student.name.trim().toLowerCase();
              if (existingName !== incomingName) {
                const errorMsg = `Name mismatch for student ID "${student.id}". Previous name: "${raceConditionStudent.name}", Current name: "${student.name}". Please verify the name matches the previous record.`;
                throw new Error(errorMsg);
              }
              return {
                ...student,
                did: raceConditionStudent.did
              };
            }
          }
          Sentry.captureException(dbError, { 
            tags: { endpoint: 'issue-vc', action: 'db_insert' },
            extra: { studentId: student.id }
          });
          throw new Error(`Failed to store student data: ${dbError.message}`);
        }

        return {
          ...student,
          did: generatedDID
        };
      }
      }));
    } catch (processError: any) {
      // Handle errors from student processing (e.g., name mismatch)
      Sentry.captureException(processError, { 
        tags: { endpoint: 'issue-vc', action: 'process_students' }
      });
      return NextResponse.json({ 
        error: processError.message || 'Failed to process student data' 
      }, { status: 400 });
    }
    console.log("processedStudents----->",processedStudents)
    // Update students array with processed data (including DIDs)
    const studentsWithDIDs = processedStudents;

    // Prod: Env validation
    if (!process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS || !process.env.NEXT_PUBLIC_RPC_URL) {
      Sentry.captureException(new Error('Misconfigured env'), { tags: { endpoint: 'issue-vc' } });
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);  // Your pre-setup
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, wallet);

    // Auto-authorize (enhanced with gas estimation)
    const checksumAddress = ethers.getAddress(walletAddress);
    const isAuthorized = await contract.authorizedIssuers(checksumAddress) as boolean;
    const initialIssuer = await contract.initialIssuer() as string;
    const isInitialIssuer = checksumAddress.toLowerCase() === initialIssuer.toLowerCase();
    if (!isAuthorized && !isInitialIssuer && adminInfo && (adminInfo.isSuperAdmin || adminInfo.status === 'active')) {
      if (process.env.PRIVATE_KEY || process.env.OWNER_PRIVATE_KEY) {
        try {
          const ownerKey = process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY || '';
          const ownerWallet = new ethers.Wallet(ownerKey, provider);
          const contractWithSigner = new ethers.Contract(process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS!, CERTIFICATE_REGISTRY_ABI, ownerWallet);
          const gasEstimate = await contractWithSigner.authorizeIssuer.estimateGas(checksumAddress);
          const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
          const authTx = await contractWithSigner.authorizeIssuer(checksumAddress, { gasLimit });
          const receipt = await authTx.wait();
          console.log(`Authorized ${checksumAddress}. Tx: ${receipt?.hash || authTx.hash}`);
          Sentry.addBreadcrumb({ category: 'auth', message: `Authorized wallet ${checksumAddress}`, level: 'info' });
        } catch (authError: any) {
          Sentry.captureException(authError, { tags: { endpoint: 'issue-vc', action: 'authorize' } });
          console.error('Auto-authorize failed:', authError);
        }
      }
    }

    // PDF batch generation
    const pdfResults = await Promise.all(studentsWithDIDs.map(async (s) => {
      try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText('Certificate of Completion', { x: 160, y: 780, size: 24, font, color: rgb(0, 0, 0) });
        page.drawText(`Name: ${s.name}`, { x: 80, y: 720, size: 12, font });
        page.drawText(`ID: ${s.id}`, { x: 80, y: 700, size: 12, font });
        page.drawText(`Program: ${s.program}`, { x: 80, y: 680, size: 12, font });
        page.drawText(`Date: ${s.date}`, { x: 80, y: 660, size: 12, font });

        const pdfBytesPre = await pdfDoc.save();
        const hashHex = crypto.createHash('sha256').update(Buffer.from(pdfBytesPre)).digest('hex');
        const hashBytes32 = `0x${hashHex}`;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/verify?did=${s.did}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl);
        const qrBase64 = qrDataUrl.split(',')[1];
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
        const { width, height } = qrImage.size();
        page.drawImage(qrImage, { x: 400, y: 640, width, height });

        const pdfBytes = await pdfDoc.save();
        return { pdfBase64: Buffer.from(pdfBytes).toString('base64'), hash: hashBytes32, verifyUrl };
      } catch (pdfErr) {
        Sentry.captureException(pdfErr, { tags: { endpoint: 'issue-vc', student: s.did } });
        throw new Error(`PDF generation failed for ${s.did}`);
      }
    }));

    // VC build/sign (W3C with EIP-712; unchanged from previous)
    const vcs = studentsWithDIDs.map((s, i) => ({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'DegreeCredential'],
      issuer: { id: uniDID, ethereumAddress: walletAddress },
      credentialSubject: {
        id: s.did,
        name: s.name,
        program: s.program,
        date: s.date,
        evidence: pdfResults[i].hash ? [{ hash: pdfResults[i].hash }] : []
      },
      issuanceDate: new Date().toISOString()
    }));

    // Build unsigned VCs (no EIP-712 signing - using Merkle root for verification)
    const signedVCs = vcs.map((vc) => ({
      ...vc,
      proof: {
        type: 'MerkleProof',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: uniDID
      }
    }));

    // Merkle root computation
    const leaves = signedVCs.map((vc) => ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ ...vc, proof: undefined }))));
    console.log("leaves----->",leaves)
    const keccak256Hasher = (data: Buffer): Buffer => Buffer.from(ethers.keccak256(data).slice(2), 'hex');
    console.log("keccak256Hasher----->",keccak256Hasher)
    const tree = new MerkleTree(leaves.map((l) => Buffer.from(l.slice(2), 'hex')), keccak256Hasher, { sortPairs: true });
    console.log("tree----->",tree)
    const merkleRoot = tree.getHexRoot();
    console.log("merkleRoot----->",merkleRoot)
    const vcsWithMerkle = signedVCs.map((vc, i) => {
      const leafBuffer = Buffer.from(leaves[i].slice(2), 'hex');
      const proofPath = tree.getHexProof(leafBuffer);
      return {
        ...vc,
        proof: {
          ...vc.proof,
          merkleRoot,
          proofPath
        }
      };
    });
    console.log("vcsWithMerkle----->",vcsWithMerkle)
    
    // Generate Blockcerts-compatible JSON for each certificate
    const blockcertsCertificates = studentsWithDIDs.map((s, i) => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const certificateId = `${baseUrl}/certificates/${randomUUID()}`;
      
      // Calculate target hash (leaf hash without proof) - this is the certificate hash
      const { proof: _, ...vcWithoutProof } = vcsWithMerkle[i];
      const targetHashHex = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(vcWithoutProof)));
      
      // Format proofPath for Blockcerts - convert to MerkleProof2017 format
      const proofPathHex = Array.isArray(vcsWithMerkle[i].proof?.proofPath) 
        ? vcsWithMerkle[i].proof.proofPath 
        : [];
      
      // Convert hex strings to format without 0x prefix (for Blockcerts compatibility)
      const merkleRootHex = merkleRoot.startsWith('0x') ? merkleRoot.slice(2) : merkleRoot;
      const targetHashHexClean = targetHashHex.startsWith('0x') ? targetHashHex.slice(2) : targetHashHex;
      
      // Format proof path as array of objects with 'right' property (MerkleProof2017 format)
      // Blockcerts expects proof as array of objects: [{right: "hex"}, {right: "hex"}, ...]
      const proofPathFormatted = proofPathHex.map((hex: string) => {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        return { right: cleanHex };
      });
      
      // Blockcerts-compatible structure (using MerkleProof2017 format like certonce.com)
      const blockcertsJson = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://www.blockcerts.org/schema/3.0-alpha/context.json'
        ],
        type: ['VerifiableCredential', 'BlockcertsCredential'],
        id: certificateId,
        issuer: {
          id: uniDID,
          name: 'University Certificate Issuer',
          url: baseUrl,
          email: adminInfo?.email || '',
          image: '',
          revocationList: `${baseUrl}/api/revocation-list`
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: s.did,
          name: s.name,
          program: s.program,
          date: s.date,
          studentId: s.id,
          evidence: pdfResults[i].hash ? [{ hash: pdfResults[i].hash }] : []
        },
        // W3C Verifiable Credential requires 'proof' field
        proof: {
          type: ['MerkleProof2017', 'Extension'], // Must be an array for Blockcerts
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: uniDID,
          merkleRoot: merkleRootHex, // Hex string without 0x prefix
          targetHash: targetHashHexClean, // Hex string without 0x prefix
          anchors: [] // Blockcerts expects anchors array
        },
        // Blockcerts also expects 'signature' field for MerkleProof2017 compatibility
        signature: {
          type: ['MerkleProof2017', 'Extension'],
          merkleRoot: merkleRootHex,
          targetHash: targetHashHexClean,
          proof: proofPathFormatted // Proof path array for MerkleProof2017
        },
        display: {
          contentMediaType: 'application/pdf',
          content: `data:application/pdf;base64,${pdfResults[i].pdfBase64}`
        },
        verifyUrl: pdfResults[i].verifyUrl,
        // Add recipient field for Blockcerts compatibility
        recipient: {
          type: 'email',
          hashed: false,
          identity: s.did,
          name: s.name
        }
      };
      
      return blockcertsJson;
    });
    
    const didHashes = studentsWithDIDs.map(s => ethers.keccak256(ethers.toUtf8Bytes(s.did)));
    console.log("didHashes----->",didHashes)
    // Check if any DID is already registered on-chain (for V1 contract compatibility)
    // For V2 contract, we use composite keys so this check is not needed
    // But we'll skip on-chain registration if contract doesn't support multiple certificates
    const skipOnChainRegistration = process.env.SKIP_ONCHAIN_IF_EXISTS === 'true';
    let shouldRegisterOnChain = true;
    
    if (skipOnChainRegistration) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS!, CERTIFICATE_REGISTRY_ABI, provider);
        
        // Check if any DID is already registered (V1 contract limitation)
        for (const didHash of didHashes) {
          const existingCert = await contract.getCertificate(didHash).catch(() => null);
          if (existingCert && existingCert.issuanceTimestamp > 0) {
            console.log(`⚠️  DID ${didHash} already registered on-chain. Skipping on-chain registration.`);
            console.log('   Certificate will be stored in database only.');
            shouldRegisterOnChain = false;
            break;
          }
        }
      } catch (checkError) {
        console.warn('Could not check existing certificates:', checkError);
      }
    }

    // Update student records with certificate issuance info
    try {
      await Promise.all(studentsWithDIDs.map(async (student, index) => {
        // Prepare certificate JSON object that will be stored in database
        const certificateJson = {
          program: student.program,
          date: student.date,
          merkleRoot: merkleRoot,
          pdfHash: pdfResults[index].hash,
          verifyUrl: pdfResults[index].verifyUrl,
          issuedAt: new Date().toISOString()
        };

        // Prepare student document update JSON
        const studentUpdateJson = {
          $set: {
            updatedAt: new Date().toISOString(),
            lastIssuedProgram: student.program,
            lastIssuedDate: student.date,
            merkleRoot: merkleRoot
          },
          $push: {
            certificates: certificateJson
          }
        };

        // Log the JSON structures being stored
        console.log('\n' + '='.repeat(80));
        console.log('📄 CERTIFICATE JSON DATA - Student:', student.name, `(${student.id})`);
        console.log('='.repeat(80));
        
        console.log('\n1️⃣ CERTIFICATE OBJECT (stored in certificates array):');
        console.log(JSON.stringify(certificateJson, null, 2));
        
        console.log('\n2️⃣ VERIFIABLE CREDENTIAL (VC) JSON (W3C Format):');
        console.log(JSON.stringify(vcsWithMerkle[index], null, 2));
        
        console.log('\n2️⃣b BLOCKCERTS COMPATIBLE JSON (for Blockcerts verification):');
        console.log('⚠️  USE THIS JSON FOR BLOCKCERTS.ORG VERIFIER ⚠️');
        console.log(JSON.stringify(blockcertsCertificates[index], null, 2));
        console.log('\n💡 TIP: Copy the JSON above and save it as a .json file to upload to https://www.blockcerts.org/');
        
        console.log('\n3️⃣ STUDENT DOCUMENT UPDATE JSON:');
        console.log(JSON.stringify(studentUpdateJson, null, 2));
        
        console.log('\n4️⃣ FULL CERTIFICATE DATA (for response):');
        const fullCertificateData = {
          ...student,
          vc: vcsWithMerkle[index],
          merkleRoot,
          pdfBase64: pdfResults[index].pdfBase64,
          verifyUrl: pdfResults[index].verifyUrl
        };
        console.log(JSON.stringify(fullCertificateData, null, 2));
        
        console.log('\n' + '='.repeat(80) + '\n');

        await studentsCol.updateOne(
          { studentId: student.id },
          studentUpdateJson
        );
      }));
    } catch (updateError: any) {
      // Log error but don't fail the request - certificate generation succeeded
      Sentry.captureException(updateError, { 
        tags: { endpoint: 'issue-vc', action: 'update_student_records' }
      });
      console.warn('Failed to update student records with certificate info:', updateError);
    }

    // Prepare transaction data for frontend (not executing here - frontend uses Alchemy Account Kit)
    // Only prepare if we should register on-chain
    let txData = '0x';
    let decodedTxData: any = null;
    
    if (shouldRegisterOnChain) {
      console.log('\n💸 TRANSACTION DATA PREPARATION');
      console.log('='.repeat(80));
      
      // Prepare parameters
      const merkleRootsArray = Array(didHashes.length).fill(merkleRoot);
      
      console.log('\n📋 INPUT PARAMETERS:');
      console.log('  Function: batchRegister(bytes32[] didHashes, bytes32[] merkleRoots)');
      console.log('  Contract Address:', process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS);
      console.log('  Number of Students:', didHashes.length);
      console.log('\n  DID Hashes (bytes32[]):');
      didHashes.forEach((hash, i) => {
        console.log(`    [${i}] ${hash}`);
      });
      console.log('\n  Merkle Roots (bytes32[]):');
      merkleRootsArray.forEach((root, i) => {
        console.log(`    [${i}] ${root}`);
      });
      
      // Encode transaction data
      const iface = new ethers.Interface(['function batchRegister(bytes32[] calldata didHashes, bytes32[] calldata merkleRoots)']);
      txData = iface.encodeFunctionData('batchRegister', [didHashes, merkleRootsArray]);
      
      // Decode to verify (for logging)
      try {
        const decoded = iface.decodeFunctionData('batchRegister', txData);
        decodedTxData = {
          functionName: 'batchRegister',
          didHashes: decoded[0],
          merkleRoots: decoded[1]
        };
        
        console.log('\n✅ ENCODED TRANSACTION DATA:');
        console.log('  Function Selector (first 10 chars):', txData.slice(0, 10));
        console.log('  Full Data Length:', txData.length, 'characters');
        console.log('  Data (hex):', txData);
        
        console.log('\n🔍 DECODED TRANSACTION DATA (for verification):');
        console.log('  Function:', decodedTxData.functionName);
        console.log('  DID Hashes:', decodedTxData.didHashes);
        console.log('  Merkle Roots:', decodedTxData.merkleRoots);
        console.log('  ✅ Encoding verified - data matches input');
      } catch (decodeError) {
        console.warn('Could not decode transaction data:', decodeError);
      }
      
      console.log('\n📝 WHAT GETS STORED ON-CHAIN:');
      console.log('  For each student:');
      console.log('    - didHash (bytes32):', didHashes[0]?.slice(0, 20) + '...');
      console.log('    - merkleRoot (bytes32):', merkleRoot?.slice(0, 20) + '...');
      console.log('    - issuanceTimestamp (uint96): block.timestamp');
      console.log('    - revoked (bool): false');
      console.log('  ❌ NOT stored: student name, ID, program, date, PDF, etc.');
      console.log('  ✅ These are stored in database only');
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ TRANSACTION DATA READY');
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('⚠️  Skipping on-chain registration - certificate will be stored in database only');
      console.log('   To enable on-chain storage for multiple certificates, deploy VcRegistryV2 contract');
    }

    // Log the complete response JSON that will be returned
    const responseJson = {
      success: true,
      vcs: vcsWithMerkle,
      merkleRoot,
      didHashes,
      issuerAddress: walletAddress,
      adminInfo: adminInfo ? {
        email: adminInfo.email,
        isSuperAdmin: !!adminInfo.isSuperAdmin,
        walletAddress: adminInfo.walletAddress || walletAddress
      } : null,
      transactionData: shouldRegisterOnChain ? {
        to: process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS!,
        data: txData,
        functionName: 'batchRegister',
        params: {
          didHashes,
          merkleRoots: Array(didHashes.length).fill(merkleRoot)
        },
        decoded: decodedTxData,
        explanation: {
          rawData: txData,
          whatIsRawData: 'ABI-encoded function call. This is normal - all Ethereum transactions use hex-encoded data.',
          functionSelector: txData.slice(0, 10),
          parameters: {
            didHashes: didHashes.map((h, i) => ({ index: i, hash: h })),
            merkleRoots: Array(didHashes.length).fill(merkleRoot).map((r, i) => ({ index: i, root: r }))
          },
          whatGetsStored: {
            onChain: ['didHash → merkleRoot mapping', 'timestamp', 'revocation status'],
            offChain: ['student name', 'student ID', 'program', 'date', 'PDF', 'full VC']
          }
        }
      } : null,
      skipOnChainRegistration: !shouldRegisterOnChain,
      message: !shouldRegisterOnChain 
        ? 'Certificate stored in database only. Deploy VcRegistryV2 to enable on-chain storage for multiple certificates per student.'
        : undefined,
      pdfResults: pdfResults.map((p) => ({ pdfBase64: p.pdfBase64, verifyUrl: p.verifyUrl })),
      certificates: studentsWithDIDs.map((s, i) => ({
        ...s,
        vc: vcsWithMerkle[i],
        blockcerts: blockcertsCertificates[i], // Add Blockcerts format
        merkleRoot,
        pdfBase64: pdfResults[i].pdfBase64,
        verifyUrl: pdfResults[i].verifyUrl
      })),
      blockcertsCertificates // Add separate Blockcerts array for easy access
    };

    console.log('\n' + '='.repeat(80));
    console.log('📦 COMPLETE RESPONSE JSON (returned to frontend)');
    console.log('='.repeat(80));
    console.log(JSON.stringify(responseJson, null, 2));
    console.log('='.repeat(80) + '\n');

    return NextResponse.json(responseJson);

  } catch (e: any) {
    Sentry.captureException(e, { tags: { endpoint: 'issue-vc' } });
    console.error('Error issuing VCs:', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}