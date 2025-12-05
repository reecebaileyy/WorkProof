// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IEAS.sol";
import "./ISchemaRegistry.sol";
import "./Credibles.sol";

contract AttestationResolver {
    IEAS public immutable eas;
    ISchemaRegistry public immutable schemaRegistry;
    Credibles public immutable credibles;
    bytes32 public schemaUID;

    constructor(
        address _eas,
        address _schemaRegistry,
        address _credibles
    ) {
        eas = IEAS(_eas);
        schemaRegistry = ISchemaRegistry(_schemaRegistry);
        credibles = Credibles(_credibles);

        // Register schema: "uint256 studentId, string category, uint256 xpValue"
        schemaUID = schemaRegistry.register(
            "uint256 studentId, string category, uint256 xpValue",
            address(this),
            true
        );
    }

    function onAttest(
        bytes32 /* uid */,
        bytes32 /* schema */,
        address /* recipient */,
        bytes calldata data
    ) external returns (bool) {
        // Decode the attestation data
        (uint256 studentId, string memory category, uint256 xpValue) = abi.decode(
            data,
            (uint256, string, uint256)
        );

        // Call Credibles.addXP
        credibles.addXP(studentId, category, xpValue);

        return true;
    }

    function onRevoke(
        bytes32 /* uid */,
        bytes32 /* schema */,
        address /* recipient */,
        bytes calldata /* data */
    ) external pure returns (bool) {
        return true;
    }
}

