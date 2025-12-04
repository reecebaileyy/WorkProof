// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ExperienceAttestations is AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    uint256 public nextId = 1;

    struct Attestation {
        uint256 id;
        address issuer;
        address recipient;
        string metadataURI;
        uint256 timestamp;
        bool revoked;
    }

    mapping(uint256 => Attestation) public attestations;
    mapping(address => uint256[]) internal attestationsOf;

    event AttestationIssued(uint256 indexed id, address indexed issuer, address indexed recipient, string metadataURI);
    event AttestationRevoked(uint256 indexed id, address indexed issuer, string reason);

    constructor(address admin) {
        _grantRole(ISSUER_ROLE, admin); // 授予 admin Issuer 权限
    }

    modifier onlyIssuer() {
        require(hasRole(ISSUER_ROLE, msg.sender), "Not an authorized issuer");
        _;
    }

    // simple issue by an authorized issuer
    function issueAttestation(address recipient, string calldata metadataURI) external onlyIssuer returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        uint256 id = nextId++;
        attestations[id] = Attestation(id, msg.sender, recipient, metadataURI, block.timestamp, false);
        attestationsOf[recipient].push(id);
        emit AttestationIssued(id, msg.sender, recipient, metadataURI);
        return id;
    }

    // batch issuance to save gas in demo flows
    function issueAttestationBatch(address[] calldata recipients, string[] calldata metadataURIs) external onlyIssuer returns (uint256[] memory) {
        require(recipients.length == metadataURIs.length, "len mismatch");
        uint256[] memory ids = new uint256[](recipients.length);
        for (uint i = 0; i < recipients.length; i++) {
            ids[i] = _issueInternal(recipients[i], metadataURIs[i], msg.sender);
        }
        return ids;
    }

    function _issueInternal(address recipient, string calldata metadataURI, address issuer) internal returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        uint256 id = nextId++;
        attestations[id] = Attestation(id, issuer, recipient, metadataURI, block.timestamp, false);
        attestationsOf[recipient].push(id);
        emit AttestationIssued(id, issuer, recipient, metadataURI);
        return id;
    }

    // revoke with reason
    function revokeAttestation(uint256 id, string calldata reason) external {
        Attestation storage a = attestations[id];
        require(a.id != 0, "No attestation");
        require(msg.sender == a.issuer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized to revoke");
        a.revoked = true;
        emit AttestationRevoked(id, msg.sender, reason);
    }

    // pagination helper to avoid returning huge arrays on-chain
    function getAttestationsOfPaginated(address recipient, uint256 cursor, uint256 limit) external view returns (uint256[] memory ids, uint256 nextCursor) {
        uint256 total = attestationsOf[recipient].length;
        if (cursor >= total) {
            return (new uint256[](0), cursor);
        }

        uint256 end = cursor + limit;
        if (end > total) end = total;
        uint256 size = end - cursor;
        ids = new uint256[](size);
        for (uint i = 0; i < size; i++) {
            ids[i] = attestationsOf[recipient][cursor + i];
        }
        nextCursor = end;
    }

    // getter returns full struct
    function getAttestation(uint256 id) external view returns (Attestation memory) {
        return attestations[id];
    }

    // optional: allow offline signed issuance (EIP-712 style omitted for brevity)
    // validateSignature version (simplified): issuer signs (recipient, metadataURI, nonce)
    function issueAttestationSigned(
        address recipient, 
        string calldata metadataURI, 
        bytes calldata signature
    ) external returns (uint256) {
        // 1. 计算原始数据的哈希
        bytes32 hash = keccak256(abi.encodePacked(address(this), recipient, metadataURI));
        
        // 2. 手动添加以太坊签名消息前缀并计算最终哈希
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                hash
            )
        );
        
        // 3. 从签名中恢复签名者地址
        address signer = recover(ethSignedHash, signature);
        require(hasRole(ISSUER_ROLE, signer), "Invalid signer");
        
        return _issueInternal(recipient, metadataURI, signer);
    }

    // 需要添加一个recover函数（或使用库）
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature 'v' value");
        
        return ecrecover(hash, v, r, s);
    }
}