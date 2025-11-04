// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CertificateRegistry.sol";

contract CertificateRegistryTest is Test {
    CertificateRegistry registry;
    address owner = makeAddr("owner");
    address issuer = makeAddr("issuer");
    bytes32 sampleHash = keccak256("sample pdf hash");

    function setUp() public {
        registry = new CertificateRegistry(issuer);
    }

    function testRegisterAndValidate() public {
        vm.prank(issuer);
        registry.register(sampleHash, "ipfs://QmSample");

        (bool valid, ) = registry.isValid(sampleHash);
        assertTrue(valid);
    }

    function testRevoke() public {
        vm.prank(issuer);
        registry.register(sampleHash, "ipfs://QmSample");

        vm.prank(issuer);
        registry.revoke(sampleHash);

        (bool valid, bool revoked) = registry.isValid(sampleHash);
        assertFalse(valid);
        assertTrue(revoked);
    }

    function testOnlyIssuer() public {
        vm.expectRevert("Only issuer can register");
        registry.register(sampleHash, "ipfs://QmSample");
    }
}