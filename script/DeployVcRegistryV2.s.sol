// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VcRegistryV2} from "../contracts/VcRegistryV2.sol";

contract DeployVcRegistryV2 is Script {
    function run() external {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get issuer address from environment variable (or use deployer as issuer)
        address issuer = vm.envOr("ISSUER_ADDRESS", address(0));
        if (issuer == address(0)) {
            // If no issuer specified, use deployer address
            issuer = vm.addr(deployerPrivateKey);
            console.log("No ISSUER_ADDRESS set, using deployer as issuer:", issuer);
        } else {
            console.log("Using issuer address:", issuer);
        }

        // Get RPC URL from environment
        string memory rpcUrl = vm.envString("RPC_URL");
        
        // Get chain ID
        uint256 chainId = vm.envUint("CHAIN_ID");
        
        console.log("Deploying VcRegistryV2...");
        console.log("Chain ID:", chainId);
        console.log("RPC URL:", rpcUrl);
        console.log("Issuer:", issuer);
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        VcRegistryV2 registry = new VcRegistryV2(issuer);

        console.log("VcRegistryV2 deployed at:", address(registry));
        console.log("Initial Issuer:", registry.initialIssuer());
        console.log("Owner:", registry.owner());

        vm.stopBroadcast();

        // Save deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("Contract Address:", address(registry));
        console.log("Network: Arbitrum Sepolia (Chain ID:", chainId, ")");
        console.log("Issuer Address:", issuer);
        console.log("\nUpdate your .env file with:");
        console.log("NEXT_PUBLIC_CERT_REGISTRY_ADDRESS=", address(registry));
    }
}


