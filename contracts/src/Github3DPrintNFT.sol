// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract GridGit is ERC721, Ownable, ERC721Burnable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public publicMintEnabled;
    uint256 public mintPrice = 0.00001 ether;

    error NotOwner();
    error NotBurnable();
    error MintDisabled();
    error AlreadyMinted();
    error InsufficientPayment();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        publicMintEnabled = true;
        _baseTokenURI = baseURI_;
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

    function publicMintDeterministic(uint256 tokenId) external payable returns (uint256) {
        if (!publicMintEnabled) revert MintDisabled();
        if (msg.value < mintPrice) revert InsufficientPayment();
        if (_ownerOf(tokenId) != address(0)) revert AlreadyMinted();
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
    }
}
