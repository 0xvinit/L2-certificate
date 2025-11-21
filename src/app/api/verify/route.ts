import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getResolver } from 'ethr-did-resolver';
import { collection } from '../../../lib/db';
import { CERTIFICATE_REGISTRY_ABI, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from '../../../lib/contract';
import { ObjectId } from 'mongodb';
// @ts-ignore
import { MerkleTree } from 'merkletreejs';

export const dynamic = 'force-dynamic';

// Helper function to detect if input is a merkle root (0x followed by 64 hex chars)
function isMerkleRoot(input: string | null): boolean {
  if (!input) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(input);
}

// Helper function to detect if input is a DID
function isDID(input: string | null): boolean {
  if (!input) return false;
  return input.startsWith('did:');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('did'); // Accept any input in 'did' parameter
    const merkleRootParam = searchParams.get('merkleRoot'); // Also check merkleRoot param
    console.log("input----->", input)
    console.log("merkleRootParam----->", merkleRootParam)
    const includeHistory = searchParams.get('includeHistory') === 'true';
    
    console.log('='.repeat(80));
    console.log('🔍 VERIFICATION REQUEST');
    console.log('='.repeat(80));
    console.log('Input:', input || 'Not provided');
    console.log('Merkle Root Param:', merkleRootParam || 'Not provided');
    console.log('Include History:', includeHistory);
    
    if (!input && !merkleRootParam) {
      return NextResponse.json({ error: 'Missing required param: provide DID or merkle root in ?did=...' }, { status: 400 });
    }
    
    if (!NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
      return NextResponse.json({ error: 'Contract address not configured' }, { status: 500 });
    }

    let resolvedDid: string | null = null;
    let resolvedMerkleRoot: string | null = null;

    // Step 1: Auto-detect input type and resolve DID/Merkle Root
    console.log('\n📊 STEP 1: Auto-detect Input Type');
    
    // Priority: merkleRootParam > input detection
    if (merkleRootParam) {
      resolvedMerkleRoot = merkleRootParam;
      console.log('  ✅ Using merkleRoot parameter:', resolvedMerkleRoot);
    } else if (input) {
      if (isMerkleRoot(input)) {
        resolvedMerkleRoot = input;
        console.log('  ✅ Detected as Merkle Root:', resolvedMerkleRoot);
      } else if (isDID(input)) {
        resolvedDid = input;
        console.log('  ✅ Detected as DID:', resolvedDid);
      } else {
        // Try to find in database - could be merkle root or partial match
        console.log('  🔍 Input type unclear, searching database...');
        const certCol = await collection('certificates');
        
        // First try as merkle root
        let certByRoot = await certCol.findOne({ merkleRoot: input }) as any;
        if (certByRoot) {
          resolvedMerkleRoot = input;
          resolvedDid = certByRoot.did;
          console.log('  ✅ Found as Merkle Root in database');
          console.log('  Associated DID:', resolvedDid);
        } else {
          // Try as DID (exact match)
          let certByDid = await certCol.findOne({ did: input }) as any;
          if (certByDid) {
            resolvedDid = input;
            console.log('  ✅ Found as DID in database');
          } else {
            // Try partial merkle root match (case-insensitive)
            certByRoot = await certCol.findOne({ 
              merkleRoot: { $regex: new RegExp(input.replace(/^0x/i, ''), 'i') } 
            }) as any;
            if (certByRoot) {
              resolvedMerkleRoot = certByRoot.merkleRoot;
              resolvedDid = certByRoot.did;
              console.log('  ✅ Found by partial Merkle Root match');
              console.log('  Full Merkle Root:', resolvedMerkleRoot);
              console.log('  Associated DID:', resolvedDid);
            } else {
              return NextResponse.json({
                status: 'not_found',
                merkleRoot: input.startsWith('0x') ? input : null,
                did: input.startsWith('did:') ? input : null,
                revoked: false,
                certificate: null,
                history: [],
                message: 'No certificate found matching the provided input'
              });
            }
          }
        }
      }
    }

    // Step 2: If we have merkle root but no DID, resolve DID from database
    if (resolvedMerkleRoot && !resolvedDid) {
      console.log('\n📊 STEP 2: Resolve DID from Merkle Root');
      console.log('  Merkle Root:', resolvedMerkleRoot);
      
      const certCol = await collection('certificates');
      const certByRoot = await certCol.findOne({ merkleRoot: resolvedMerkleRoot }) as any;
      
      if (!certByRoot) {
        return NextResponse.json({
          status: 'not_found',
          merkleRoot: resolvedMerkleRoot,
          revoked: false,
          certificate: null,
          history: [],
          message: 'No certificate found with this merkle root'
        });
      }
      
      resolvedDid = certByRoot.did;
      console.log('  ✅ Found DID:', resolvedDid);
      console.log('  Certificate Program:', certByRoot.programName || certByRoot.program);
    }
    
    if (!resolvedDid && !resolvedMerkleRoot) {
      return NextResponse.json({
        error: 'Could not resolve DID or merkle root from input'
      }, { status: 400 });
    }

    // Step 3: Compute DID Hash
    const didHash = ethers.keccak256(ethers.toUtf8Bytes(resolvedDid!));
    console.log('\n📊 STEP 3: Compute DID Hash');
    console.log('  DID:', resolvedDid);
    console.log('  DID Hash (bytes32):', didHash);

    // Step 4: Query On-Chain Contract
    let valid = false;
    let revoked = false;
    let onChainCerts: Map<string, any> = new Map(); // Map merkleRoot -> certificate
    
    console.log('\n⛓️  STEP 4: Query On-Chain Contract');
    console.log('  Contract Address:', NEXT_PUBLIC_CERT_REGISTRY_ADDRESS);
    
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL);
      const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider);
      
      if (resolvedMerkleRoot) {
        // Single certificate verification: verify specific certificate by merkle root
        console.log('  🔍 Single Certificate Verification Mode (by Merkle Root)');
        console.log('  Merkle Root:', resolvedMerkleRoot);
        
        const statusTuple = await contract.isValidByDidAndRoot(didHash, resolvedMerkleRoot);
        valid = Boolean(statusTuple[0]);
        revoked = Boolean(statusTuple[1]);
        
        const cert = await contract.getCertificateByDidAndRoot(didHash, resolvedMerkleRoot);
        if (cert.issuanceTimestamp > 0) {
          onChainCerts.set(resolvedMerkleRoot.toLowerCase(), cert);
          console.log('  ✅ On-Chain Certificate Found');
          console.log('  - Merkle Root:', cert.merkleRoot);
          console.log('  - Issuance Timestamp:', Number(cert.issuanceTimestamp));
          console.log('  - Revoked:', cert.revoked);
          console.log('  - Valid:', valid);
        } else {
          console.log('  ❌ Certificate not found on-chain');
        }
      } else {
        // Multiple certificates verification: get all certificates for this DID
        console.log('  🔍 Multiple Certificates Verification Mode');
        
        const certificateKeys = await contract.getCertificatesForDid(didHash);
        console.log('  Found', certificateKeys.length, 'certificate(s) on-chain for this DID');
        
        for (let i = 0; i < certificateKeys.length; i++) {
          try {
            const cert = await contract.getCertificate(certificateKeys[i]);
            if (cert.issuanceTimestamp > 0) {
              const root = cert.merkleRoot.toLowerCase();
              onChainCerts.set(root, cert);
              console.log(`  Certificate ${i + 1}:`);
              console.log('    - Merkle Root:', cert.merkleRoot);
              console.log('    - Issuance Timestamp:', Number(cert.issuanceTimestamp));
              console.log('    - Revoked:', cert.revoked);
            }
          } catch (err: any) {
            console.warn(`  ⚠️  Failed to fetch certificate ${i + 1}:`, err?.message);
          }
        }
        
        // If we have on-chain certs, check if any are valid
        if (onChainCerts.size > 0) {
          const firstCert = Array.from(onChainCerts.values())[0];
          valid = !firstCert.revoked && firstCert.issuanceTimestamp > 0;
          revoked = firstCert.revoked;
        }
      }
    } catch (chainErr: any) {
      console.warn('  ⚠️  Chain verification failed:', chainErr?.message);
      console.log('  → Falling back to database-only verification');
    }

    // Step 5: Query Database for Certificates
    console.log('\n📄 STEP 5: Query Database for Certificates');
    const certCol = await collection('certificates');
    const queryFilter: any = { did: resolvedDid };
    if (resolvedMerkleRoot) {
      queryFilter.merkleRoot = resolvedMerkleRoot;
    }
    const allCertificates = await certCol.find(queryFilter).toArray() as any[];
    
    console.log('  Found', allCertificates.length, 'certificate(s) in database for this DID');
    
    if (allCertificates.length === 0) {
      console.log('  ❌ No certificates found in database');
      // Get first on-chain cert if available
      const firstOnChainCert = onChainCerts.size > 0 ? Array.from(onChainCerts.values())[0] : null;
      return NextResponse.json({
        status: 'not_found',
        merkleRoot: firstOnChainCert?.merkleRoot || resolvedMerkleRoot || '0x0',
        issuanceTimestamp: firstOnChainCert?.issuanceTimestamp ? Number(firstOnChainCert.issuanceTimestamp) : undefined,
        revoked: Boolean(revoked),
        certificate: null,
        history: [],
        message: 'No certificates found for this DID'
      });
    }

    // Step 6: Enrich Certificate Data
    console.log('\n🔍 STEP 6: Enrich Certificate Data');
    const enrichedCerts = await Promise.all(allCertificates.map(async (cert: any) => {
      // Enrich with program info
      if (cert.programId) {
        const programCol = await collection('programs');
        const program = await programCol.findOne({ _id: new ObjectId(cert.programId) }) as any;
        if (program) {
          cert.programName = program.name;
          cert.programCode = program.code;
        }
      }
      
      // Enrich with admin/university info
      if (cert.adminAddress) {
        const adminCol = await collection('admins');
        const admin = await adminCol.findOne({ walletAddress: cert.adminAddress.toLowerCase() }) as any;
        if (admin) {
          cert.university = admin.university || '';
        }
      }
      
      // Check if this certificate matches any on-chain certificate
      const certMerkleRoot = cert.merkleRoot?.toLowerCase();
      cert.isOnChain = certMerkleRoot && onChainCerts.has(certMerkleRoot);
      
      // If on-chain, get the on-chain certificate data
      if (cert.isOnChain && certMerkleRoot) {
        cert.onChainData = onChainCerts.get(certMerkleRoot);
      }
      
      console.log(`  Certificate ${allCertificates.indexOf(cert) + 1}:`);
      console.log('    - Program:', cert.programName || cert.program);
      console.log('    - Date:', cert.date);
      console.log('    - Merkle Root:', cert.merkleRoot);
      console.log('    - On-Chain:', cert.isOnChain ? '✅' : '❌');
      console.log('    - TX Hash:', cert.txHash);
      
      return cert;
    }));

    // Step 7: Get Primary Certificate
    // If merkleRoot is specified, find that specific certificate
    // Otherwise, prefer on-chain certificates, then fall back to first one
    let primaryCert: any;
    if (resolvedMerkleRoot) {
      primaryCert = enrichedCerts.find(c => 
        c.merkleRoot?.toLowerCase() === resolvedMerkleRoot!.toLowerCase()
      );
      if (!primaryCert && enrichedCerts.length > 0) {
        console.warn('  ⚠️  Specified merkleRoot not found, using first certificate');
        primaryCert = enrichedCerts[0];
      }
    } else {
      primaryCert = enrichedCerts.find(c => c.isOnChain) || enrichedCerts[0];
    }
    
    if (!primaryCert) {
      console.log('  ❌ No certificates found');
      return NextResponse.json({
        status: 'not_found',
        merkleRoot: resolvedMerkleRoot || '0x0',
        revoked: false,
        certificate: null,
        history: [],
        message: 'No certificates found'
      });
    }
    
    console.log('\n📋 STEP 7: Primary Certificate');
    console.log('  Selected:', primaryCert.programName || primaryCert.program);
    console.log('  Merkle Root:', primaryCert.merkleRoot);
    console.log('  On-Chain Verified:', primaryCert.isOnChain ? '✅' : '❌');
    
    // Update valid/revoked status based on primary certificate
    if (primaryCert.isOnChain && primaryCert.onChainData) {
      valid = !primaryCert.onChainData.revoked && primaryCert.onChainData.issuanceTimestamp > 0;
      revoked = primaryCert.onChainData.revoked;
    }

    // Step 8: Verify Merkle Proof (if VC available)
    let merkleProofValid = false;
    if (primaryCert.vc && primaryCert.vc.proof) {
      console.log('\n🔐 STEP 8: Verify Merkle Proof');
      try {
        const vcWithoutProof = { ...primaryCert.vc };
        delete vcWithoutProof.proof;
        const leafHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(vcWithoutProof)));
        
        if (primaryCert.vc.proof.proofPath && primaryCert.vc.proof.merkleRoot) {
          const keccak256Hasher = (data: Buffer): Buffer => Buffer.from(ethers.keccak256(data).slice(2), 'hex');
          const leafBuffer = Buffer.from(leafHash.slice(2), 'hex');
          const proofBuffers = primaryCert.vc.proof.proofPath.map((p: string) => Buffer.from(p.slice(2), 'hex'));
          const rootBuffer = Buffer.from(primaryCert.vc.proof.merkleRoot.slice(2), 'hex');
          
          merkleProofValid = MerkleTree.verify(proofBuffers, leafBuffer, rootBuffer, keccak256Hasher);
          console.log('  Merkle Proof Valid:', merkleProofValid ? '✅' : '❌');
        }
      } catch (proofErr: any) {
        console.warn('  ⚠️  Merkle proof verification failed:', proofErr?.message);
      }
    }

    // Step 9: Determine Final Status
    console.log('\n✅ STEP 9: Final Verification Status');
    let finalStatus: string;
    
    if (revoked) {
      finalStatus = 'revoked';
      console.log('  Status: REVOKED ❌');
    } else if (valid && primaryCert.isOnChain) {
      finalStatus = 'verified';
      console.log('  Status: VERIFIED ✅ (On-Chain)');
    } else if (primaryCert && !primaryCert.isOnChain) {
      finalStatus = 'verified_offchain';
      console.log('  Status: VERIFIED ✅ (Off-Chain Only - Not stored on blockchain)');
      console.log('  ⚠️  Note: This certificate exists in database but not on-chain');
    } else {
      finalStatus = 'not_found';
      console.log('  Status: NOT FOUND ❌');
    }

    // Step 10: Prepare History
    const history = enrichedCerts.map(cert => ({
      program: cert.programName || cert.program,
      programCode: cert.programCode,
      date: cert.date,
      txHash: cert.txHash,
      merkleRoot: cert.merkleRoot,
      isOnChain: cert.isOnChain,
      verified: cert.isOnChain ? 'on-chain' : 'off-chain'
    }));

    console.log('\n📚 Certificate History:', history.length, 'certificate(s)');
    history.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.program} (${h.date}) - ${h.verified}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80) + '\n');

    // Return response
    const onChainCertData = primaryCert?.onChainData || (resolvedMerkleRoot && onChainCerts.has(resolvedMerkleRoot.toLowerCase()) 
      ? onChainCerts.get(resolvedMerkleRoot.toLowerCase()) 
      : null);
    
    return NextResponse.json({
      status: finalStatus,
      merkleRoot: primaryCert?.merkleRoot || resolvedMerkleRoot || '0x0',
      did: resolvedDid,
      issuanceTimestamp: onChainCertData?.issuanceTimestamp ? Number(onChainCertData.issuanceTimestamp) : undefined,
      revoked: Boolean(revoked),
      onChainVerified: primaryCert?.isOnChain || false,
      merkleProofValid: merkleProofValid,
      certificate: primaryCert ? {
        studentName: primaryCert.studentName,
        studentId: primaryCert.studentId,
        date: primaryCert.date,
        programName: primaryCert.programName,
        programCode: primaryCert.programCode,
        university: primaryCert.university,
        txHash: primaryCert.txHash,
        merkleRoot: primaryCert.merkleRoot,
        isOnChain: primaryCert.isOnChain,
        signedVC: primaryCert.signedVC || primaryCert.vc
      } : null,
      history: includeHistory ? history : undefined,
      totalCertificates: allCertificates.length,
      onChainCertificatesCount: onChainCerts.size
    });

  } catch (e: any) {
    console.error('❌ Error verifying VC:', e);
    console.error('Stack:', e?.stack);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}