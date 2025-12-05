"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import styles from "./CreateAttestation.module.css";

const CREDIBLES_V2_ABI = parseAbi([
  "function isVerifiedIssuer(address issuer) view returns (bool)",
  "function getResumeWallet(address) view returns (address)",
]);

const ATTESTATION_NFT_ABI = parseAbi([
  "function createAttestationNFT(address recipient, string memory category, string memory title, string memory issuerInfo) external",
]);

interface CreateAttestationProps {
  crediblesV2Address: `0x${string}`;
  attestationNFTAddress: `0x${string}`;
}

export default function CreateAttestation({ crediblesV2Address, attestationNFTAddress }: CreateAttestationProps) {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [category, setCategory] = useState("dev");
  const [title, setTitle] = useState("");
  const [issuerInfo, setIssuerInfo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user is verified issuer (via CrediblesV2)
  const { data: isVerified } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "isVerifiedIssuer",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!crediblesV2Address,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isVerified) {
      setError("You are not a verified issuer. Please verify your email first.");
      return;
    }

    if (!recipient || !category || !title) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate recipient address
    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      setError("Invalid recipient address");
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      writeContract({
        address: attestationNFTAddress,
        abi: ATTESTATION_NFT_ABI,
        functionName: "createAttestationNFT",
        args: [recipient as `0x${string}`, category, title, issuerInfo || ""],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create attestation";
      setError(errorMessage);
    }
  };

    // Handle success
  if (isSuccess && !success) {
    setSuccess(true);
    setRecipient("");
    setTitle("");
    setIssuerInfo("");
  }

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <p>Please connect your wallet to create attestations</p>
      </div>
    );
  }

  if (isVerified === false) {
    return (
      <div className={styles.container}>
        <div className={styles.warning}>
          <h3>Not Verified</h3>
          <p>You need to verify your issuer status before creating attestations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Create Attestation NFT</h2>
      <p className={styles.description}>
        Create a static attestation NFT for a user. This NFT showcases their achievement/completion
        and will be automatically minted to their resume wallet.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="recipient">Recipient Address (Resume Wallet)</label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
            disabled={isPending || isConfirming}
          />
          <p className={styles.hint}>Enter the user&apos;s resume wallet address</p>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="category">Skill Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={isPending || isConfirming}
          >
            <option value="dev">Development</option>
            <option value="defi">DeFi</option>
            <option value="gov">Governance</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="title">Attestation Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Completed React Course, Earned DeFi Certification"
            required
            disabled={isPending || isConfirming}
          />
          <p className={styles.hint}>A descriptive title for this attestation</p>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="issuerInfo">Additional Info (Optional)</label>
          <textarea
            id="issuerInfo"
            value={issuerInfo}
            onChange={(e) => setIssuerInfo(e.target.value)}
            placeholder="Course name, certification details, etc."
            rows={3}
            disabled={isPending || isConfirming}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && (
          <div className={styles.success}>
            <p>✓ Attestation NFT created successfully!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming || success}
          className={styles.submitButton}
        >
          {isPending || isConfirming ? "Creating..." : success ? "Created" : "Create Attestation NFT"}
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
    </div>
  );
}

