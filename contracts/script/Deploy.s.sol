// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {GridGit} from "../src/GridGit.sol";

contract Deploy is Script {
    function run() public {
        address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        string memory baseUri = vm.envOr("BASE_URI", string("https://gridgit.halaprix.com/api/nft/"));
        string memory name_ = vm.envOr("NAME", string("GridGit"));
        string memory symbol_ = vm.envOr("SYMBOL", string("POWS"));

        vm.startBroadcast(deployer);
        GridGit nft = new GridGit(name_, symbol_, baseUri, deployer);
        vm.stopBroadcast();

        // Log address
        console2.log("GridGit deployed at:", address(nft));
    }
}
