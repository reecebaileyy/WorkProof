// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Schema Registry Interface
 * @dev Interface for EAS Schema Registry
 */
interface ISchemaRegistry {
    struct SchemaRecord {
        bytes32 uid;
        address resolver;
        bool revocable;
    }

    function register(
        string calldata schema,
        address resolver,
        bool revocable
    ) external returns (bytes32);

    function getSchema(bytes32 uid) external view returns (SchemaRecord memory);
}

