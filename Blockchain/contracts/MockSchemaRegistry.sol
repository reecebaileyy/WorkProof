// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ISchemaRegistry.sol";

contract MockSchemaRegistry is ISchemaRegistry {
    mapping(bytes32 => SchemaRecord) public schemas;
    uint256 public schemaCounter;

    function register(
        string calldata schema,
        address resolver,
        bool revocable
    ) external override returns (bytes32) {
        bytes32 uid = keccak256(abi.encodePacked(schema, resolver, revocable, ++schemaCounter));
        schemas[uid] = SchemaRecord({
            uid: uid,
            resolver: resolver,
            revocable: revocable
        });
        return uid;
    }

    function getSchema(bytes32 uid) external view override returns (SchemaRecord memory) {
        return schemas[uid];
    }
}

