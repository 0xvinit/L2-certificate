/**
 * Transaction Data Decoder Utility
 * Decodes ABI-encoded transaction data to show readable values
 */

import { ethers } from 'ethers';

const BATCH_REGISTER_ABI = [
  'function batchRegister(bytes32[] calldata didHashes, bytes32[] calldata merkleRoots)'
];

/**
 * Decode batchRegister transaction data
 */
export function decodeBatchRegisterTx(txData: string): {
  functionName: string;
  didHashes: string[];
  merkleRoots: string[];
  readable: {
    didHashes: Array<{ index: number; hash: string; shortHash: string }>;
    merkleRoots: Array<{ index: number; root: string; shortRoot: string }>;
  };
} | null {
  try {
    const iface = new ethers.Interface(BATCH_REGISTER_ABI);
    const decoded = iface.decodeFunctionData('batchRegister', txData);
    
    return {
      functionName: 'batchRegister',
      didHashes: decoded[0],
      merkleRoots: decoded[1],
      readable: {
        didHashes: decoded[0].map((hash: string, i: number) => ({
          index: i,
          hash,
          shortHash: `${hash.slice(0, 10)}...${hash.slice(-8)}`
        })),
        merkleRoots: decoded[1].map((root: string, i: number) => ({
          index: i,
          root,
          shortRoot: `${root.slice(0, 10)}...${root.slice(-8)}`
        }))
      }
    };
  } catch (error) {
    console.error('Failed to decode transaction:', error);
    return null;
  }
}

/**
 * Format transaction data for display
 */
export function formatTxDataForDisplay(txData: string): string {
  const decoded = decodeBatchRegisterTx(txData);
  if (!decoded) {
    return 'Unable to decode transaction data';
  }
  
  return `
Transaction Details:
  Function: ${decoded.functionName}
  DID Hashes (${decoded.didHashes.length}):
${decoded.readable.didHashes.map(p => `    [${p.index}] ${p.shortHash}`).join('\n')}
  Merkle Roots (${decoded.merkleRoots.length}):
${decoded.readable.merkleRoots.map(p => `    [${p.index}] ${p.shortRoot}`).join('\n')}
  `;
}


