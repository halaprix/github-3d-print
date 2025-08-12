// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Github3DPrintNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public publicMintEnabled;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        _baseTokenURI = baseURI_;
    }

    function safeMint(address to) external onlyOwner returns (uint256 tokenId) {
        unchecked {
            tokenId = ++_nextTokenId;
        }
        _safeMint(to, tokenId);
        return tokenId;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }

    function setPublicMintEnabled(bool enabled) external onlyOwner {
        publicMintEnabled = enabled;
    }

    function publicMint() external returns (uint256 tokenId) {
        require(publicMintEnabled, "mint disabled");
        unchecked {
            tokenId = ++_nextTokenId;
        }
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }

    function publicMintDeterministic(uint256 tokenId) external returns (uint256) {
        require(publicMintEnabled, "mint disabled");
        require(_ownerOf(tokenId) == address(0), "already minted");
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }
}
