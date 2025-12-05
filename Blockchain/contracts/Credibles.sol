// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Credibles is ERC721, Ownable {
    struct Stats {
        uint256 dev;
        uint256 defi;
        uint256 gov;
        uint256 social;
    }

    mapping(uint256 => Stats) public characterStats;
    mapping(address => uint256) public addressToTokenId; // Track which token each address owns
    mapping(address => bool) public hasMinted; // Track if address has minted
    uint256 public nextTokenId = 1; // Auto-incrementing token ID
    address public attestationResolver;
    
    event LevelUp(uint256 indexed tokenId, string category, uint256 newLevel);
    event XPAdded(uint256 indexed tokenId, string category, uint256 amount, address addedBy);

    constructor(address initialOwner) ERC721("Credibles", "CRED") Ownable(initialOwner) {}

    function setAttestationResolver(address _resolver) external onlyOwner {
        attestationResolver = _resolver;
    }

    function addXP(
        uint256 tokenId,
        string memory category,
        uint256 amount
    ) external {
        require(msg.sender == attestationResolver, "Only AttestationResolver can add XP");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _addXPInternal(tokenId, category, amount);
    }

    // Public function to add XP directly (for daily tasks)
    function addXPDirect(
        string memory category,
        uint256 amount
    ) external {
        require(hasMinted[msg.sender], "You must mint an NFT first");
        uint256 tokenId = addressToTokenId[msg.sender];
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _addXPInternal(tokenId, category, amount);
    }

    // Internal function to handle XP addition logic
    function _addXPInternal(
        uint256 tokenId,
        string memory category,
        uint256 amount
    ) internal {
        bytes32 categoryHash = keccak256(bytes(category));
        uint256 oldXP;
        uint256 newXP;

        if (categoryHash == keccak256(bytes("dev"))) {
            oldXP = characterStats[tokenId].dev;
            characterStats[tokenId].dev += amount;
            newXP = characterStats[tokenId].dev;
        } else if (categoryHash == keccak256(bytes("defi"))) {
            oldXP = characterStats[tokenId].defi;
            characterStats[tokenId].defi += amount;
            newXP = characterStats[tokenId].defi;
        } else if (categoryHash == keccak256(bytes("gov"))) {
            oldXP = characterStats[tokenId].gov;
            characterStats[tokenId].gov += amount;
            newXP = characterStats[tokenId].gov;
        } else if (categoryHash == keccak256(bytes("social"))) {
            oldXP = characterStats[tokenId].social;
            characterStats[tokenId].social += amount;
            newXP = characterStats[tokenId].social;
        } else {
            revert("Invalid category");
        }

        emit XPAdded(tokenId, category, amount, msg.sender);

        // Check for level up (crossing 100 threshold)
        uint256 oldLevel = oldXP / 100;
        uint256 newLevel = newXP / 100;
        if (newLevel > oldLevel) {
            emit LevelUp(tokenId, category, newLevel);
        }
    }

    // Owner-only mint (for backwards compatibility)
    function mint(address to, uint256 tokenId) external onlyOwner {
        require(!hasMinted[to], "Address already has an NFT");
        require(addressToTokenId[to] == 0, "Address already has a token");
        _mint(to, tokenId);
        addressToTokenId[to] = tokenId;
        hasMinted[to] = true;
        if (tokenId >= nextTokenId) {
            nextTokenId = tokenId + 1;
        }
    }

    // Public mint function - anyone can mint one NFT
    function publicMint() external {
        require(!hasMinted[msg.sender], "You already have an NFT");
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _mint(msg.sender, tokenId);
        addressToTokenId[msg.sender] = tokenId;
        hasMinted[msg.sender] = true;
    }

    // Get token ID for an address
    function getTokenId(address owner) external view returns (uint256) {
        return addressToTokenId[owner];
    }

    // Soulbound: Override _update to prevent transfers
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        require(
            from == address(0) || to == address(0),
            "Credibles: Soulbound token - transfers not allowed"
        );

        return super._update(to, tokenId, auth);
    }
}

