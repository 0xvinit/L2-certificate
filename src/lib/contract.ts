export const NEXT_PUBLIC_CERT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CERT_REGISTRY_ADDRESS as string;

export const CERTIFICATE_REGISTRY_ABI = [
  // batchRegister function
  {
    "inputs": [
      { "internalType": "bytes32[]", "name": "didHashes", "type": "bytes32[]" },
      { "internalType": "bytes32[]", "name": "merkleRoots", "type": "bytes32[]" }
    ],
    "name": "batchRegister",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // revoke function (V2 - takes certificateKey)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "certificateKey", "type": "bytes32" }
    ],
    "name": "revoke",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // revokeByDidAndRoot function (V2)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "didHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" }
    ],
    "name": "revokeByDidAndRoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // isValid function (V2 - takes certificateKey)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "certificateKey", "type": "bytes32" }
    ],
    "name": "isValid",
    "outputs": [
      { "internalType": "bool", "name": "valid", "type": "bool" },
      { "internalType": "bool", "name": "revoked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // isValidByDidAndRoot function (V2 - takes didHash and merkleRoot)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "didHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" }
    ],
    "name": "isValidByDidAndRoot",
    "outputs": [
      { "internalType": "bool", "name": "valid", "type": "bool" },
      { "internalType": "bool", "name": "revoked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getCertificate function (V2 - takes certificateKey)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "certificateKey", "type": "bytes32" }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" },
          { "internalType": "bytes32", "name": "didHash", "type": "bytes32" },
          { "internalType": "uint96", "name": "issuanceTimestamp", "type": "uint96" },
          { "internalType": "bool", "name": "revoked", "type": "bool" }
        ],
        "internalType": "struct VcRegistryV2.Certificate",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getCertificateByDidAndRoot function (V2 - takes didHash and merkleRoot)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "didHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" }
    ],
    "name": "getCertificateByDidAndRoot",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" },
          { "internalType": "bytes32", "name": "didHash", "type": "bytes32" },
          { "internalType": "uint96", "name": "issuanceTimestamp", "type": "uint96" },
          { "internalType": "bool", "name": "revoked", "type": "bool" }
        ],
        "internalType": "struct VcRegistryV2.Certificate",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // authorizeIssuer function
  {
    "inputs": [
      { "internalType": "address", "name": "newIssuer", "type": "address" }
    ],
    "name": "authorizeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // authorizedIssuers mapping
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "authorizedIssuers",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // initialIssuer
  {
    "inputs": [],
    "name": "initialIssuer",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // V2 Functions - Get all certificates for a DID
  {
    "inputs": [
      { "internalType": "bytes32", "name": "didHash", "type": "bytes32" }
    ],
    "name": "getCertificatesForDid",
    "outputs": [
      { "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // V2 Functions - Batch revoke
  {
    "inputs": [
      { "internalType": "bytes32[]", "name": "certificateKeys", "type": "bytes32[]" }
    ],
    "name": "batchRevoke",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // V2 Functions - Batch revoke by DID and root
  {
    "inputs": [
      { "internalType": "bytes32[]", "name": "didHashes", "type": "bytes32[]" },
      { "internalType": "bytes32[]", "name": "merkleRoots", "type": "bytes32[]" }
    ],
    "name": "batchRevokeByDidAndRoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // V2 Functions - Revoke all for DID
  {
    "inputs": [
      { "internalType": "bytes32", "name": "didHash", "type": "bytes32" }
    ],
    "name": "revokeAllCertificatesForDid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // V2 Functions - Get revocation status
  {
    "inputs": [
      { "internalType": "bytes32", "name": "didHash", "type": "bytes32" }
    ],
    "name": "getRevocationStatusForDid",
    "outputs": [
      { "internalType": "uint256", "name": "total", "type": "uint256" },
      { "internalType": "uint256", "name": "revoked", "type": "uint256" },
      { "internalType": "uint256", "name": "active", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;


