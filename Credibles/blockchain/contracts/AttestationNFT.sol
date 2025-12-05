// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AttestationNFT
 * @dev Separate contract for Attestation NFTs issued by verified issuers
 * These are static showcase NFTs that represent achievements/completions
 */
contract AttestationNFT is ERC721, Ownable {
    // ============ Attestation Data Struct ============
    struct AttestationData {
        address issuer;
        string category;
        uint256 timestamp;
        string issuerInfo;
        string title; // e.g., "Completed React Course", "Earned DeFi Certification"
    }

    // ============ Mappings ============
    mapping(uint256 => AttestationData) public attestationData; // tokenId => attestation data
    mapping(address => uint256[]) public userAttestations; // resume wallet => array of attestation tokenIds
    
    // Reference to CrediblesV2 for issuer verification
    address public crediblesV2Contract;

    // ============ Admin Management ============
    mapping(address => bool) public admins; // admin address => is admin

    // ============ Token ID Management ============
    uint256 public nextTokenId = 1;

    // ============ Events ============
    event AttestationNFTMinted(
        address indexed recipient,
        address indexed issuer,
        uint256 indexed tokenId,
        string category,
        string title
    );
    event CrediblesV2ContractUpdated(address indexed oldContract, address indexed newContract);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    constructor(address initialOwner, address _crediblesV2Contract) ERC721("Credibles Attestation", "CREDATT") Ownable(initialOwner) {
        crediblesV2Contract = _crediblesV2Contract;
    }

    // ============ Admin Management Functions ============

    /**
     * @dev Modifier to allow owner or admin
     */
    modifier onlyOwnerOrAdmin() {
        require(owner() == msg.sender || admins[msg.sender], "Not owner or admin");
        _;
    }

    /**
     * @dev Owner can add an admin
     */
    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid address");
        require(!admins[admin], "Already an admin");
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @dev Owner can remove an admin
     */
    function removeAdmin(address admin) external onlyOwner {
        require(admins[admin], "Not an admin");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    /**
     * @dev Set the CrediblesV2 contract address (for issuer verification)
     */
    function setCrediblesV2Contract(address _crediblesV2Contract) external onlyOwnerOrAdmin {
        address oldContract = crediblesV2Contract;
        crediblesV2Contract = _crediblesV2Contract;
        emit CrediblesV2ContractUpdated(oldContract, _crediblesV2Contract);
    }

    /**
     * @dev Check if an address is a verified issuer (via CrediblesV2)
     */
    function isVerifiedIssuer(address issuer) public view returns (bool) {
        if (crediblesV2Contract == address(0)) {
            return false;
        }
        
        // Call CrediblesV2 to check issuer status
        // ABI: function isVerifiedIssuer(address issuer) view returns (bool)
        (bool success, bytes memory data) = crediblesV2Contract.staticcall(
            abi.encodeWithSignature("isVerifiedIssuer(address)", issuer)
        );
        
        if (!success || data.length == 0) {
            return false;
        }
        
        return abi.decode(data, (bool));
    }

    /**
     * @dev Create and mint attestation NFT (only verified issuers)
     * Attestation NFTs are static showcase NFTs - they don't add XP
     */
    function createAttestationNFT(
        address recipient,
        string memory category,
        string memory title,
        string memory issuerInfo
    ) external {
        require(isVerifiedIssuer(msg.sender), "Not a verified issuer");
        require(recipient != address(0), "Invalid recipient");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _mint(recipient, tokenId);

        attestationData[tokenId] = AttestationData({
            issuer: msg.sender,
            category: category,
            timestamp: block.timestamp,
            issuerInfo: issuerInfo,
            title: title
        });

        userAttestations[recipient].push(tokenId);

        emit AttestationNFTMinted(recipient, msg.sender, tokenId, category, title);
    }

    /**
     * @dev Get all attestation token IDs for a user
     */
    function getUserAttestations(address user) external view returns (uint256[] memory) {
        return userAttestations[user];
    }

    /**
     * @dev Get attestation data for a token ID
     */
    function getAttestationData(uint256 tokenId) external view returns (AttestationData memory) {
        return attestationData[tokenId];
    }

    /**
     * @dev Get attestation data fields separately (for easier frontend access)
     */
    function getAttestationInfo(uint256 tokenId) external view returns (
        address issuer,
        string memory category,
        uint256 timestamp,
        string memory issuerInfo,
        string memory title
    ) {
        AttestationData memory data = attestationData[tokenId];
        return (data.issuer, data.category, data.timestamp, data.issuerInfo, data.title);
    }

    // ============ Soulbound Override ============

    /**
     * @dev Override to make NFTs soulbound (non-transferable)
     * Allows minting (from == address(0)) and burning (to == address(0))
     * Prevents all transfers between non-zero addresses
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        // Get the current owner of the token
        // For non-existent tokens, _ownerOf returns address(0)
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) && burning (to == address(0))
        // Prevent transfers between non-zero addresses
        // This check allows:
        // 1. Minting: from == address(0) && to != address(0)
        // 2. Burning: from != address(0) && to == address(0)
        // 3. Rejects: from != address(0) && to != address(0) (transfers)
        if (from != address(0) && to != address(0)) {
            revert("AttestationNFT: Soulbound token - transfers not allowed");
        }

        return super._update(to, tokenId, auth);
    }
}

