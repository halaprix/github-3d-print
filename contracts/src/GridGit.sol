// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract GridGit is ERC721, Ownable, ERC721Burnable {
    using EnumerableSet for EnumerableSet.UintSet;

    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public publicMintEnabled;
    EnumerableSet.UintSet private _mintedTokens;
    uint256 public mintPrice;

    error GridGit__NotOwner();
    error GridGit__NotBurnable();
    error GridGit__MintDisabled();
    error GridGit__AlreadyMinted();
    error GridGit__InsufficientPayment();
    error GridGit__WithdrawFailed();

    constructor(string memory name_, string memory symbol_, string memory baseURI_, address initialOwner)
        ERC721(name_, symbol_)
        Ownable(initialOwner)
    {
        publicMintEnabled = true;
        _baseTokenURI = baseURI_;
    }

    function mintedTokens() external view returns (uint256[] memory) {
        return _mintedTokens.values();
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
        if (!publicMintEnabled) revert GridGit__MintDisabled();
        if (_ownerOf(tokenId) != address(0)) revert GridGit__AlreadyMinted();
        _safeMint(msg.sender, tokenId);
        _mintedTokens.add(tokenId);
        return tokenId;
    }

    function publicMintDeterministicTo(uint256 tokenId, address to) external payable returns (uint256) {
        if (!publicMintEnabled) revert GridGit__MintDisabled();
        if (_ownerOf(tokenId) != address(0)) revert GridGit__AlreadyMinted();
        _safeMint(to, tokenId);
        _mintedTokens.add(tokenId);
        return tokenId;
    }

    function burn(uint256 tokenId) public override {
        _mintedTokens.remove(tokenId);
        super.burn(tokenId);
    }

    function withdraw() external onlyOwner {
        (bool success,) = owner().call{value: address(this).balance}("");
        if (!success) revert GridGit__WithdrawFailed();
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
    }
}
