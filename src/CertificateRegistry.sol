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
    mapping(address => bool) public authorizedIssuers;  // Multiple authorized issuers
    
    // Deprecated: keeping for backward compatibility
    address public issuer;

    event CertificateIssued(bytes32 indexed hash, string metadataURI, uint256 timestamp);
    event CertificateRevoked(bytes32 indexed hash);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    constructor(address _issuer) Ownable(msg.sender) {
        issuer = _issuer;  // Set issuer on deploy (can be owner or separate)
        authorizedIssuers[_issuer] = true;  // Add initial issuer to authorized list
        emit IssuerAuthorized(_issuer);
    }

    /**
     * @dev Register a new certificate hash with IPFS URI.
     * Reverts if hash already exists (prevents duplicates).
     * Only callable by authorized issuers.
     */
    function register(bytes32 hash, string memory metadataURI) external {
        require(authorizedIssuers[msg.sender] || msg.sender == issuer, "Only authorized issuer can register");
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
     * Only callable by authorized issuers.
     */
    function revoke(bytes32 hash) external {
        require(authorizedIssuers[msg.sender] || msg.sender == issuer, "Only authorized issuer can revoke");
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

    /**
     * @dev Authorize a new issuer address (only owner can call).
     */
    function authorizeIssuer(address newIssuer) external onlyOwner {
        authorizedIssuers[newIssuer] = true;
        emit IssuerAuthorized(newIssuer);
    }

    /**
     * @dev Revoke authorization for an issuer address (only owner can call).
     */
    function revokeIssuer(address issuerToRevoke) external onlyOwner {
        authorizedIssuers[issuerToRevoke] = false;
        emit IssuerRevoked(issuerToRevoke);
    }

    /**
     * @dev Check if an address is an authorized issuer.
     */
    function isAuthorizedIssuer(address addr) external view returns (bool) {
        return authorizedIssuers[addr] || addr == issuer;
    }

    // Optional: Owner can update issuer address (e.g., for multi-issuer upgrade)
    function setIssuer(address newIssuer) external onlyOwner {
        address oldIssuer = issuer;
        issuer = newIssuer;
        authorizedIssuers[oldIssuer] = false;
        authorizedIssuers[newIssuer] = true;
        emit IssuerRevoked(oldIssuer);
        emit IssuerAuthorized(newIssuer);
    }
}