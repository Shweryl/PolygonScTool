// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OneOfOneNFT {
    // Events (ERC721 requires Transfer event at minimum)
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    string public name = "OneOfOneNFT";
    string public symbol = "OOONFT";

    // Store owner of the single token
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    // Token ID constant (only one NFT exists)
    uint256 public constant TOKEN_ID = 1;

    constructor() {
        // Mint 1 NFT directly to deployer
        address deployer = msg.sender;
        _owners[TOKEN_ID] = deployer;
        _balances[deployer] = 1;

        emit Transfer(address(0), deployer, TOKEN_ID);
    }

    // Standard ERC721-like helpers
    function ownerOf(uint256 tokenId) public view returns (address) {
        require(tokenId == TOKEN_ID, "This NFT does not exist");
        return _owners[tokenId];
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Zero address not valid");
        return _balances[owner];
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiCollectionNFT {
    string public name = "MultiCollectionNFT";
    string public symbol = "MCNFT";

    uint256 private _nextTokenId;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs; // metadata per NFT
    mapping(uint256 => uint256) public tokenCollection; // tokenId => collectionId

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function mint(address to, uint256 collectionId, string memory tokenURI) public {
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenURIs[tokenId] = tokenURI;
        tokenCollection[tokenId] = collectionId;

        emit Transfer(address(0), to, tokenId);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _owners[tokenId];
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Zero address not allowed");
        return _balances[owner];
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }
}