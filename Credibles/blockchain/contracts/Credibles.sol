// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Credibles
 * @notice Soulbound ERC-721 NFT representing a user's "SkillPet" that evolves with attestations
 * @dev Transfers are disabled except for minting (from address(0)) and burning (to address(0))
 */
contract Credibles is ERC721URIStorage, Ownable {
    /// @notice Stats structure tracking XP across different categories
    struct Stats {
        uint256 dev;
        uint256 defi;
        uint256 gov;
        uint256 social;
    }

    /// @notice Mapping from token ID to character stats
    mapping(uint256 => Stats) public characterStats;
    
    /// @notice Mapping from token ID to current level
    mapping(uint256 => uint256) public levels;
    
    /// @notice Address authorized to call addXP (AttestationResolver)
    address public attestationResolver;
    
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;

    /// @notice Emitted when a SkillPet evolves (XP added)
    event SkillPetEvolved(
        uint256 indexed tokenId,
        string category,
        uint256 newXP,
        uint256 newLevel
    );

    /// @notice Emitted when a stat crosses 100 XP threshold
    event LevelUp(
        uint256 indexed tokenId,
        string category,
        uint256 newLevel
    );

    /// @notice Emitted when attestation resolver is updated
    event AttestationResolverUpdated(address indexed oldResolver, address indexed newResolver);

    modifier onlyAttestationResolver() {
        require(msg.sender == attestationResolver, "Credibles: caller is not the AttestationResolver");
        _;
    }

    constructor(address initialOwner) ERC721("Credibles SkillPet", "SKILLPET") Ownable(initialOwner) {
        _tokenIdCounter = 1; // Start token IDs at 1
    }

    /**
     * @notice Set the AttestationResolver address (only owner)
     * @param _resolver Address of the AttestationResolver contract
     */
    function setAttestationResolver(address _resolver) external onlyOwner {
        address oldResolver = attestationResolver;
        attestationResolver = _resolver;
        emit AttestationResolverUpdated(oldResolver, _resolver);
    }

    /**
     * @notice Mint a new SkillPet NFT to the specified address
     * @param to Address to mint the NFT to
     * @param tokenURI Initial metadata URI for the NFT
     */
    function mint(address to, string memory tokenURI) external onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Initialize stats at 0
        characterStats[tokenId] = Stats({
            dev: 0,
            defi: 0,
            gov: 0,
            social: 0
        });
        
        levels[tokenId] = 1;
        _tokenIdCounter++;
    }

    /**
     * @notice Add XP to a specific category for a token
     * @param tokenId The token ID to add XP to
     * @param category The category string ("dev", "defi", "gov", "social")
     * @param amount The amount of XP to add
     * @dev Only callable by AttestationResolver
     */
    function addXP(uint256 tokenId, string memory category, uint256 amount) external onlyAttestationResolver {
        require(_ownerOf(tokenId) != address(0), "Credibles: token does not exist");
        require(amount > 0, "Credibles: amount must be greater than 0");

        Stats storage stats = characterStats[tokenId];
        uint256 oldXP;
        uint256 newXP;
        uint256 oldLevel = levels[tokenId];
        uint256 newLevel = oldLevel;

        // Map category string to stat field and increment
        if (keccak256(bytes(category)) == keccak256(bytes("dev"))) {
            oldXP = stats.dev;
            stats.dev += amount;
            newXP = stats.dev;
        } else if (keccak256(bytes(category)) == keccak256(bytes("defi"))) {
            oldXP = stats.defi;
            stats.defi += amount;
            newXP = stats.defi;
        } else if (keccak256(bytes(category)) == keccak256(bytes("gov"))) {
            oldXP = stats.gov;
            stats.gov += amount;
            newXP = stats.gov;
        } else if (keccak256(bytes(category)) == keccak256(bytes("social"))) {
            oldXP = stats.social;
            stats.social += amount;
            newXP = stats.social;
        } else {
            revert("Credibles: invalid category");
        }

        // Check if XP crossed 100 threshold (level up)
        if (oldXP < 100 && newXP >= 100) {
            newLevel = oldLevel + 1;
            levels[tokenId] = newLevel;
            emit LevelUp(tokenId, category, newLevel);
        }

        emit SkillPetEvolved(tokenId, category, newXP, newLevel);
    }

    /**
     * @notice Get all stats for a token
     * @param tokenId The token ID
     * @return stats The Stats struct containing all category XP values
     */
    function getStats(uint256 tokenId) external view returns (Stats memory stats) {
        return characterStats[tokenId];
    }

    /**
     * @notice Override _update to enforce soulbound behavior
     * @dev Only allows transfers from address(0) (minting) or to address(0) (burning)
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Revert all other transfers
        require(
            from == address(0) || to == address(0),
            "Credibles: token is soulbound and cannot be transferred"
        );
        
        return super._update(to, tokenId, auth);
    }
}

