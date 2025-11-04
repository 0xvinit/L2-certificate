// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/CertificateRegistry.sol";

contract Deploy is Script {
    function run() external {
        address issuer = vm.envAddress("ISSUER");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        CertificateRegistry registry = new CertificateRegistry(issuer);
        vm.stopBroadcast();

        console2.log("CertificateRegistry deployed at:", address(registry));
        console2.log("Issuer set to:", issuer);
    }
}


