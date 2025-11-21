import { ethers } from 'ethers';
import * as jose from 'jose';
import { EthrDID } from 'ethr-did';
import { extractAddressFromDID } from './did-utils';

/**
 * Build and sign Verifiable Credentials as JWTs
 * @param students - Array of student data
 * @param uniDID - University DID
 * @param pdfHashes - Array of PDF hashes for each student
 * @returns Array of signed VC JWTs
 */
export async function buildAndSignVCs(
  students: any[],
  uniDID: string,
  pdfHashes: string[]
): Promise<string[]> {
  try {
    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    // Create signer from private key
    const wallet = new ethers.Wallet(privateKey);

    // Build VCs for each student
    const vcPromises = students.map(async (student, i) => {
      const vc = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'DegreeCredential'],
        issuer: {
          id: uniDID,
          name: 'University Issuer'
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: student.did,
          degree: student.degree || 'Unknown',
          name: student.name || 'Unknown',
          evidence: [
            {
              id: `hash://${pdfHashes[i]}`,
              type: 'DocumentHash'
            }
          ],
          nepCompliant: true, // NAD/ABC compliance flag
        },
      };

      // Sign as JWT using jose library
      const secret = new TextEncoder().encode(privateKey.slice(0, 32));
      const jwt = await new jose.SignJWT({ vc })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(uniDID)
        .setSubject(student.did)
        .setExpirationTime('10y')
        .sign(secret);

      return jwt;
    });

    return await Promise.all(vcPromises);
  } catch (error) {
    console.error('Error building VCs:', error);
    throw error;
  }
}

/**
 * Compute Merkle root from an array of proofs/hashes
 * Simplified implementation - use a proper merkle tree library for production
 * @param proofs - Array of proof strings (bytes32)
 * @returns Merkle root as bytes32
 */
export function computeMerkleRoot(proofs: string[]): string {
  if (proofs.length === 0) {
    return ethers.ZeroHash;
  }

  // Simple hash of all proofs concatenated
  // In production, use a proper Merkle tree implementation
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32[]'],
    [proofs]
  );
  return ethers.keccak256(encoded);
}

/**
 * Convert DID string to bytes32 hash for on-chain storage
 * @param did - DID string
 * @returns bytes32 hash
 */
export function didToHash(did: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(did));
}

/**
 * Verify a VC JWT
 * @param vcJwt - The VC JWT to verify
 * @param expectedIssuer - Expected issuer DID
 * @returns boolean indicating if valid
 */
export async function verifyVC(vcJwt: string, expectedIssuer: string): Promise<boolean> {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) return false;

    const secret = new TextEncoder().encode(privateKey.slice(0, 32));
    const { payload } = await jose.jwtVerify(vcJwt, secret);

    // Check issuer matches
    if (payload.iss !== expectedIssuer) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('VC verification failed:', error);
    return false;
  }
}

/**
 * Generate student DID based on first 3 letters of name + timestamp
 * @param name - Student name
 * @param timestamp - Timestamp when student was created (optional, defaults to current time)
 * @returns Student DID string
 */
export async function generateStudentDID(name: string, timestamp?: number): Promise<string> {
  console.log('[generateStudentDID] Starting DID generation process');
  console.log('[generateStudentDID] Input - name:', name);
  console.log('[generateStudentDID] Input - timestamp:', timestamp || 'not provided, will use current time');

  try {
    // Get first 3 letters of name (uppercase, remove spaces)
    const trimmedName = name.trim();
    console.log('[generateStudentDID] Trimmed name:', trimmedName);

    const nameWithoutSpaces = trimmedName.replace(/\s+/g, '');
    console.log('[generateStudentDID] Name without spaces:', nameWithoutSpaces);

    const namePrefix = nameWithoutSpaces
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X'); // Pad with X if name is too short
    
    console.log('[generateStudentDID] Name prefix (first 3 letters):', namePrefix);

    // Use provided timestamp or current timestamp
    const ts = timestamp || Date.now();
    console.log('[generateStudentDID] Using timestamp:', ts);
    console.log('[generateStudentDID] Timestamp as date:', new Date(ts).toISOString());

    // Create a unique identifier: first3letters + timestamp
    const identifier = `${namePrefix}${ts}`;
    console.log('[generateStudentDID] Combined identifier:', identifier);

    // Generate a deterministic Ethereum address from the identifier
    // Using keccak256 hash to create a valid Ethereum address
    const identifierBytes = ethers.toUtf8Bytes(identifier);
    console.log('[generateStudentDID] Identifier as bytes length:', identifierBytes.length);
    
    const hash = ethers.keccak256(identifierBytes);
    console.log('[generateStudentDID] Keccak256 hash:', hash);
    
    // Take first 20 bytes (40 hex chars) as address
    const address = `0x${hash.slice(2, 42)}`;
    console.log('[generateStudentDID] Generated Ethereum address:', address);
    console.log('[generateStudentDID] Address length:', address.length, '(should be 42)');

    // Generate DID using ethr-did format (Arbitrum Sepolia chain ID: 421614)
    const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
    console.log('[generateStudentDID] Using Arbitrum Sepolia chain ID:', ARBITRUM_SEPOLIA_CHAIN_ID);
    
    try {
      console.log('[generateStudentDID] Attempting to create EthrDID instance...');
      const did = new EthrDID({ 
        identifier: address, 
        chainNameOrId: ARBITRUM_SEPOLIA_CHAIN_ID
      });
      const generatedDID = did.did;
      console.log('[generateStudentDID] Successfully generated DID via EthrDID:', generatedDID);
      console.log('[generateStudentDID] DID generation complete');
      return generatedDID;
    } catch (ethrError: any) {
      // Fallback: create DID format directly if ethr-did fails
      console.warn('[generateStudentDID] EthrDID initialization failed, using fallback');
      console.warn('[generateStudentDID] Error details:', ethrError?.message || ethrError);
      const fallbackDID = `did:ethr:${ARBITRUM_SEPOLIA_CHAIN_ID}:${address}`;
      console.log('[generateStudentDID] Fallback DID generated:', fallbackDID);
      return fallbackDID;
    }
  } catch (error: any) {
    console.error('[generateStudentDID] Error generating student DID:', error);
    console.error('[generateStudentDID] Error stack:', error?.stack);
    
    // Final fallback: create a simple DID format
    console.log('[generateStudentDID] Attempting final fallback...');
    const namePrefix = name
      .trim()
      .replace(/\s+/g, '')
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const ts = timestamp || Date.now();
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`${namePrefix}${ts}`));
    const address = `0x${hash.slice(2, 42)}`;
    const finalFallbackDID = `did:ethr:421614:${address}`;
    console.log('[generateStudentDID] Final fallback DID:', finalFallbackDID);
    return finalFallbackDID;
  }
}

// extractAddressFromDID moved to src/lib/did-utils.ts for client-side compatibility

/**
 * Extract name and timestamp from a DID by looking up in database
 * Note: This requires the DID to be stored in the database with the original name and timestamp
 * @param did - DID string
 * @returns Object with name and timestamp, or null if not found
 */
export async function extractNameAndTimestampFromDID(did: string): Promise<{ name: string; timestamp: number } | null> {
  console.log('[extractNameAndTimestampFromDID] Starting extraction from DID:', did);
  
  try {
    // Import collection dynamically to avoid circular dependencies
    const { collection } = await import('../lib/db');
    const studentsCol = await collection('students');
    
    console.log('[extractNameAndTimestampFromDID] Querying database for DID:', did);
    const student = await studentsCol.findOne({ did }) as any;
    
    if (student) {
      console.log('[extractNameAndTimestampFromDID] Student found in database');
      console.log('[extractNameAndTimestampFromDID] Student name:', student.name);
      console.log('[extractNameAndTimestampFromDID] Student createdAt:', student.createdAt);
      
      // Extract timestamp from createdAt or use a default
      let timestamp: number;
      if (student.createdAt) {
        timestamp = new Date(student.createdAt).getTime();
        console.log('[extractNameAndTimestampFromDID] Timestamp from createdAt:', timestamp);
      } else {
        // Try to extract from DID address by reverse lookup (not possible with hash, so use current time as fallback)
        console.warn('[extractNameAndTimestampFromDID] No createdAt found, cannot determine exact timestamp');
        timestamp = Date.now();
      }
      
      const result = {
        name: student.name,
        timestamp: timestamp
      };
      
      console.log('[extractNameAndTimestampFromDID] Extraction complete:', result);
      return result;
    } else {
      console.warn('[extractNameAndTimestampFromDID] Student not found in database for DID:', did);
      
      // Attempt to extract address and see if we can find any matching records
      const address = extractAddressFromDID(did);
      if (address) {
        console.log('[extractNameAndTimestampFromDID] Trying to find by address:', address);
        // Note: We don't store address separately, so this won't work unless we add that field
        // But we can try to reconstruct if we had a way to match
      }
      
      return null;
    }
  } catch (error: any) {
    console.error('[extractNameAndTimestampFromDID] Error extracting name and timestamp:', error);
    console.error('[extractNameAndTimestampFromDID] Error stack:', error?.stack);
    return null;
  }
}