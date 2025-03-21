// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIFollowerNFT
 * @dev This contract mints AI followers as NFTs
 */
contract AIFollowerNFT is ERC721, ERC721URIStorage, Ownable {
    // Mapping from token ID to existence
    mapping(uint256 => bool) private _exists;

    constructor() ERC721("AIFollower", "AIFOL") Ownable(msg.sender) {}

    /**
     * @dev Mints a new token
     * @param to The address that will own the NFT
     * @param tokenId The unique token ID (matching the AI follower ID)
     * @param uri The metadata URI for the NFT
     */
    function mint(address to, uint256 tokenId, string memory uri) public onlyOwner {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _exists[tokenId] = true;
    }
    
    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     * @return bool Whether the token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists[tokenId];
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}