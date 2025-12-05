// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IssuerRegistry
 * @dev Separate contract for issuer verification management
 * Can be used standalone or integrated with CrediblesV2
 */
contract IssuerRegistry is Ownable {
    mapping(address => bool) public verifiedIssuers;
    mapping(string => bool) public verifiedDomains;
    mapping(address => string) public issuerDomain;
    mapping(address => string) public pendingVerifications;

    event IssuerVerified(address indexed issuer, string domain);
    event IssuerVerificationRequested(address indexed issuer, string domain);
    event DomainVerified(string domain);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Request issuer verification with email domain
     */
    function requestVerification(string memory emailDomain) external {
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
        emit DomainVerified(emailDomain);
    }

    /**
     * @dev Check if an address is a verified issuer
     */
    function isVerifiedIssuer(address issuer) external view returns (bool) {
        return verifiedIssuers[issuer];
    }

    /**
     * @dev Check if a domain is verified
     */
    function isVerifiedDomain(string memory emailDomain) external view returns (bool) {
        return verifiedDomains[emailDomain];
    }

    /**
     * @dev Get pending verification for an issuer
     */
    function getPendingVerification(address issuer) external view returns (string memory) {
        return pendingVerifications[issuer];
    }
}

