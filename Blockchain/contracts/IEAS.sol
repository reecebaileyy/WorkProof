// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title EAS Interface
 * @dev Minimal interface for EAS attestation resolver
 */
interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    function attest(
        bytes32 schema,
        bytes calldata data
    ) external payable returns (bytes32);

    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

