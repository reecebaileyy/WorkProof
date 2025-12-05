// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IEAS.sol";
import "./ISchemaRegistry.sol";

/**
 * @title AttestationResolver
 * @notice EAS SchemaResolver that processes attestations and updates CrediblesV2 NFTs
 * @dev When an attestation is created, this resolver decodes the data and calls CrediblesV2.addXP
 */
interface ICrediblesV2 {
    function addXP(uint256 tokenId, string memory category, uint256 amount) external;
}

contract AttestationResolver {
    IEAS public immutable eas;
    ISchemaRegistry public immutable schemaRegistry;
    ICrediblesV2 public immutable credibles;
    bytes32 public schemaUID;

    /// @notice Emitted when an attestation is processed
    event AttestationProcessed(
        bytes32 indexed attestationUID,
        uint256 indexed tokenId,
        string category,
        uint256 xpValue
    );

    /**
     * @notice Constructor
     * @param _eas The EAS contract address (Base Sepolia: 0x4200000000000000000000000000000000000021)
     * @param _schemaRegistry The SchemaRegistry contract address (Base Sepolia: 0x4200000000000000000000000000000000000020)
     * @param _credibles The CrediblesV2 contract address
     */
    constructor(
        address _eas,
        address _schemaRegistry,
        address _credibles
    ) {
        eas = IEAS(_eas);
        schemaRegistry = ISchemaRegistry(_schemaRegistry);
        credibles = ICrediblesV2(_credibles);

        // Register schema: "uint256 studentId, string category, uint256 xpValue"
        schemaUID = schemaRegistry.register(
            "uint256 studentId, string category, uint256 xpValue",
            address(this),
            true
        );
    }

    /**
     * @notice Called by EAS when an attestation is created
     * @param data The attestation data
     * @return Whether the attestation is valid
     */
    function onAttest(
        bytes32, // uid
        bytes32, // schema
        address, // recipient
        bytes calldata data
    ) external returns (bool) {
        // Decode the attestation data
        // Data format: abi.encode(uint256 studentId, string category, uint256 xpValue)
        (uint256 studentId, string memory category, uint256 xpValue) = abi.decode(
            data,
            (uint256, string, uint256)
        );

        // Call CrediblesV2.addXP with the decoded data
        // Note: studentId maps to tokenId in our system
        credibles.addXP(studentId, category, xpValue);

        emit AttestationProcessed(
            keccak256(abi.encodePacked(msg.sender, block.timestamp)),
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

