// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/CertificateRegistry.sol";

contract Deploy is Script {
    function run() external {
        // Get configuration from environment variables
        address issuer = vm.envAddress("ISSUER");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console2.log("Deploying CertificateRegistry...");
        console2.log("Network: Arbitrum Sepolia");
        console2.log("Issuer address:", issuer);

        vm.startBroadcast(deployerPrivateKey);
        
        CertificateRegistry registry = new CertificateRegistry(issuer);
        
        vm.stopBroadcast();

        console2.log("==========================================");
        console2.log("Deployment successful!");
        console2.log("CertificateRegistry deployed at:", address(registry));
        console2.log("Issuer set to:", issuer);
        console2.log("==========================================");
    }
}



