// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/CertificateRegistry.sol";

contract AuthorizeIssuer is Script {
    function run() external {
        // Get configuration from environment variables
        address issuerToAuthorize = vm.envAddress("ISSUER_TO_AUTHORIZE");
        address contractAddress = vm.envAddress("NEXT_PUBLIC_CERT_REGISTRY_ADDRESS");
        uint256 ownerPrivateKey = vm.envUint("OWNER_PRIVATE_KEY");

        console2.log("Authorizing issuer on CertificateRegistry...");
        console2.log("Contract address:", contractAddress);
        console2.log("Issuer to authorize:", issuerToAuthorize);

        vm.startBroadcast(ownerPrivateKey);
        
        CertificateRegistry registry = CertificateRegistry(contractAddress);
        registry.authorizeIssuer(issuerToAuthorize);
        
        vm.stopBroadcast();

        console2.log("==========================================");
        console2.log("Authorization successful!");
        console2.log("Issuer authorized:", issuerToAuthorize);
        console2.log("==========================================");
    }
}
