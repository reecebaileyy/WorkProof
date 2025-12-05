"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useSwitchChain } from "wagmi";
import { parseAbi } from "viem";
import { baseSepolia } from "wagmi/chains";
import { getResumeWallet, createResumeWallet } from "../lib/baseAccount";
import styles from "./SkillPetMint.module.css";

const CREDIBLES_V2_ABI = parseAbi([
  "function registerResumeWallet(address resumeWallet) external",
  "function mintSkillPet(address resumeWallet) external",
  "function hasSkillPet(address) view returns (bool)",
  "function getResumeWallet(address) view returns (address)",
]);

interface SkillPetMintProps {
  contractAddress: `0x${string}`;
  onMintComplete?: () => void;
}

export default function SkillPetMint({ contractAddress, onMintComplete }: SkillPetMintProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [resumeWallet, setResumeWallet] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has a resume wallet registered
  const { data: registeredWallet } = useReadContract({
    address: contractAddress,
    abi: CREDIBLES_V2_ABI,
    functionName: "getResumeWallet",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Check if resume wallet already has SkillPet
  const { data: hasSkillPet } = useReadContract({
    address: contractAddress,
    abi: CREDIBLES_V2_ABI,
    functionName: "hasSkillPet",
    args: resumeWallet ? [resumeWallet as `0x${string}`] : undefined,
    query: {
      enabled: !!resumeWallet,
    },
  });

  const { writeContract: writeRegister, data: registerHash } = useWriteContract();
  const { writeContract: writeMint, data: mintHash } = useWriteContract();

  const { isLoading: isRegisteringConfirming, isSuccess: isRegisterSuccess } =
    useWaitForTransactionReceipt({
      hash: registerHash,
    });

  const { isLoading: isMintingConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Get or create resume wallet
  useEffect(() => {
    if (!isConnected || !address || chainId !== baseSepolia.id) return;

    const setupResumeWallet = async () => {
      // First check if already registered on-chain
      if (registeredWallet && registeredWallet !== "0x0000000000000000000000000000000000000000") {
        setResumeWallet(registeredWallet);
        return;
      }

      // Try to get existing sub-account from Base Account SDK
      const existingWallet = await getResumeWallet();
      if (existingWallet) {
        setResumeWallet(existingWallet);
        // Don't auto-register - let user click button to register
        // This prevents the "already registered" error
      }
    };

    setupResumeWallet();
  }, [isConnected, address, registeredWallet, chainId]);

  const createWallet = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    // Ensure we're on Base Sepolia
    if (chainId !== baseSepolia.id && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id });
      } catch {
        setError("Please switch to Base Sepolia network");
        return;
      }
    }

    // Check if already registered before creating
    if (registeredWallet && registeredWallet !== "0x0000000000000000000000000000000000000000") {
      setResumeWallet(registeredWallet);
      return;
    }

    setIsCreatingWallet(true);
    setError(null);

    try {
      // First try to get existing wallet
      let wallet = await getResumeWallet();
      
      // If no existing wallet, create a new one
      if (!wallet) {
        wallet = await createResumeWallet();
      }
      
      if (wallet) {
        setResumeWallet(wallet);
        // Only register if not already registered
        if (!registeredWallet || registeredWallet === "0x0000000000000000000000000000000000000000") {
          await registerResumeWallet(wallet);
        }
      } else {
        setError("Failed to create resume wallet");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create resume wallet";
      setError(errorMessage);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const registerResumeWallet = async (wallet: string) => {
    if (!address) return;

    // Double-check if already registered before attempting registration
    if (registeredWallet && registeredWallet !== "0x0000000000000000000000000000000000000000") {
      setResumeWallet(registeredWallet);
      setIsRegistering(false);
      return;
    }

    setIsRegistering(true);
    setError(null);
    try {
      writeRegister({
        address: contractAddress,
        abi: CREDIBLES_V2_ABI,
        functionName: "registerResumeWallet",
        args: [wallet as `0x${string}`],
      });
    } catch (err: unknown) {
      // Handle "already registered" error gracefully
      const errorMessage = err instanceof Error ? err.message : "";
      const shortMessage = err && typeof err === "object" && "shortMessage" in err ? String(err.shortMessage) : "";
      if (errorMessage.includes("already registered") || shortMessage.includes("already registered")) {
        setError(null);
        // The wallet is already registered, so we can proceed
        setResumeWallet(wallet);
      } else {
        const finalError = err instanceof Error ? err.message : "Failed to register resume wallet";
        setError(finalError);
      }
      setIsRegistering(false);
    }
  };

  const mintSkillPet = async () => {
    if (!resumeWallet) {
      setError("Resume wallet not set");
      return;
    }

    // Ensure we're on Base Sepolia
    if (chainId !== baseSepolia.id && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id });
      } catch {
        setError("Please switch to Base Sepolia network");
        return;
      }
    }

    setError(null);
    try {
      writeMint({
        address: contractAddress,
        abi: CREDIBLES_V2_ABI,
        functionName: "mintSkillPet",
        args: [resumeWallet as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mint SkillPet";
      setError(errorMessage);
    }
  };

  // Handle registration success
  useEffect(() => {
    if (isRegisterSuccess) {
      setIsRegistering(false);
      setError(null);
    }
  }, [isRegisterSuccess]);

  // Handle mint success
  useEffect(() => {
    if (isMintSuccess && onMintComplete) {
      onMintComplete();
    }
  }, [isMintSuccess, onMintComplete]);

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <p>Please connect your wallet to mint your SkillPet NFT</p>
      </div>
    );
  }

  if (hasSkillPet) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <h2>✓ You already have a SkillPet NFT!</h2>
          <p>Your SkillPet is ready. Start completing daily tasks to level up!</p>
        </div>
      </div>
    );
  }

  // Show chain warning
  if (isConnected && chainId !== baseSepolia.id) {
    return (
      <div className={styles.container}>
        <div className={styles.error} style={{ 
          background: 'rgba(255, 170, 0, 0.1)', 
          padding: '1rem', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 170, 0, 0.3)',
        }}>
          <p>⚠️ Please switch to Base Sepolia network to continue.</p>
          {switchChainAsync && (
            <button
              onClick={() => switchChainAsync({ chainId: baseSepolia.id })}
              disabled={isSwitchingChain}
              className={styles.button}
              style={{ marginTop: '0.5rem' }}
            >
              {isSwitchingChain ? "Switching..." : "Switch to Base Sepolia"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Mint Your SkillPet NFT</h2>
      <p className={styles.description}>
        Your SkillPet NFT will track your skills and evolve as you complete daily tasks and earn
        attestations.
      </p>

      {!resumeWallet || (resumeWallet && (!registeredWallet || registeredWallet === "0x0000000000000000000000000000000000000000")) ? (
        <div className={styles.walletSetup}>
          <p>First, we need to create your resume wallet (Base Account sub-account)</p>
          {registeredWallet && registeredWallet !== "0x0000000000000000000000000000000000000000" ? (
            <div className={styles.walletInfo}>
              <p>
                <strong>Resume Wallet:</strong> {registeredWallet.slice(0, 6)}...{registeredWallet.slice(-4)}
              </p>
              <p className={styles.info}>Your resume wallet is already registered!</p>
            </div>
          ) : (
            <button
              onClick={createWallet}
              disabled={isCreatingWallet || isRegistering || isRegisteringConfirming}
              className={styles.button}
            >
              {isCreatingWallet || isRegistering || isRegisteringConfirming
                ? "Setting up wallet..."
                : "Create Resume Wallet"}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.mintSection}>
          <div className={styles.walletInfo}>
            <p>
              <strong>Resume Wallet:</strong> {resumeWallet.slice(0, 6)}...{resumeWallet.slice(-4)}
            </p>
          </div>
          <button
            onClick={mintSkillPet}
            disabled={isMintingConfirming || hasSkillPet}
            className={styles.button}
          >
            {isMintingConfirming ? "Minting..." : "Mint SkillPet NFT"}
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {(registerHash || mintHash) && (
        <p className={styles.txHash}>
          Transaction:{" "}
          <a
            href={`https://sepolia.basescan.org/tx/${registerHash || mintHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {(registerHash || mintHash)?.slice(0, 10)}...{(registerHash || mintHash)?.slice(-8)}
          </a>
        </p>
      )}
    </div>
  );
}

