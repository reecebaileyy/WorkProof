"use client";
import { useState, useEffect } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId, useSwitchChain } from "wagmi";
import { parseAbi } from "viem";
import { baseSepolia } from "wagmi/chains";
import styles from "./page.module.css";
import { Stats, Talent } from "./types/contracts";

const CREDIBLES_ABI = parseAbi([
  "function characterStats(uint256) view returns (uint256 dev, uint256 defi, uint256 gov, uint256 social)",
  "function mint(address to, uint256 tokenId) external",
  "function publicMint() external",
  "function addXPDirect(string memory category, uint256 amount) external",
  "function hasMinted(address) view returns (bool)",
  "function getTokenId(address) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function owner() view returns (address)",
]);

export default function Home() {
  const { address, isConnected, chain, connector } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const switchChainHook = useSwitchChain();
  const switchChain = switchChainHook.switchChain;
  const switchChainAsync = switchChainHook.switchChainAsync;
  const isSwitchingChain = switchChainHook.isPending;
  const [isAddingChain, setIsAddingChain] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [ownedTokenIds, setOwnedTokenIds] = useState<bigint[]>([]);
  const [attestations, setAttestations] = useState<any[]>([]);
  const [talentData, setTalentData] = useState<Talent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);
  const [mintTokenId, setMintTokenId] = useState<string>("1");
  const [mintError, setMintError] = useState<string | null>(null);
  const [findingTokens, setFindingTokens] = useState(false);
  const [manualTokenId, setManualTokenId] = useState<string>("");
  const [dailyTaskOpen, setDailyTaskOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<{ question: string; options: string[]; correct: number; category: string } | null>(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);
  const [xpAdding, setXpAdding] = useState(false);

  const crediblesAddress = process.env.NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS as `0x${string}`;
  const schemaUID = process.env.NEXT_PUBLIC_SCHEMA_UID;

  // Debug: Log contract address on mount
  useEffect(() => {
    if (crediblesAddress) {
      console.log("Credibles Contract Address:", crediblesAddress);
    } else {
      console.warn("Credibles Contract Address not set in environment variables");
    }
  }, [crediblesAddress]);

  // Get contract owner
  const { data: contractOwner } = useReadContract({
    address: crediblesAddress,
    abi: CREDIBLES_ABI,
    functionName: "owner",
    query: {
      enabled: !!crediblesAddress && crediblesAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Get user's NFT balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: crediblesAddress,
    abi: CREDIBLES_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!crediblesAddress && crediblesAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Check if user has minted
  const { data: hasMinted, refetch: refetchHasMinted } = useReadContract({
    address: crediblesAddress,
    abi: CREDIBLES_ABI,
    functionName: "hasMinted",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!crediblesAddress && crediblesAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Get token ID for user
  const { data: userTokenId } = useReadContract({
    address: crediblesAddress,
    abi: CREDIBLES_ABI,
    functionName: "getTokenId",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!crediblesAddress && crediblesAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Find owned token IDs (check common range using public client)
  useEffect(() => {
    if (!isConnected || !address || !crediblesAddress || crediblesAddress === "0x0000000000000000000000000000000000000000" || !publicClient) {
      setOwnedTokenIds([]);
      return;
    }

    const findOwnedTokens = async () => {
      setFindingTokens(true);
      const owned: bigint[] = [];
      
      // Check first 50 token IDs in batches
      const batchSize = 10;
      const maxTokenId = 50;
      
      for (let start = 1; start <= maxTokenId; start += batchSize) {
        const end = Math.min(start + batchSize - 1, maxTokenId);
        const promises = [];
        
        for (let i = start; i <= end; i++) {
          promises.push(
            publicClient.readContract({
              address: crediblesAddress,
              abi: CREDIBLES_ABI,
              functionName: "ownerOf",
              args: [BigInt(i)],
            }).then(owner => {
              if (owner?.toLowerCase() === address.toLowerCase()) {
                return BigInt(i);
              }
              return null;
            }).catch(() => null)
          );
        }
        
        const results = await Promise.all(promises);
        results.forEach(tokenId => {
          if (tokenId !== null) {
            owned.push(tokenId);
          }
        });
      }

      setOwnedTokenIds(owned);
      setFindingTokens(false);
      
      // If we found tokens, select the first one
      if (owned.length > 0 && !selectedTokenId) {
        setSelectedTokenId(owned[0]);
      }
    };

    findOwnedTokens();
  }, [isConnected, address, crediblesAddress, balance, publicClient]);

  // Read character stats from contract for selected token
  const { data: stats, refetch: refetchStats } = useReadContract({
    address: crediblesAddress,
    abi: CREDIBLES_ABI,
    functionName: "characterStats",
    args: selectedTokenId ? [selectedTokenId] : undefined,
    query: {
      enabled: isConnected && !!crediblesAddress && crediblesAddress !== "0x0000000000000000000000000000000000000000" && selectedTokenId !== null,
    },
  });

  // Write contract for minting and XP
  const { 
    writeContract, 
    data: mintHash, 
    isPending: isMintPending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Write contract for adding XP
  const {
    writeContract: writeContractXP,
    data: xpHash,
    isPending: isXPPending,
    error: xpError,
    reset: resetXPWrite
  } = useWriteContract();
  
  // Wait for XP transaction
  const {
    isLoading: isXPConfirming,
    isSuccess: isXPSuccess,
    error: xpTxError
  } = useWaitForTransactionReceipt({
    hash: xpHash,
  });
  
  // Wait for mint transaction
  const { 
    isLoading: isMintConfirming, 
    isSuccess: isMintSuccess,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setMintLoading(false);
      const errorMessage = writeError.message || writeError.toString() || "Transaction failed. Make sure you're the contract owner.";
      setMintError(errorMessage);
      console.error("Write contract error:", writeError);
      console.error("Error details:", {
        name: writeError.name,
        message: writeError.message,
        cause: writeError.cause,
        shortMessage: (writeError as any).shortMessage,
      });
    }
  }, [writeError]);

  // Handle transaction receipt errors
  useEffect(() => {
    if (txError) {
      setMintLoading(false);
      const errorMessage = txError.message || txError.toString() || "Transaction confirmation failed.";
      setMintError(errorMessage);
      console.error("Transaction error:", txError);
    }
  }, [txError]);

  // Track mint hash changes
  useEffect(() => {
    if (mintHash) {
      console.log("Transaction hash received:", mintHash);
      setMintError(null); // Clear any previous errors when hash is received
    }
  }, [mintHash]);

  // Fetch attestations from EAS
  useEffect(() => {
    if (!address || !schemaUID) return;

    const fetchAttestations = async () => {
      try {
        // EAS GraphQL endpoint for Base Sepolia
        const query = `
          query GetAttestations($where: AttestationWhereInput) {
            attestations(where: $where) {
              id
              attester
              recipient
              data
              timeCreated
            }
          }
        `;

        const variables = {
          where: {
            schemaId: { equals: schemaUID },
            recipient: { equals: address.toLowerCase() },
          },
        };

        const response = await fetch("https://base-sepolia.easscan.org/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();
        if (result.data?.attestations) {
          setAttestations(result.data.attestations);
        }
      } catch (error) {
        console.error("Error fetching attestations:", error);
      }
    };

    fetchAttestations();
  }, [address, schemaUID]);

  // Refresh data after mint success
  useEffect(() => {
    if (isMintSuccess) {
      refetchBalance();
      refetchHasMinted();
      setMintLoading(false);
      setMintError(null);
      // The token ID will be fetched via userTokenId
    }
  }, [isMintSuccess, refetchBalance, refetchHasMinted]);

  // Update selected token when userTokenId is available
  useEffect(() => {
    if (userTokenId && userTokenId > BigInt(0) && !ownedTokenIds.includes(userTokenId)) {
      setOwnedTokenIds([userTokenId]);
      setSelectedTokenId(userTokenId);
    }
  }, [userTokenId, ownedTokenIds]);

  // Helper function to add and switch to Base Sepolia
  const switchToBaseSepolia = async () => {
    try {
      // Try to switch first using wagmi's switchChain hook
      await switchChainAsync({ chainId: baseSepolia.id });
    } catch (error: any) {
      // If error is 4902 (chain not added), add the chain first
      if (error?.code === 4902 || error?.shortMessage?.includes('4902') || error?.message?.includes('Unrecognized chain ID') || error?.cause?.code === 4902) {
        console.log("Base Sepolia not in wallet. Adding chain first...");
        setIsAddingChain(true);
        try {
          // Get the wallet provider to add the chain
          const provider = await connector?.getProvider();
          if (provider && typeof provider === 'object' && provider !== null && 'request' in provider) {
            // Add Base Sepolia chain using wallet_addEthereumChain
            const requestMethod = (provider as { request: (args: { method: string; params: any[] }) => Promise<any> }).request;
            await requestMethod({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${baseSepolia.id.toString(16)}`,
                chainName: baseSepolia.name,
                rpcUrls: baseSepolia.rpcUrls.default.http,
                nativeCurrency: baseSepolia.nativeCurrency,
                blockExplorerUrls: baseSepolia.blockExplorers ? [baseSepolia.blockExplorers.default.url] : [],
              }],
            });
            console.log("Base Sepolia chain added successfully");
            // After adding, try switching again
            await switchChainAsync({ chainId: baseSepolia.id });
          } else {
            throw new Error("Wallet provider not available");
          }
        } catch (addError) {
          console.error("Failed to add chain:", addError);
          setIsAddingChain(false);
          throw addError;
        } finally {
          setIsAddingChain(false);
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  };

  // Auto-switch to Base Sepolia if on wrong network
  useEffect(() => {
    if (isConnected && chainId !== baseSepolia.id && !isSwitchingChain && !isAddingChain) {
      console.log("Wallet connected to wrong network. Switching to Base Sepolia...", {
        currentChainId: chainId,
        expectedChainId: baseSepolia.id,
        currentChain: chain?.name,
      });
      
      // Automatically switch to Base Sepolia
      switchToBaseSepolia().catch((error) => {
        console.error("Failed to switch chain:", error);
        setMintError(`Please switch to Base Sepolia network manually. Current network: ${chain?.name || `Chain ID ${chainId}`}`);
      });
    }
  }, [isConnected, chainId, chain, connector, isSwitchingChain, isAddingChain]);

  // Handle mint
  const handleMint = () => {
    // Validate inputs
    if (!isConnected || !address) {
      setMintError("Please connect your wallet first.");
      console.error("Mint failed: Wallet not connected");
      return;
    }

    // Check if user is on the correct network (Base Sepolia)
    if (chainId !== baseSepolia.id) {
      // Try to switch chain automatically (will add chain if needed)
      if (!isSwitchingChain && !isAddingChain) {
        setMintError("Switching to Base Sepolia network... Please approve in your wallet.");
        switchToBaseSepolia().catch((error: any) => {
          console.error("Failed to switch chain:", error);
          setMintError(`Please switch to Base Sepolia network. Current: ${chain?.name || `Chain ID ${chainId}`}. Error: ${error?.message || "Failed to switch"}`);
        });
      } else {
        setMintError(isAddingChain ? "Adding Base Sepolia network... Please approve in your wallet." : "Switching network... Please wait.");
      }
      console.error("Mint failed: Wrong network", { currentChainId: chainId, expectedChainId: baseSepolia.id });
      return;
    }

    if (!crediblesAddress || crediblesAddress === "0x0000000000000000000000000000000000000000") {
      setMintError("Contract address not configured. Please check environment variables.");
      console.error("Mint failed: Contract address not set");
      return;
    }

    if (!mintTokenId || mintTokenId.trim() === "") {
      setMintError("Please enter a token ID.");
      return;
    }

    // Validate token ID format
    let tokenId: bigint;
    try {
      tokenId = BigInt(mintTokenId);
    } catch (error) {
      setMintError("Invalid token ID format. Please enter a number.");
      console.error("Mint failed: Invalid token ID", error);
      return;
    }
    
    // Validate token ID value
    if (tokenId <= BigInt(0)) {
      setMintError("Token ID must be greater than 0.");
      return;
    }

    // Validate address format
    if (!address.startsWith("0x") || address.length !== 42) {
      setMintError("Invalid wallet address format.");
      console.error("Mint failed: Invalid address format", address);
      return;
    }

    // Validate contract address format
    if (!crediblesAddress.startsWith("0x") || crediblesAddress.length !== 42) {
      setMintError("Invalid contract address format.");
      console.error("Mint failed: Invalid contract address format", crediblesAddress);
      return;
    }

    // Check if user has already minted
    if (hasMinted) {
      setMintError("You already have an NFT. Each wallet can only mint one NFT.");
      console.error("Mint failed: User already has an NFT");
      return;
    }

    setMintLoading(true);
    setMintError(null);
    resetWrite(); // Reset any previous errors

    console.log("=== Minting NFT ===");
    console.log("Contract Address:", crediblesAddress);
    console.log("Recipient Address:", address);
    console.log("Chain ID:", chainId);
    console.log("Expected Chain ID (Base Sepolia):", baseSepolia.id);

    try {
      // Call publicMint - no token ID needed, auto-assigned
      writeContract({
        address: crediblesAddress,
        abi: CREDIBLES_ABI,
        functionName: "publicMint",
        args: [],
      });

      console.log("✅ writeContract called successfully. Waiting for user approval in wallet...");
    } catch (error: any) {
      // This catch might not fire since writeContract doesn't throw, but keep it for safety
      console.error("❌ Exception in writeContract:", error);
      setMintLoading(false);
      setMintError(error?.message || "Failed to prepare transaction. Please check your input.");
    }
  };

  // Get NFT evolution status (Egg -> Dragon based on total XP)
  const getEvolutionStatus = (stats: Stats | undefined): { stage: string; totalXP: number } => {
    if (!stats) return { stage: "Egg", totalXP: 0 };
    
    const totalXP = Number(stats.dev) + Number(stats.defi) + Number(stats.gov) + Number(stats.social);
    
    if (totalXP === 0) return { stage: "Egg", totalXP: 0 };
    if (totalXP < 100) return { stage: "Egg", totalXP };
    if (totalXP < 300) return { stage: "Baby Dragon", totalXP };
    if (totalXP < 600) return { stage: "Young Dragon", totalXP };
    return { stage: "Dragon", totalXP };
  };

  const fetchTalentData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/headhunter");
      if (response.ok) {
        const data = await response.json();
        setTalentData(data.topTalent);
      } else {
        console.error("Failed to fetch talent data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching talent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const characterStats = stats as Stats | undefined;
  const evolution = getEvolutionStatus(characterStats);

  const calculateLevel = (xp: bigint | undefined) => {
    if (!xp) return 0;
    return Math.floor(Number(xp) / 100);
  };
  const calculateProgress = (xp: bigint | undefined) => {
    if (!xp) return 0;
    return (Number(xp) % 100) / 100;
  };

  // Quiz questions by category
  const quizQuestions = {
    dev: [
      { question: "What does HTML stand for?", options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"], correct: 0 },
      { question: "Which of these is a JavaScript framework?", options: ["Python", "React", "Java", "C++"], correct: 1 },
      { question: "What is the purpose of CSS?", options: ["To structure web pages", "To style web pages", "To add interactivity", "To store data"], correct: 1 },
    ],
    defi: [
      { question: "What does DeFi stand for?", options: ["Decentralized Finance", "Digital Finance", "Direct Finance", "Distributed Finance"], correct: 0 },
      { question: "What is a smart contract?", options: ["A legal document", "Self-executing code on blockchain", "A bank account", "A cryptocurrency"], correct: 1 },
      { question: "What is the main advantage of DeFi?", options: ["Higher interest rates", "No intermediaries", "Government backing", "Physical branches"], correct: 1 },
    ],
    gov: [
      { question: "What is DAO governance?", options: ["Government regulation", "Decentralized decision-making", "Corporate management", "Banking rules"], correct: 1 },
      { question: "What is a governance token used for?", options: ["Trading only", "Voting on proposals", "Staking rewards", "Payment"], correct: 1 },
      { question: "What is quorum in governance?", options: ["Minimum votes needed", "Maximum votes allowed", "Voting period", "Proposal type"], correct: 0 },
    ],
    social: [
      { question: "What is Web3 social media?", options: ["Traditional social media", "Decentralized social platforms", "Email systems", "Chat applications"], correct: 1 },
      { question: "What is a social token?", options: ["Government currency", "Community-created token", "Bank note", "Credit card"], correct: 1 },
      { question: "What is the benefit of decentralized social networks?", options: ["Faster speeds", "User ownership of data", "More ads", "Centralized control"], correct: 1 },
    ],
  };

  // Start daily task
  const startDailyTask = (category: string) => {
    const questions = quizQuestions[category as keyof typeof quizQuestions];
    if (!questions || questions.length === 0) return;
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setQuizQuestion({ ...randomQuestion, category });
    setQuizAttempts(0);
    setQuizSelectedAnswer(null);
    setQuizResult(null);
    setDailyTaskOpen(true);
  };

  // Handle quiz answer
  const handleQuizAnswer = (answerIndex: number) => {
    if (!quizQuestion || quizResult === "correct") return;
    
    setQuizSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === quizQuestion.correct;
    
    if (isCorrect) {
      setQuizResult("correct");
      // Add XP after a short delay
      setTimeout(() => {
        addXPToNFT(quizQuestion.category, 10); // 10 XP for correct answer
      }, 1000);
    } else {
      const newAttempts = quizAttempts + 1;
      setQuizAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setQuizResult("incorrect");
      } else {
        // Show incorrect result temporarily, then allow retry
        setQuizResult("incorrect");
        setTimeout(() => {
          setQuizSelectedAnswer(null);
          setQuizResult(null);
        }, 2000);
      }
    }
  };

  // Add XP to NFT
  const addXPToNFT = async (category: string, amount: number) => {
    if (!isConnected || !address || !crediblesAddress || !userTokenId) {
      console.error("Cannot add XP: missing requirements");
      return;
    }

    setXpAdding(true);
    try {
      writeContractXP({
        address: crediblesAddress,
        abi: CREDIBLES_ABI,
        functionName: "addXPDirect",
        args: [category, BigInt(amount)],
      });
    } catch (error) {
      console.error("Error adding XP:", error);
      setXpAdding(false);
    }
  };

  // Handle XP transaction success
  useEffect(() => {
    if (isXPSuccess) {
      refetchStats();
      setXpAdding(false);
      setDailyTaskOpen(false);
      setQuizQuestion(null);
      setQuizAttempts(0);
      setQuizSelectedAnswer(null);
      setQuizResult(null);
    }
  }, [isXPSuccess, refetchStats]);

  // Handle XP errors
  useEffect(() => {
    if (xpError || xpTxError) {
      console.error("XP error:", xpError || xpTxError);
      setXpAdding(false);
    }
  }, [xpError, xpTxError]);

  const mintIsLoading = mintLoading || isMintPending || isMintConfirming;

  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <h1 className={styles.title}>Credibles - Living Resume</h1>
        <Wallet />
      </header>

      <div className={styles.content}>
        {!isConnected ? (
          <div className={styles.connectPrompt}>
            <p>Connect your Coinbase Smart Wallet to get started</p>
            <p className={styles.subtitle}>Mint your SkillPet NFT and start your learning journey!</p>
          </div>
        ) : !crediblesAddress || crediblesAddress === "0x0000000000000000000000000000000000000000" ? (
          <div className={styles.connectPrompt}>
            <p>⚠️ Contract address not configured. Please set NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS in .env.local</p>
            <p>Run: <code>npx hardhat run scripts/update-frontend-env.ts</code> from the blockchain directory</p>
          </div>
        ) : (
          <>
            {/* Network Status Indicator */}
            {isConnected && chainId !== baseSepolia.id && (
              <div className={styles.infoText} style={{ 
                background: 'rgba(255, 170, 0, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 170, 0, 0.3)',
                marginBottom: '1rem'
              }}>
                {isSwitchingChain || isAddingChain ? (
                  <p>
                    ⏳ {isAddingChain ? 'Adding Base Sepolia network...' : 'Switching to Base Sepolia network...'} 
                    Please approve in your wallet.
                  </p>
                ) : (
                  <p>
                    ⚠️ Wrong network detected. Current: <strong>{chain?.name || `Chain ID ${chainId}`}</strong>. 
                    {chainId === 8453 && ' (This is Base Mainnet. Please switch to Base Sepolia testnet.)'}
                    <br />
                    <button 
                      onClick={() => switchToBaseSepolia().catch((error: any) => {
                        console.error("Failed to switch chain:", error);
                        setMintError(`Failed to switch network: ${error?.message || "Unknown error"}`);
                      })}
                      className={styles.mintButton}
                      style={{ marginTop: '0.5rem' }}
                      disabled={isSwitchingChain || isAddingChain}
                    >
                      {isAddingChain ? 'Adding Network...' : 'Switch to Base Sepolia'}
                    </button>
                  </p>
                )}
              </div>
            )}
            {/* NFT Minting Section */}
            <section className={styles.mintSection}>
              <h2>Mint Your SkillPet NFT</h2>
              {hasMinted && (
                <div className={styles.infoText} style={{ 
                  background: 'rgba(0, 255, 0, 0.1)', 
                  padding: '0.75rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 255, 0, 0.3)',
                  marginBottom: '1rem'
                }}>
                  <p>
                    ✓ You already have an NFT! Each wallet can only mint one NFT.
                  </p>
                </div>
              )}
              <div className={styles.mintCard}>
                <p className={styles.mintDescription}>
                  Start your journey by minting an "Egg" SkillPet NFT. As you complete courses and earn attestations, 
                  your pet will evolve into a Dragon! Each wallet can mint one NFT.
                </p>
                <div className={styles.mintControls}>
                  <button
                    onClick={handleMint}
                    disabled={mintIsLoading || hasMinted}
                    className={styles.mintButton}
                  >
                    {mintIsLoading ? "Minting..." : hasMinted ? "Already Minted" : "Mint Your SkillPet NFT"}
                  </button>
                </div>
                {mintError && <p className={styles.errorText}>{mintError}</p>}
                {mintHash && !isMintSuccess && (
                  <p className={styles.infoText}>
                    ⏳ Transaction submitted! Hash: {mintHash.slice(0, 10)}...{mintHash.slice(-8)}
                    {isMintConfirming && " (Confirming...)"}
                    <br />
                    <a 
                      href={`https://sepolia.basescan.org/tx/${mintHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.explorerLink}
                    >
                      View on BaseScan ↗
                    </a>
                  </p>
                )}
                {isMintSuccess && (
                  <p className={styles.successText}>
                    ✅ NFT minted successfully! 
                    {mintHash && (
                      <>
                        <br />
                        <a 
                          href={`https://sepolia.basescan.org/tx/${mintHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.explorerLink}
                        >
                          View Transaction on BaseScan ↗
                        </a>
                      </>
                    )}
                  </p>
                )}
                {balance !== undefined && (
                  <p className={styles.balanceText}>
                    You own {Number(balance)} Credible NFT{Number(balance) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </section>

            {/* Owned NFTs Section */}
            {(ownedTokenIds.length > 0 || findingTokens) && (
              <section className={styles.nftSection}>
                <h2>Your SkillPets</h2>
                {findingTokens ? (
                  <p>Searching for your NFTs...</p>
                ) : ownedTokenIds.length > 0 ? (
                  <div className={styles.nftSelector}>
                    {ownedTokenIds.map((tokenId) => (
                      <button
                        key={tokenId.toString()}
                        onClick={() => setSelectedTokenId(tokenId)}
                        className={`${styles.nftButton} ${selectedTokenId === tokenId ? styles.nftButtonActive : ''}`}
                      >
                        Token #{tokenId.toString()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.tokenInputSection}>
                    <p>No NFTs found automatically. Enter a token ID to view:</p>
                    <div className={styles.tokenInputGroup}>
                      <input
                        type="number"
                        min="1"
                        placeholder="Token ID"
                        className={styles.mintInput}
                        value={manualTokenId}
                        onChange={(e) => setManualTokenId(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (manualTokenId) {
                            const tokenId = BigInt(manualTokenId);
                            if (!ownedTokenIds.includes(tokenId)) {
                              setOwnedTokenIds([...ownedTokenIds, tokenId]);
                            }
                            setSelectedTokenId(tokenId);
                            setManualTokenId("");
                          }
                        }}
                        className={styles.mintButton}
                        disabled={!manualTokenId}
                      >
                        View Token
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Skill Tree Visualization */}
            {selectedTokenId && (
              <section className={styles.skillTree}>
                <div className={styles.skillTreeHeader}>
                  <h2>Skill Tree - Token #{selectedTokenId.toString()}</h2>
                  <div className={styles.evolutionBadge}>
                    <span className={styles.evolutionLabel}>Evolution:</span>
                    <span className={styles.evolutionStage}>{evolution.stage}</span>
                    <span className={styles.evolutionXP}>({evolution.totalXP} Total XP)</span>
                  </div>
                </div>
                {characterStats ? (
                  <div className={styles.skillsGrid}>
                    {[
                      { key: "dev", label: "Development", xp: characterStats.dev },
                      { key: "defi", label: "DeFi", xp: characterStats.defi },
                      { key: "gov", label: "Governance", xp: characterStats.gov },
                      { key: "social", label: "Social", xp: characterStats.social },
                    ].map((skill) => {
                      const level = calculateLevel(skill.xp);
                      const progress = calculateProgress(skill.xp);
                      const xpValue = skill.xp ? Number(skill.xp) : 0;
                      return (
                        <div key={skill.key} className={styles.skillCard}>
                          <div className={styles.skillHeader}>
                            <h3>{skill.label}</h3>
                            <span className={styles.level}>Level {level}</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                          <div className={styles.xpInfo}>
                            <span>{xpValue} XP</span>
                            <span>{Math.floor(progress * 100)}% to next level</span>
                          </div>
                          <button
                            onClick={() => startDailyTask(skill.key)}
                            className={styles.dailyTaskButton}
                            disabled={xpAdding || !hasMinted}
                          >
                            Complete Daily Task
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Loading stats for Token #{selectedTokenId.toString()}...</p>
                )}
              </section>
            )}

            {/* Daily Task Modal */}
            {dailyTaskOpen && quizQuestion && (
              <div className={styles.modalOverlay} onClick={() => !xpAdding && setDailyTaskOpen(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <h2>Daily Task - {quizQuestion.category.toUpperCase()}</h2>
                  <p className={styles.quizQuestion}>{quizQuestion.question}</p>
                  <div className={styles.quizOptions}>
                    {quizQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={quizResult === "correct" || (quizResult === "incorrect" && quizAttempts >= 3) || xpAdding}
                        className={`${styles.quizOption} ${
                          quizSelectedAnswer === idx
                            ? quizResult === "correct"
                              ? styles.quizOptionCorrect
                              : quizResult === "incorrect"
                              ? styles.quizOptionIncorrect
                              : ""
                            : ""
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {quizResult === "correct" && (
                    <p className={styles.quizSuccess}>
                      ✅ Correct! Adding 10 XP to {quizQuestion.category}...
                    </p>
                  )}
                  {quizResult === "incorrect" && quizAttempts >= 3 && (
                    <p className={styles.quizFailure}>
                      ❌ Incorrect. You've used all 3 attempts. Try again tomorrow!
                    </p>
                  )}
                  {quizResult === "incorrect" && quizAttempts < 3 && (
                    <p className={styles.quizWarning}>
                      ❌ Incorrect. Attempts remaining: {3 - quizAttempts}
                    </p>
                  )}
                  {xpAdding && (
                    <p className={styles.quizInfo}>⏳ Adding XP to your NFT...</p>
                  )}
                  <button
                    onClick={() => {
                      setDailyTaskOpen(false);
                      setQuizQuestion(null);
                      setQuizAttempts(0);
                      setQuizSelectedAnswer(null);
                      setQuizResult(null);
                    }}
                    className={styles.modalCloseButton}
                    disabled={xpAdding}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Attestations Display */}
            <section className={styles.attestations}>
              <h2>Attestations</h2>
              {attestations.length > 0 ? (
                <div className={styles.attestationList}>
                  {attestations.map((att, idx) => (
                    <div key={idx} className={styles.attestationCard}>
                      <p>
                        <strong>Attester:</strong> {att.attester.slice(0, 6)}...
                        {att.attester.slice(-4)}
                      </p>
                      <p>
                        <strong>Time:</strong>{" "}
                        {new Date(Number(att.timeCreated) * 1000).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No attestations found for your address.</p>
              )}
            </section>

            {/* Headhunter API Test */}
            <section className={styles.apiSection}>
              <h2>Headhunter API</h2>
              <button
                onClick={fetchTalentData}
                disabled={loading}
                className={styles.apiButton}
              >
                {loading ? "Loading..." : "Fetch Top Talent (5 USDC)"}
              </button>
              {talentData && (
                <div className={styles.talentList}>
                  <h3>Top Talent</h3>
                  {talentData.map((talent, idx) => (
                    <div key={idx} className={styles.talentCard}>
                      <p>
                        <strong>{talent.name}</strong> - Level {talent.level} {talent.category}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
