// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/CertificateRegistry.sol";

/**
 * @title Verify CertificateRegistry Contract
 * @notice Verifies the CertificateRegistry contract on Arbitrum Sepolia
 * 
 * Usage:
 *   forge script script/Verify.s.sol:Verify --rpc-url arbitrum_sepolia --broadcast --verify -vvvv
 * 
 * Environment Variables Required:
 *   - NEXT_PUBLIC_CERT_REGISTRY_ADDRESS: The deployed contract address
 *   - ISSUER: The issuer address used in constructor (same as deployment)
 *   - ARBISCAN_API_KEY: Your Arbiscan API key for verification
 */
contract Verify is Script {
    function run() external {
        // Get contract address from environment
        address contractAddress = vm.envAddress("NEXT_PUBLIC_CERT_REGISTRY_ADDRESS");
        
        // Get issuer address (constructor argument)
        address issuer = vm.envAddress("ISSUER");
        
        // Get Arbiscan API key
        string memory arbiscanApiKey = vm.envString("ARBISCAN_API_KEY");
        
        console2.log("==========================================");
        console2.log("Verifying CertificateRegistry Contract");
        console2.log("==========================================");
        console2.log("Contract Address:", contractAddress);
        console2.log("Network: Arbitrum Sepolia");
        console2.log("Issuer (Constructor Arg):", issuer);
        console2.log("==========================================");
        
        // Verify the contract
        // Note: This script prepares the verification command
        // Actual verification is done via forge verify-contract command
        
        // Encode constructor arguments
        bytes memory constructorArgs = abi.encode(issuer);
        
        console2.log("\nTo verify the contract, run:");
        console2.log("forge verify-contract \\");
        console2.log("  ", contractAddress);
        console2.log("  src/CertificateRegistry.sol:CertificateRegistry \\");
        console2.log("  --chain-id 421614 \\");
        console2.log("  --etherscan-api-key", arbiscanApiKey);
        console2.log("  --constructor-args", vm.toString(constructorArgs));
        console2.log("  --rpc-url https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY");
        
        console2.log("\nOr use the automated verification:");
        console2.log("forge verify-contract \\");
        console2.log("  ", contractAddress, " \\");
        console2.log("  src/CertificateRegistry.sol:CertificateRegistry \\");
        console2.log("  --chain-id 421614 \\");
        console2.log("  --etherscan-api-key", arbiscanApiKey, " \\");
        console2.log("  --constructor-args $(cast abi-encode \"constructor(address)\"", issuer, ") \\");
        console2.log("  --rpc-url arbitrum_sepolia");
        
        console2.log("\n==========================================");
        console2.log("Verification command prepared!");
        console2.log("==========================================");
    }
}


