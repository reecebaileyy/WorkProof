"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import { baseSepolia } from "wagmi/chains";
import styles from "./IssuerVerification.module.css";

const CREDIBLES_V2_ABI = parseAbi([
  "function requestIssuerVerification(string memory emailDomain) external",
  "function verifyIssuer(address issuer, string memory emailDomain) external",
  "function isVerifiedIssuer(address issuer) view returns (bool)",
  "function pendingVerifications(address) view returns (string)",
]);

interface IssuerVerificationProps {
  contractAddress: `0x${string}`;
}

export default function IssuerVerification({ contractAddress }: IssuerVerificationProps) {
  const { address, isConnected } = useAccount();
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Extract domain from email
  const extractDomain = (email: string): string => {
    const parts = email.split("@");
    if (parts.length === 2) {
      return parts[1].toLowerCase();
    }
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    const extractedDomain = extractDomain(value);
    setDomain(extractedDomain);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!email || !domain) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      writeContract({
        address: contractAddress,
        abi: CREDIBLES_V2_ABI,
        functionName: "requestIssuerVerification",
        args: [domain],
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit verification request");
      setIsSubmitting(false);
    }
  };

  // Handle transaction success
  if (isSuccess && !success) {
    setSuccess(true);
    setIsSubmitting(false);
    setEmail("");
    setDomain("");
  }

  return (
    <div className={styles.container}>
      <h2>Issuer Verification</h2>
      <p className={styles.description}>
        Verify your company or school email to become an issuer. You'll be able to create
        attestations and mint NFTs for users.
      </p>

      {!isConnected ? (
        <div className={styles.message}>
          <p>Please connect your wallet to request verification</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Company/School Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your.name@company.com"
              required
              disabled={isSubmitting || isPending || isConfirming}
            />
            {domain && (
              <p className={styles.domainHint}>
                Domain: <strong>{domain}</strong>
              </p>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && (
            <div className={styles.success}>
              <p>✓ Verification request submitted successfully!</p>
              <p className={styles.successNote}>
                Your request is pending review. You'll be notified once verified.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!email || !domain || isSubmitting || isPending || isConfirming || success}
            className={styles.submitButton}
          >
            {isSubmitting || isPending || isConfirming
              ? "Submitting..."
              : success
              ? "Request Submitted"
              : "Request Verification"}
          </button>

          {hash && (
            <p className={styles.txHash}>
              Transaction:{" "}
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </p>
          )}
        </form>
      )}

      <div className={styles.infoBox}>
        <h3>How it works:</h3>
        <ol>
          <li>Enter your company or school email address</li>
          <li>Submit a verification request</li>
          <li>Wait for admin approval (domain verification)</li>
          <li>Once verified, you can create attestations for users</li>
        </ol>
      </div>
    </div>
  );
}

