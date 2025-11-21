/**
 * Client-safe DID utility functions
 * These functions don't require Node.js modules and can be used in browser/client components
 */

/**
 * Extract Ethereum address from a DID string
 * @param did - DID string (e.g., 'did:ethr:421614:0x...')
 * @returns Ethereum address extracted from DID
 */
export function extractAddressFromDID(did: string): string | null {
  console.log('[extractAddressFromDID] Extracting address from DID:', did);
  
  try {
    // DID format: did:ethr:{chainId}:{address}
    const didPattern = /^did:ethr:(\d+):(0x[a-fA-F0-9]{40})$/;
    const match = did.match(didPattern);
    
    if (match) {
      const chainId = match[1];
      const address = match[2];
      console.log('[extractAddressFromDID] Extracted chain ID:', chainId);
      console.log('[extractAddressFromDID] Extracted address:', address);
      return address;
    }
    
    console.warn('[extractAddressFromDID] DID format not recognized');
    return null;
  } catch (error: any) {
    console.error('[extractAddressFromDID] Error extracting address:', error);
    return null;
  }
}


