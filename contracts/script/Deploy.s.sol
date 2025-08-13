// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Github3DPrintNFT} from "../src/Github3DPrintNFT.sol";

contract Deploy is Script {
    function run() public {
        address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        string memory baseUri = vm.envOr("BASE_URI", string("https://github-3d-print.vercel.app/api/nft/"));
        string memory name_ = vm.envOr("NAME", string("Proof of Work Squares"));
        string memory symbol_ = vm.envOr("SYMBOL", string("POWS"));

        vm.startBroadcast(deployer);
        Github3DPrintNFT nft = new Github3DPrintNFT(name_, symbol_, baseUri, deployer);
        vm.stopBroadcast();

        // Log address
        console2.log("Github3DPrintNFT deployed at:", address(nft));
    }
}
