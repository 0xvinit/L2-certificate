// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateRegistry is Ownable {
    struct Certificate {
        string metadataURI;  // IPFS CID for PDF (e.g., "ipfs://Qm...")
        uint256 issuanceTimestamp;
        bool revoked;
    }

    mapping(bytes32 => Certificate) public certificates;
    address public issuer;  // For MVP: Single issuer address (your EVM wallet)

    event CertificateIssued(bytes32 indexed hash, string metadataURI, uint256 timestamp);
    event CertificateRevoked(bytes32 indexed hash);

    constructor(address _issuer) Ownable(msg.sender) {
        issuer = _issuer;  // Set issuer on deploy (can be owner or separate)
    }

    /**
     * @dev Register a new certificate hash with IPFS URI.
     * Reverts if hash already exists (prevents duplicates).
     * Only callable by issuer.
     */
    function register(bytes32 hash, string memory metadataURI) external {
        require(msg.sender == issuer, "Only issuer can register");
        require(bytes(certificates[hash].metadataURI).length == 0, "Hash already registered");

        certificates[hash] = Certificate({
            metadataURI: metadataURI,
            issuanceTimestamp: block.timestamp,
            revoked: false
        });

        emit CertificateIssued(hash, metadataURI, block.timestamp);
    }

    /**
     * @dev Revoke a certificate by hash.
     * Only callable by issuer.
     */
    function revoke(bytes32 hash) external {
        require(msg.sender == issuer, "Only issuer can revoke");
        require(bytes(certificates[hash].metadataURI).length > 0, "Hash not found");

        certificates[hash].revoked = true;
        emit CertificateRevoked(hash);
    }

    /**
     * @dev Check if a certificate hash is valid (exists and not revoked).
     * Public view function for verification.
     */
    function isValid(bytes32 hash) external view returns (bool valid, bool revoked) {
        Certificate memory cert = certificates[hash];
        revoked = cert.revoked;
        valid = bytes(cert.metadataURI).length > 0 && !revoked;
    }

    /**
     * @dev Get full certificate details by hash.
     */
    function getCertificate(bytes32 hash) external view returns (Certificate memory) {
        return certificates[hash];
    }

    // Optional: Owner can update issuer address (e.g., for multi-issuer upgrade)
    function setIssuer(address newIssuer) external onlyOwner {
        issuer = newIssuer;
    }
}