// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IEAS.sol";
import "./ISchemaRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AttestationResolver
 * @notice EAS SchemaResolver that processes attestations and updates CrediblesV2 NFTs
 * @dev When an attestation is created, this resolver decodes the data and calls CrediblesV2.addXP
 *      and also mints an AttestationNFT
 */
interface ICrediblesV2 {
    function addXP(uint256 tokenId, string memory category, uint256 amount) external;
    function getSkillPetTokenId(address resumeWallet) external view returns (uint256);
}

interface IAttestationNFT {
    function createAttestationNFTFromEAS(
        address recipient,
        address issuer,
        string memory category,
        string memory title,
        string memory issuerInfo
    ) external;
}

contract AttestationResolver is Ownable {
    IEAS public immutable eas;
    ISchemaRegistry public immutable schemaRegistry;
    ICrediblesV2 public immutable credibles;
    IAttestationNFT public attestationNFT;
    bytes32 public schemaUID;

    // ============ Admin Management ============
    mapping(address => bool) public admins; // admin address => is admin

    /// @notice Emitted when an attestation is processed
    event AttestationProcessed(
        bytes32 indexed attestationUID,
        uint256 indexed tokenId,
        string category,
        uint256 xpValue
    );
    event AttestationNFTSet(address indexed oldContract, address indexed newContract);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    /**
     * @notice Constructor
     * @param _eas The EAS contract address (Base Sepolia: 0x4200000000000000000000000000000000000021)
     * @param _schemaRegistry The SchemaRegistry contract address (Base Sepolia: 0x4200000000000000000000000000000000000020)
     * @param _credibles The CrediblesV2 contract address
     * @param _attestationNFT The AttestationNFT contract address
     * @param _initialOwner The initial owner of the contract
     */
    constructor(
        address _eas,
        address _schemaRegistry,
        address _credibles,
        address _attestationNFT,
        address _initialOwner
    ) Ownable(_initialOwner) {
        eas = IEAS(_eas);
        schemaRegistry = ISchemaRegistry(_schemaRegistry);
        credibles = ICrediblesV2(_credibles);
        attestationNFT = IAttestationNFT(_attestationNFT);

        // Register schema: "uint256 studentId, string category, uint256 xpValue, string title, string issuerInfo"
        schemaUID = schemaRegistry.register(
            "uint256 studentId, string category, uint256 xpValue, string title, string issuerInfo",
            address(this),
            true
        );
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
     * @dev Set the AttestationNFT contract address (owner or admin)
     */
    function setAttestationNFT(address _attestationNFT) external onlyOwnerOrAdmin {
        address oldContract = address(attestationNFT);
        attestationNFT = IAttestationNFT(_attestationNFT);
        emit AttestationNFTSet(oldContract, _attestationNFT);
    }

    /**
     * @notice Called by EAS when an attestation is created
     * @param uid The attestation UID
     * @param schema The schema UID
     * @param recipient The recipient address (resume wallet)
     * @param data The attestation data
     * @return Whether the attestation is valid
     */
    function onAttest(
        bytes32 uid,
        bytes32 schema,
        address recipient,
        bytes calldata data
    ) external returns (bool) {
        // Verify this is called by EAS
        require(msg.sender == address(eas), "Only EAS can call this");

        // Decode the attestation data
        // Data format: abi.encode(uint256 studentId, string category, uint256 xpValue, string title, string issuerInfo)
        (uint256 studentId, string memory category, uint256 xpValue, string memory title, string memory issuerInfo) = abi.decode(
            data,
            (uint256, string, uint256, string, string)
        );

        // Call CrediblesV2.addXP with the decoded data
        // Note: studentId maps to tokenId in our system
        credibles.addXP(studentId, category, xpValue);

        // Get the attester (issuer) from the EAS attestation
        IEAS.Attestation memory attestation = eas.getAttestation(uid);
        address issuer = attestation.attester;

        // Mint AttestationNFT if contract is set
        if (address(attestationNFT) != address(0)) {
            // Use recipient (resume wallet) as the NFT recipient
            // Pass issuer so AttestationNFT can verify the issuer is valid
            attestationNFT.createAttestationNFTFromEAS(
                recipient,
                issuer,
                category,
                title,
                issuerInfo
            );
        }

        emit AttestationProcessed(
            uid,
            studentId,
            category,
            xpValue
        );

        return true;
    }

    /**
     * @notice Called by EAS when an attestation is revoked
     * @return Whether the revocation is allowed
     * @dev For this MVP, we don't revoke XP, so we allow revocation but don't modify stats
     */
    function onRevoke(
        bytes32, // uid
        bytes32, // schema
        address, // recipient
        bytes calldata // data
    ) external pure returns (bool) {
        // Allow revocation but don't modify XP (one-way system)
        return true;
    }
}

