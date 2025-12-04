// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IEAS.sol";

contract MockEAS is IEAS {
    mapping(bytes32 => Attestation) public attestations;

    function attest(
        bytes32 schema,
        bytes calldata data
    ) external payable override returns (bytes32) {
        bytes32 uid = keccak256(abi.encodePacked(block.timestamp, msg.sender, data));
        attestations[uid] = Attestation({
            uid: uid,
            schema: schema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: msg.sender,
            attester: msg.sender,
            revocable: true,
            data: data
        });
        return uid;
    }

    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return attestations[uid];
    }
}

