export const CERTIFICATE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS as string;

export const CERTIFICATE_REGISTRY_ABI = [
  {
    "inputs": [],
    "name": "issuer",
    "outputs": [ { "internalType": "address", "name": "", "type": "address" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "hash", "type": "bytes32" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "hash", "type": "bytes32" }
    ],
    "name": "revoke",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "hash", "type": "bytes32" }
    ],
    "name": "isValid",
    "outputs": [
      { "internalType": "bool", "name": "valid", "type": "bool" },
      { "internalType": "bool", "name": "revoked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "hash", "type": "bytes32" }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "metadataURI", "type": "string" },
          { "internalType": "uint256", "name": "issuanceTimestamp", "type": "uint256" },
          { "internalType": "bool", "name": "revoked", "type": "bool" }
        ],
        "internalType": "struct CertificateRegistry.Certificate",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;


