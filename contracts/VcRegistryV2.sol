// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * VcRegistryV2 - Supports multiple certificates per student DID
 * Uses composite key: keccak256(abi.encodePacked(didHash, merkleRoot))
 * This allows the same student to have multiple certificates (different programs, dates, etc.)
 */
contract VcRegistryV2 is Ownable {
    struct Certificate {
        bytes32 merkleRoot;
        bytes32 didHash;  // Store DID hash for lookup
        uint96 issuanceTimestamp;
        bool revoked;
    }

    // Composite key: keccak256(abi.encodePacked(didHash, merkleRoot))
    mapping(bytes32 => Certificate) public certificates;
    
    // Mapping to track all certificate keys for a DID (for lookup)
    mapping(bytes32 => bytes32[]) public didCertificates;
    
    mapping(address => bool) public authorizedIssuers;
    address public immutable initialIssuer;

    event CertificateIssued(
        bytes32 indexed certificateKey,
        bytes32 indexed didHash,
        bytes32 merkleRoot,
        uint96 timestamp
    );
    event CertificateRevoked(bytes32 indexed certificateKey);
    event CertificateRevokedByDid(bytes32 indexed didHash, bytes32 indexed merkleRoot);

    constructor(address _issuer) Ownable(msg.sender) {
        initialIssuer = _issuer;
        authorizedIssuers[_issuer] = true;
    }

    /**
     * Register certificates - supports multiple certificates per DID
     * @param didHashes Array of DID hashes
     * @param merkleRoots Array of merkle roots (each certificate gets unique merkle root)
     */
    function batchRegister(bytes32[] calldata didHashes, bytes32[] calldata merkleRoots) external {
        require(msg.sender == initialIssuer || authorizedIssuers[msg.sender], "Unauthorized");
        require(didHashes.length == merkleRoots.length && didHashes.length <= 10, "Invalid batch");

        for (uint i = 0; i < didHashes.length; i++) {
            bytes32 didHash = didHashes[i];
            bytes32 merkleRoot = merkleRoots[i];
            
            // Create composite key: keccak256(abi.encodePacked(didHash, merkleRoot))
            bytes32 certificateKey = keccak256(abi.encodePacked(didHash, merkleRoot));
            
            // Check if this specific certificate (DID + merkle root combination) already exists
            require(certificates[certificateKey].issuanceTimestamp == 0, "Certificate already registered");

            certificates[certificateKey] = Certificate({
                merkleRoot: merkleRoot,
                didHash: didHash,
                issuanceTimestamp: uint96(block.timestamp),
                revoked: false
            });
            
            // Track this certificate for the DID
            didCertificates[didHash].push(certificateKey);
            
            emit CertificateIssued(certificateKey, didHash, merkleRoot, uint96(block.timestamp));
        }
    }

    /**
     * Revoke a specific certificate by its composite key
     */
    function revoke(bytes32 certificateKey) external {
        require(msg.sender == initialIssuer || authorizedIssuers[msg.sender], "Unauthorized");
        require(certificates[certificateKey].issuanceTimestamp > 0, "Not found");
        certificates[certificateKey].revoked = true;
        emit CertificateRevoked(certificateKey);
    }

    /**
     * Revoke a certificate by DID hash and merkle root
     */
    function revokeByDidAndRoot(bytes32 didHash, bytes32 merkleRoot) external {
        bytes32 certificateKey = keccak256(abi.encodePacked(didHash, merkleRoot));
        require(msg.sender == initialIssuer || authorizedIssuers[msg.sender], "Unauthorized");
        require(certificates[certificateKey].issuanceTimestamp > 0, "Not found");
        certificates[certificateKey].revoked = true;
        emit CertificateRevoked(certificateKey);
    }

    /**
     * Check if a specific certificate is valid
     */
    function isValid(bytes32 certificateKey) external view returns (bool valid, bool revoked) {
        Certificate memory cert = certificates[certificateKey];
        revoked = cert.revoked;
        valid = cert.issuanceTimestamp > 0 && !revoked;
    }

    /**
     * Check if a certificate exists for DID hash and merkle root
     */
    function isValidByDidAndRoot(bytes32 didHash, bytes32 merkleRoot) external view returns (bool valid, bool revoked) {
        bytes32 certificateKey = keccak256(abi.encodePacked(didHash, merkleRoot));
        return this.isValid(certificateKey);
    }

    /**
     * Get certificate by composite key
     */
    function getCertificate(bytes32 certificateKey) external view returns (Certificate memory) {
        return certificates[certificateKey];
    }

    /**
     * Get certificate by DID hash and merkle root
     */
    function getCertificateByDidAndRoot(bytes32 didHash, bytes32 merkleRoot) external view returns (Certificate memory) {
        bytes32 certificateKey = keccak256(abi.encodePacked(didHash, merkleRoot));
        return certificates[certificateKey];
    }

    /**
     * Get all certificate keys for a DID
     */
    function getCertificatesForDid(bytes32 didHash) external view returns (bytes32[] memory) {
        return didCertificates[didHash];
    }

    /**
     * Get count of certificates for a DID
     */
    function getCertificateCountForDid(bytes32 didHash) external view returns (uint256) {
        return didCertificates[didHash].length;
    }

    /**
     * Revoke all certificates for a specific DID
     * Useful when a student's identity is compromised
     */
    function revokeAllCertificatesForDid(bytes32 didHash) external {
        require(msg.sender == initialIssuer || authorizedIssuers[msg.sender], "Unauthorized");
        bytes32[] memory certKeys = didCertificates[didHash];
        require(certKeys.length > 0, "No certificates found");
        
        for (uint i = 0; i < certKeys.length; i++) {
            if (!certificates[certKeys[i]].revoked) {
                certificates[certKeys[i]].revoked = true;
                emit CertificateRevoked(certKeys[i]);
            }
        }
    }

    /**
     * Revoke multiple certificates by their composite keys
     */
    function batchRevoke(bytes32[] calldata certificateKeys) external {
        require(msg.sender == initialIssuer || authorizedIssuers[msg.sender], "Unauthorized");
        require(certificateKeys.length <= 50, "Too many certificates");
        
        for (uint i = 0; i < certificateKeys.length; i++) {
            bytes32 key = certificateKeys[i];
            require(certificates[key].issuanceTimestamp > 0, "Certificate not found");
            if (!certificates[key].revoked) {
                certificates[key].revoked = true;
                emit CertificateRevoked(key);
            }
        }
    }

    /**
     * Revoke multiple certificates by DID hash and merkle roots
     */
    function batchRevokeByDidAndRoot(
        bytes32[] calldata didHashes,
        bytes32[] calldata merkleRoots
    ) external {
        require(msg.sender == initialIssuer || authorizedIssuers[msg.sender], "Unauthorized");
        require(didHashes.length == merkleRoots.length && didHashes.length <= 50, "Invalid batch");
        
        for (uint i = 0; i < didHashes.length; i++) {
            bytes32 certificateKey = keccak256(abi.encodePacked(didHashes[i], merkleRoots[i]));
            require(certificates[certificateKey].issuanceTimestamp > 0, "Certificate not found");
            if (!certificates[certificateKey].revoked) {
                certificates[certificateKey].revoked = true;
                emit CertificateRevoked(certificateKey);
                emit CertificateRevokedByDid(didHashes[i], merkleRoots[i]);
            }
        }
    }

    /**
     * Check if all certificates for a DID are revoked
     */
    function areAllCertificatesRevoked(bytes32 didHash) external view returns (bool) {
        bytes32[] memory certKeys = didCertificates[didHash];
        if (certKeys.length == 0) return false;
        
        for (uint i = 0; i < certKeys.length; i++) {
            if (!certificates[certKeys[i]].revoked) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get revocation status for all certificates of a DID
     */
    function getRevocationStatusForDid(bytes32 didHash) external view returns (
        uint256 total,
        uint256 revoked,
        uint256 active
    ) {
        bytes32[] memory certKeys = didCertificates[didHash];
        total = certKeys.length;
        
        for (uint i = 0; i < certKeys.length; i++) {
            if (certificates[certKeys[i]].revoked) {
                revoked++;
            } else {
                active++;
            }
        }
    }

    function authorizeIssuer(address newIssuer) external onlyOwner {
        authorizedIssuers[newIssuer] = true;
    }
}

