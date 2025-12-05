// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrediblesV2 is ERC721, Ownable {
    // ============ SkillPet NFT Structs ============
    struct Stats {
        uint256 dev;
        uint256 defi;
        uint256 gov;
        uint256 social;
    }

    struct SkillPetTraits {
        string traitType;
        string value;
    }

    // ============ Attestation NFT Struct ============
    struct AttestationData {
        address issuer;
        string category;
        uint256 timestamp;
        string issuerInfo;
        string title; // e.g., "Completed React Course", "Earned DeFi Certification"
    }

    // ============ SkillPet Mappings ============
    mapping(uint256 => Stats) public skillPetStats; // tokenId => stats
    mapping(uint256 => SkillPetTraits[]) public skillPetTraits; // tokenId => traits array
    mapping(address => uint256) public userToSkillPet; // user resume wallet => SkillPet tokenId
    mapping(address => bool) public hasSkillPet; // resume wallet => has minted

    // ============ Attestation NFT Mappings ============
    mapping(uint256 => AttestationData) public attestationData; // tokenId => attestation data
    mapping(address => uint256[]) public userAttestations; // resume wallet => array of attestation tokenIds

    // ============ Issuer Management ============
    mapping(address => bool) public verifiedIssuers; // issuer address => verified
    mapping(string => bool) public verifiedDomains; // email domain => verified
    mapping(address => string) public issuerDomain; // issuer => domain
    mapping(address => string) public pendingVerifications; // issuer => domain (pending)

    // ============ Base Account Integration ============
    mapping(address => address) public userToResumeWallet; // main wallet => resume wallet (Base Account sub-account)
    mapping(address => address) public resumeWalletToUser; // resume wallet => main wallet

    // ============ Token ID Management ============
    uint256 public nextSkillPetId = 1;
    uint256 public nextAttestationId = 1;

    // ============ Events ============
    event SkillPetMinted(address indexed user, address indexed resumeWallet, uint256 indexed tokenId);
    event SkillPetTraitUpdated(uint256 indexed tokenId, string traitType, string value);
    event LevelUp(uint256 indexed tokenId, string category, uint256 newLevel);
    event XPAdded(uint256 indexed tokenId, string category, uint256 amount, address addedBy);
    event AttestationNFTMinted(
        address indexed recipient,
        address indexed issuer,
        uint256 indexed tokenId,
        string category,
        string title
    );
    event IssuerVerified(address indexed issuer, string domain);
    event IssuerVerificationRequested(address indexed issuer, string domain);
    event ResumeWalletRegistered(address indexed user, address indexed resumeWallet);

    constructor(address initialOwner) ERC721("Credibles V2", "CRED2") Ownable(initialOwner) {}

    // ============ Issuer Management Functions ============

    /**
     * @dev Request issuer verification with email domain
     */
    function requestIssuerVerification(string memory emailDomain) external {
        require(bytes(emailDomain).length > 0, "Domain cannot be empty");
        require(!verifiedIssuers[msg.sender], "Already verified");
        require(bytes(pendingVerifications[msg.sender]).length == 0, "Verification already pending");

        pendingVerifications[msg.sender] = emailDomain;
        emit IssuerVerificationRequested(msg.sender, emailDomain);
    }

    /**
     * @dev Owner can verify an issuer and their domain
     */
    function verifyIssuer(address issuer, string memory emailDomain) external onlyOwner {
        require(bytes(emailDomain).length > 0, "Domain cannot be empty");
        require(!verifiedIssuers[issuer], "Already verified");

        verifiedIssuers[issuer] = true;
        verifiedDomains[emailDomain] = true;
        issuerDomain[issuer] = emailDomain;
        delete pendingVerifications[issuer];

        emit IssuerVerified(issuer, emailDomain);
    }

    /**
     * @dev Owner can verify a domain (for bulk verification)
     */
    function verifyDomain(string memory emailDomain) external onlyOwner {
        require(bytes(emailDomain).length > 0, "Domain cannot be empty");
        verifiedDomains[emailDomain] = true;
    }

    /**
     * @dev Check if an address is a verified issuer
     */
    function isVerifiedIssuer(address issuer) external view returns (bool) {
        return verifiedIssuers[issuer];
    }

    // ============ Resume Wallet Registration ============

    /**
     * @dev Register a Base Account sub-account as resume wallet
     */
    function registerResumeWallet(address resumeWallet) external {
        require(resumeWallet != address(0), "Invalid resume wallet");
        require(userToResumeWallet[msg.sender] == address(0), "Resume wallet already registered");
        require(resumeWalletToUser[resumeWallet] == address(0), "Resume wallet already in use");

        userToResumeWallet[msg.sender] = resumeWallet;
        resumeWalletToUser[resumeWallet] = msg.sender;

        emit ResumeWalletRegistered(msg.sender, resumeWallet);
    }

    /**
     * @dev Get resume wallet for a user
     */
    function getResumeWallet(address user) external view returns (address) {
        return userToResumeWallet[user];
    }

    // ============ SkillPet NFT Functions ============

    /**
     * @dev Mint SkillPet NFT to resume wallet
     */
    function mintSkillPet(address resumeWallet) external {
        require(resumeWallet != address(0), "Invalid resume wallet");
        require(!hasSkillPet[resumeWallet], "Already has SkillPet");
        require(
            resumeWalletToUser[resumeWallet] == msg.sender || userToResumeWallet[msg.sender] == resumeWallet,
            "Not authorized for this resume wallet"
        );

        uint256 tokenId = nextSkillPetId;
        nextSkillPetId++;

        _mint(resumeWallet, tokenId);
        userToSkillPet[resumeWallet] = tokenId;
        hasSkillPet[resumeWallet] = true;

        emit SkillPetMinted(msg.sender, resumeWallet, tokenId);
    }

    /**
     * @dev Add XP to SkillPet (for daily tasks)
     */
    function addXPDirect(
        address resumeWallet,
        string memory category,
        uint256 amount
    ) external {
        require(hasSkillPet[resumeWallet], "No SkillPet found");
        require(
            resumeWalletToUser[resumeWallet] == msg.sender || userToResumeWallet[msg.sender] == resumeWallet,
            "Not authorized"
        );

        uint256 tokenId = userToSkillPet[resumeWallet];
        _addXPInternal(tokenId, category, amount);
    }

    /**
     * @dev Update SkillPet traits (for daily tasks)
     */
    function updateSkillPetTraits(
        address resumeWallet,
        string memory traitType,
        string memory value
    ) external {
        require(hasSkillPet[resumeWallet], "No SkillPet found");
        require(
            resumeWalletToUser[resumeWallet] == msg.sender || userToResumeWallet[msg.sender] == resumeWallet,
            "Not authorized"
        );

        uint256 tokenId = userToSkillPet[resumeWallet];
        
        // Check if trait already exists, update it
        bool found = false;
        for (uint256 i = 0; i < skillPetTraits[tokenId].length; i++) {
            if (keccak256(bytes(skillPetTraits[tokenId][i].traitType)) == keccak256(bytes(traitType))) {
                skillPetTraits[tokenId][i].value = value;
                found = true;
                break;
            }
        }

        // If trait doesn't exist, add it
        if (!found) {
            skillPetTraits[tokenId].push(SkillPetTraits(traitType, value));
        }

        emit SkillPetTraitUpdated(tokenId, traitType, value);
    }

    /**
     * @dev Get SkillPet token ID for a resume wallet
     */
    function getSkillPetTokenId(address resumeWallet) external view returns (uint256) {
        return userToSkillPet[resumeWallet];
    }

    /**
     * @dev Get all traits for a SkillPet
     */
    function getSkillPetTraits(uint256 tokenId) external view returns (SkillPetTraits[] memory) {
        return skillPetTraits[tokenId];
    }

    // ============ Attestation NFT Functions ============

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
        require(verifiedIssuers[msg.sender], "Not a verified issuer");
        require(recipient != address(0), "Invalid recipient");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 tokenId = nextAttestationId;
        nextAttestationId++;

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

    // ============ Internal Functions ============

    /**
     * @dev Internal function to handle XP addition
     */
    function _addXPInternal(
        uint256 tokenId,
        string memory category,
        uint256 amount
    ) internal {
        bytes32 categoryHash = keccak256(bytes(category));
        uint256 oldXP;
        uint256 newXP;

        if (categoryHash == keccak256(bytes("dev"))) {
            oldXP = skillPetStats[tokenId].dev;
            skillPetStats[tokenId].dev += amount;
            newXP = skillPetStats[tokenId].dev;
        } else if (categoryHash == keccak256(bytes("defi"))) {
            oldXP = skillPetStats[tokenId].defi;
            skillPetStats[tokenId].defi += amount;
            newXP = skillPetStats[tokenId].defi;
        } else if (categoryHash == keccak256(bytes("gov"))) {
            oldXP = skillPetStats[tokenId].gov;
            skillPetStats[tokenId].gov += amount;
            newXP = skillPetStats[tokenId].gov;
        } else if (categoryHash == keccak256(bytes("social"))) {
            oldXP = skillPetStats[tokenId].social;
            skillPetStats[tokenId].social += amount;
            newXP = skillPetStats[tokenId].social;
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

    // ============ Soulbound Override ============

    /**
     * @dev Override to make NFTs soulbound (non-transferable)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        require(
            from == address(0) || to == address(0),
            "CrediblesV2: Soulbound token - transfers not allowed"
        );

        return super._update(to, tokenId, auth);
    }
}

