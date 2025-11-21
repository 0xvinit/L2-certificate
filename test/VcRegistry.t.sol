// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VcRegistry.sol";

contract VcRegistryTest is Test {
    VcRegistry registry;
    address owner = makeAddr("owner");
    address issuer = makeAddr("issuer");
    address unauthorized = makeAddr("unauthorized");
    bytes32 sampleDidHash = keccak256("sample-did");
    bytes32 sampleMerkleRoot = keccak256("sample-merkle-root");

    function setUp() public {
        vm.prank(owner);
        registry = new VcRegistry(issuer);
    }

    function testInitialState() public {
        assertEq(registry.initialIssuer(), issuer);
        assertTrue(registry.authorizedIssuers(issuer));
        assertEq(registry.owner(), owner);
    }

    function testBatchRegister() public {
        bytes32[] memory didHashes = new bytes32[](2);
        bytes32[] memory merkleRoots = new bytes32[](2);
        
        didHashes[0] = keccak256("did1");
        didHashes[1] = keccak256("did2");
        merkleRoots[0] = keccak256("root1");
        merkleRoots[1] = keccak256("root2");

        vm.prank(issuer);
        registry.batchRegister(didHashes, merkleRoots);

        (bool valid1, bool revoked1) = registry.isValid(didHashes[0]);
        (bool valid2, bool revoked2) = registry.isValid(didHashes[1]);
        
        assertTrue(valid1);
        assertFalse(revoked1);
        assertTrue(valid2);
        assertFalse(revoked2);
    }

    function testBatchRegisterUnauthorized() public {
        bytes32[] memory didHashes = new bytes32[](1);
        bytes32[] memory merkleRoots = new bytes32[](1);
        
        didHashes[0] = sampleDidHash;
        merkleRoots[0] = sampleMerkleRoot;

        vm.prank(unauthorized);
        vm.expectRevert("Unauthorized");
        registry.batchRegister(didHashes, merkleRoots);
    }

    function testRevoke() public {
        bytes32[] memory didHashes = new bytes32[](1);
        bytes32[] memory merkleRoots = new bytes32[](1);
        
        didHashes[0] = sampleDidHash;
        merkleRoots[0] = sampleMerkleRoot;

        vm.prank(issuer);
        registry.batchRegister(didHashes, merkleRoots);

        vm.prank(issuer);
        registry.revoke(sampleDidHash);

        (bool valid, bool revoked) = registry.isValid(sampleDidHash);
        assertFalse(valid);
        assertTrue(revoked);
    }

    function testRevokeUnauthorized() public {
        bytes32[] memory didHashes = new bytes32[](1);
        bytes32[] memory merkleRoots = new bytes32[](1);
        
        didHashes[0] = sampleDidHash;
        merkleRoots[0] = sampleMerkleRoot;

        vm.prank(issuer);
        registry.batchRegister(didHashes, merkleRoots);

        vm.prank(unauthorized);
        vm.expectRevert("Unauthorized");
        registry.revoke(sampleDidHash);
    }

    function testAuthorizeIssuer() public {
        address newIssuer = makeAddr("newIssuer");
        
        vm.prank(owner);
        registry.authorizeIssuer(newIssuer);
        
        assertTrue(registry.authorizedIssuers(newIssuer));
    }

    function testAuthorizeIssuerOnlyOwner() public {
        address newIssuer = makeAddr("newIssuer");
        
        vm.prank(unauthorized);
        vm.expectRevert();
        registry.authorizeIssuer(newIssuer);
    }

    function testGetCertificate() public {
        bytes32[] memory didHashes = new bytes32[](1);
        bytes32[] memory merkleRoots = new bytes32[](1);
        
        didHashes[0] = sampleDidHash;
        merkleRoots[0] = sampleMerkleRoot;

        vm.prank(issuer);
        registry.batchRegister(didHashes, merkleRoots);

        VcRegistry.Certificate memory cert = registry.getCertificate(sampleDidHash);
        assertEq(cert.merkleRoot, sampleMerkleRoot);
        assertTrue(cert.issuanceTimestamp > 0);
        assertFalse(cert.revoked);
    }

    function testBatchSizeLimit() public {
        bytes32[] memory didHashes = new bytes32[](11);
        bytes32[] memory merkleRoots = new bytes32[](11);
        
        for (uint i = 0; i < 11; i++) {
            didHashes[i] = keccak256(abi.encodePacked("did", i));
            merkleRoots[i] = keccak256(abi.encodePacked("root", i));
        }

        vm.prank(issuer);
        vm.expectRevert("Invalid batch");
        registry.batchRegister(didHashes, merkleRoots);
    }

    function testDuplicateRegistration() public {
        bytes32[] memory didHashes = new bytes32[](1);
        bytes32[] memory merkleRoots = new bytes32[](1);
        
        didHashes[0] = sampleDidHash;
        merkleRoots[0] = sampleMerkleRoot;

        vm.prank(issuer);
        registry.batchRegister(didHashes, merkleRoots);

        vm.prank(issuer);
        vm.expectRevert("DID already registered");
        registry.batchRegister(didHashes, merkleRoots);
    }
}



