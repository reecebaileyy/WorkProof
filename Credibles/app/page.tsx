"use client";
import { useState, useEffect, useCallback } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseAbi } from "viem";
import { baseSepolia } from "wagmi/chains";
import WalletCard from "./components/WalletCard";
import SkillCard from "./components/SkillCard";
import UserTypeSelection from "./components/UserTypeSelection";
import IssuerVerification from "./components/IssuerVerification";
import SkillPetMint from "./components/SkillPetMint";
import CreateAttestation from "./components/CreateAttestation";
import NFTGallery from "./components/NFTGallery";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import { getResumeWallet } from "./lib/baseAccount";
import sdk from '@farcaster/miniapp-sdk';


const CREDIBLES_V2_ABI = parseAbi([
  "function hasSkillPet(address) view returns (bool)",
  "function getSkillPetTokenId(address) view returns (uint256)",
  "function skillPetStats(uint256) view returns (uint256 dev, uint256 defi, uint256 gov, uint256 social)",
  "function getSkillPetTraits(uint256) view returns ((string traitType, string value)[])",
  "function addXPDirect(address resumeWallet, string memory category, uint256 amount) external",
  "function updateSkillPetTraits(address resumeWallet, string memory traitType, string memory value) external",
  "function isVerifiedIssuer(address issuer) view returns (bool)",
  "function getResumeWallet(address) view returns (address)",
]);

type UserType = "user" | "issuer" | null;

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const switchChainHook = useSwitchChain();
  const switchChainAsync = switchChainHook.switchChainAsync;
  const isSwitchingChain = switchChainHook.isPending;

  const [showLanding, setShowLanding] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const [resumeWallet, setResumeWallet] = useState<`0x${string}` | null>(null);
  const [skillPetMinted, setSkillPetMinted] = useState(false);
  const [dailyTaskOpen, setDailyTaskOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<{
    question: string;
    options: string[];
    correct: number;
    category: string;
  } | null>(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<number | null>(
    null
  );
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [xpAdding, setXpAdding] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const crediblesV2Address =
    (process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS as `0x${string}`) ||
    (process.env.NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS as `0x${string}`);
  const attestationNFTAddress = process.env
    .NEXT_PUBLIC_ATTESTATION_NFT_CONTRACT_ADDRESS as `0x${string}`;

  // Get resume wallet if user type is "user"
  const { data: registeredWallet } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "getResumeWallet",
    args: address ? [address] : undefined,
    query: {
      enabled:
        isConnected && !!address && userType === "user" && !!crediblesV2Address,
    },
  });

  // Check if SkillPet is minted
  const { data: hasSkillPet } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "hasSkillPet",
    args: resumeWallet ? [resumeWallet] : undefined,
    query: {
      enabled: !!resumeWallet && !!crediblesV2Address,
    },
  });

  // Get SkillPet token ID and stats
  const { data: skillPetTokenId } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "getSkillPetTokenId",
    args: resumeWallet ? [resumeWallet] : undefined,
    query: {
      enabled: !!resumeWallet && !!crediblesV2Address,
    },
  });

  const { data: skillPetStats, refetch: refetchStats } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "skillPetStats",
    args: skillPetTokenId ? [skillPetTokenId] : undefined,
    query: {
      enabled: !!skillPetTokenId && !!crediblesV2Address,
    },
  });

  const { writeContract: writeContractXP, data: xpHash } = useWriteContract();
  const { writeContract: writeContractTrait, data: traitHash } =
    useWriteContract();

  const { isSuccess: isXPSuccess } = useWaitForTransactionReceipt({
    hash: xpHash,
  });

  const { isSuccess: isTraitSuccess } = useWaitForTransactionReceipt({
    hash: traitHash,
  });

  // Check if user is verified issuer
  const { data: isVerifiedIssuer } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "isVerifiedIssuer",
    args: address ? [address] : undefined,
    query: {
      enabled:
        isConnected &&
        !!address &&
        userType === "issuer" &&
        !!crediblesV2Address,
    },
  });

  // -------------------------------------------------------------------------
  // CRITICAL: SDK Ready Call
  // -------------------------------------------------------------------------
  useEffect(() => {
    // This console log will help you debug if the app is actually loading this far
    console.log("App mounted, calling sdk.actions.ready()...");
    
    if (sdk && sdk.actions) {
        sdk.actions.ready();
        console.log("sdk.actions.ready() called!");
    } else {
        console.error("SDK not initialized properly");
    }
  }, []);
  // -------------------------------------------------------------------------

  // Set resume wallet when registered
  useEffect(() => {
    if (
      registeredWallet &&
      registeredWallet !== "0x0000000000000000000000000000000000000000"
    ) {
      setResumeWallet(registeredWallet);
    }
  }, [registeredWallet]);

  // Get resume wallet from Base Account (only on Base Sepolia)
  useEffect(() => {
    if (
      userType === "user" &&
      isConnected &&
      chainId === baseSepolia.id &&
      !resumeWallet &&
      !isSwitchingChain
    ) {
      const fetchResumeWallet = async () => {
        const wallet = await getResumeWallet();
        if (wallet) {
          setResumeWallet(wallet as `0x${string}`);
        }
      };
      fetchResumeWallet();
    }
  }, [userType, isConnected, chainId, resumeWallet, isSwitchingChain]);

  // Set skillPetMinted when hasSkillPet changes
  useEffect(() => {
    if (hasSkillPet) {
      setSkillPetMinted(true);
    }
  }, [hasSkillPet]);


  // Handle user type selection
  const handleUserTypeSelect = (type: "user" | "issuer") => {
    setUserType(type);
  };

  // Handle SkillPet mint complete
  const handleSkillPetMintComplete = () => {
    setSkillPetMinted(true);
  };

  // Copy address to clipboard
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Quiz questions
  const quizQuestions = {
    dev: [
      {
        question: "What does HTML stand for?",
        options: [
          "HyperText Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlink and Text Markup Language",
        ],
        correct: 0,
      },
      {
        question: "Which of these is a JavaScript framework?",
        options: ["Python", "React", "Java", "C++"],
        correct: 1,
      },
      {
        question: "What is the purpose of CSS?",
        options: [
          "To structure web pages",
          "To style web pages",
          "To add interactivity",
          "To store data",
        ],
        correct: 1,
      },
    ],
    defi: [
      {
        question: "What does DeFi stand for?",
        options: [
          "Decentralized Finance",
          "Digital Finance",
          "Direct Finance",
          "Distributed Finance",
        ],
        correct: 0,
      },
      {
        question: "What is a smart contract?",
        options: [
          "A legal document",
          "Self-executing code on blockchain",
          "A bank account",
          "A cryptocurrency",
        ],
        correct: 1,
      },
      {
        question: "What is the main advantage of DeFi?",
        options: [
          "Higher interest rates",
          "No intermediaries",
          "Government backing",
          "Physical branches",
        ],
        correct: 1,
      },
    ],
    gov: [
      {
        question: "What is DAO governance?",
        options: [
          "Government regulation",
          "Decentralized decision-making",
          "Corporate management",
          "Banking rules",
        ],
        correct: 1,
      },
      {
        question: "What is a governance token used for?",
        options: [
          "Trading only",
          "Voting on proposals",
          "Staking rewards",
          "Payment",
        ],
        correct: 1,
      },
      {
        question: "What is quorum in governance?",
        options: [
          "Minimum votes needed",
          "Maximum votes allowed",
          "Voting period",
          "Proposal type",
        ],
        correct: 0,
      },
    ],
    social: [
      {
        question: "What is Web3 social media?",
        options: [
          "Traditional social media",
          "Decentralized social platforms",
          "Email systems",
          "Chat applications",
        ],
        correct: 1,
      },
      {
        question: "What is a social token?",
        options: [
          "Government currency",
          "Community-created token",
          "Bank note",
          "Credit card",
        ],
        correct: 1,
      },
      {
        question: "What is the benefit of decentralized social networks?",
        options: [
          "Faster speeds",
          "User ownership of data",
          "More ads",
          "Centralized control",
        ],
        correct: 1,
      },
    ],
  };

  // Start daily task
  const startDailyTask = (category: string) => {
    if (!resumeWallet || !skillPetMinted) return;

    const questions = quizQuestions[category as keyof typeof quizQuestions];
    if (!questions || questions.length === 0) return;

    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];
    setQuizQuestion({ ...randomQuestion, category });
    setQuizAttempts(0);
    setQuizSelectedAnswer(null);
    setQuizResult(null);
    setDailyTaskOpen(true);
  };

  // Handle quiz answer
  const handleQuizAnswer = (answerIndex: number) => {
    if (!quizQuestion || quizResult === "correct" || !resumeWallet) return;

    setQuizSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === quizQuestion.correct;

    if (isCorrect) {
      setQuizResult("correct");
      // Add XP and update trait
      setTimeout(() => {
        addXPAndTrait(quizQuestion.category, 10);
      }, 1000);
    } else {
      const newAttempts = quizAttempts + 1;
      setQuizAttempts(newAttempts);

      if (newAttempts >= 3) {
        setQuizResult("incorrect");
      } else {
        setQuizResult("incorrect");
        setTimeout(() => {
          setQuizSelectedAnswer(null);
          setQuizResult(null);
        }, 2000);
      }
    }
  };

  // Add XP and update trait
  const addXPAndTrait = async (category: string, amount: number) => {
    if (!resumeWallet || !crediblesV2Address) return;

    setXpAdding(true);
    try {
      // Add XP
      writeContractXP({
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "addXPDirect",
        args: [resumeWallet, category, BigInt(amount)],
      });

      // Update trait
      const traitValue = `Completed ${category} daily task`;
      writeContractTrait({
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "updateSkillPetTraits",
        args: [resumeWallet, `daily_task_${category}`, traitValue],
      });
    } catch (error) {
      console.error("Error adding XP:", error);
      setXpAdding(false);
    }
  };

  // Handle XP success
  useEffect(() => {
    if (isXPSuccess && isTraitSuccess) {
      refetchStats();
      setXpAdding(false);
      setDailyTaskOpen(false);
      setQuizQuestion(null);
      setQuizAttempts(0);
      setQuizSelectedAnswer(null);
      setQuizResult(null);
    }
  }, [isXPSuccess, isTraitSuccess, refetchStats]);

  // Get evolution status
  const getEvolutionStatus = (
    stats: readonly [bigint, bigint, bigint, bigint] | undefined
  ): { stage: string; totalXP: number } => {
    if (!stats) return { stage: "Egg", totalXP: 0 };

    const totalXP =
      Number(stats[0]) + Number(stats[1]) + Number(stats[2]) + Number(stats[3]);

    if (totalXP === 0) return { stage: "Egg", totalXP: 0 };
    if (totalXP < 100) return { stage: "Egg", totalXP };
    if (totalXP < 300) return { stage: "Baby Dragon", totalXP };
    if (totalXP < 600) return { stage: "Young Dragon", totalXP };
    return { stage: "Dragon", totalXP };
  };

  const calculateLevel = (xp: bigint | undefined) => {
    if (!xp) return 0;
    return Math.floor(Number(xp) / 100);
  };

  const calculateProgress = (xp: bigint | undefined) => {
    if (!xp) return 0;
    return (Number(xp) % 100) / 100;
  };

  // Network switching - automatically switch to Base Sepolia when wallet connects
  const switchToBaseSepolia = useCallback(async () => {
    if (isSwitchingChain) return;

    try {
      await switchChainAsync({ chainId: baseSepolia.id });
    } catch (error) {
      console.error("Error switching chain:", error);
      // Wagmi v2 usually handles the "add chain" prompt automatically
      // if the chain is in the config created in Step 1.
    }
  }, [isSwitchingChain, switchChainAsync]);

  // 2. Ensure the auto-switch useEffect is robust
  useEffect(() => {
    // Only attempt switch if connected, wrong chain, not currently loading,
    // and we actually have a connector active
    if (
      isConnected &&
      chainId !== baseSepolia.id &&
      !isSwitchingChain &&
      address // Ensure we have an address before trying to switch
    ) {
      switchToBaseSepolia();
    }
  }, [isConnected, chainId, isSwitchingChain, address, switchToBaseSepolia]);

  // Automatically switch to Base Sepolia when wallet connects
  useEffect(() => {
    if (isConnected && chainId !== baseSepolia.id && !isSwitchingChain) {
      switchToBaseSepolia();
    }
  }, [isConnected, chainId, isSwitchingChain, switchToBaseSepolia]);

  // Also check chain when user type is selected
  useEffect(() => {
    if (
      userType &&
      isConnected &&
      chainId !== baseSepolia.id &&
      !isSwitchingChain
    ) {
      switchToBaseSepolia();
    }
  }, [userType, isConnected, chainId, isSwitchingChain, switchToBaseSepolia]);

  // Auto-launch app when wallet connects
  useEffect(() => {
    if (isConnected && showLanding) {
      setShowLanding(false);
    }
  }, [isConnected, showLanding]);

  const handleLogoClick = () => {
    setShowLanding(true);
    setUserType(null);
  };

  if (showLanding) {
    return (
      <>
        <Navbar onLogoClick={handleLogoClick} />
        <LandingPage onLaunchApp={() => setShowLanding(false)} />
      </>
    );
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    paddingTop: 80, // Navbar height
  };

  const contentWrapperStyle: React.CSSProperties = {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "40px 24px",
    width: "100%",
    flex: 1,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 60,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 48,
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 8,
    letterSpacing: "-0.03em",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 18,
    color: "#94a3b8",
    fontWeight: 500,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 24,
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 24,
    marginBottom: 60,
  };

  // Show user type selection if not selected
  if (!userType) {
    return (
      <div style={containerStyle}>
        <Navbar onLogoClick={handleLogoClick} />
        <div style={contentWrapperStyle}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <header style={{ marginBottom: 60 }}>
              <h1
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  marginBottom: 16,
                  background:
                    "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.03em",
                }}
              >
                Choose Your Path
              </h1>
              <p style={{ fontSize: 20, color: "#94a3b8" }}>
                Select how you want to interact with Credibles
              </p>
            </header>
            <div>
              {!isConnected ? (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 24,
                    padding: 48,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 20,
                      marginBottom: 32,
                      color: "#e2e8f0",
                      fontWeight: 500,
                    }}
                  >
                    Connect your wallet to get started
                  </p>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Wallet />
                  </div>
                </div>
              ) : (
                <UserTypeSelection onSelectUserType={handleUserTypeSelect} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Navbar onLogoClick={handleLogoClick} />

      <div style={contentWrapperStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Dashboard</h1>
            <p style={subtitleStyle}>Manage your identity and skills</p>
          </div>
          <button
            onClick={() => setUserType(null)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")
            }
          >
            ← Change Role
          </button>
        </header>

        <div>
          {/* Wallet Info */}
          {isConnected && address && (
            <div style={{ marginBottom: 60 }}>
              <h3 style={sectionTitleStyle}>
                <span style={{ fontSize: 32 }}></span> Your Wallets
              </h3>
              <div style={gridStyle}>
                <WalletCard
                  type="Main Wallet"
                  address={address}
                  onCopy={copyToClipboard}
                  copiedAddress={copiedAddress}
                />
                {resumeWallet && (
                  <WalletCard
                    type="Resume Wallet"
                    address={resumeWallet}
                    onCopy={copyToClipboard}
                    copiedAddress={copiedAddress}
                  />
                )}
              </div>
            </div>
          )}

          {/* Network Status */}
          {isConnected && chainId !== baseSepolia.id && (
            <div
              style={{
                background: "rgba(234, 179, 8, 0.1)",
                border: "1px solid rgba(234, 179, 8, 0.2)",
                color: "#FACC15",
                padding: 16,
                borderRadius: 16,
                marginBottom: 32,
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 20 }}>⚠️</span>
              <p>Wrong network. Please switch to Base Sepolia.</p>
            </div>
          )}

          {!crediblesV2Address ||
          crediblesV2Address ===
            "0x0000000000000000000000000000000000000000" ? (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#F87171",
                padding: 16,
                borderRadius: 16,
                marginBottom: 32,
              }}
            >
              <p>
                ⚠️ Contract address not configured. Please set
                NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS
              </p>
            </div>
          ) : userType === "issuer" ? (
            <>
              {isVerifiedIssuer ? (
                <>
                  <CreateAttestation
                    crediblesV2Address={crediblesV2Address}
                    attestationNFTAddress={
                      attestationNFTAddress ||
                      "0x0000000000000000000000000000000000000000"
                    }
                  />
                </>
              ) : (
                <IssuerVerification contractAddress={crediblesV2Address} />
              )}
            </>
          ) : (
            <>
              {!skillPetMinted ? (
                <SkillPetMint
                  contractAddress={crediblesV2Address}
                  onMintComplete={handleSkillPetMintComplete}
                />
              ) : (
                <>
                  <NFTGallery
                    crediblesV2Address={crediblesV2Address}
                    attestationNFTAddress={
                      attestationNFTAddress ||
                      "0x0000000000000000000000000000000000000000"
                    }
                  />

                  {/* Skill Tree Section */}
                  {skillPetStats && (
                    <section style={{ marginTop: 80 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          marginBottom: 32,
                          flexWrap: "wrap",
                          gap: 24,
                        }}
                      >
                        <div>
                          <h2 style={sectionTitleStyle}>
                            <span style={{ fontSize: 32 }}>🌳</span> Skill Tree
                          </h2>
                          <p style={{ fontSize: 16, color: "#94a3b8" }}>
                            Track your progress and evolve your SkillPet
                          </p>
                        </div>

                        <div
                          style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: 20,
                            padding: "16px 24px",
                            display: "flex",
                            alignItems: "center",
                            gap: 24,
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: 4,
                              }}
                            >
                              Current Form
                            </span>
                            <span
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                background:
                                  "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {evolution.stage}
                            </span>
                          </div>
                          <div
                            style={{
                              width: 1,
                              height: 32,
                              background: "rgba(255, 255, 255, 0.1)",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: 4,
                              }}
                            >
                              Total XP
                            </span>
                            <span
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: "#fff",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                              }}
                            >
                              {evolution.totalXP}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: 24,
                        }}
                      >
                        {[
                          {
                            key: "dev",
                            label: "Development",
                            icon: "💻",
                            color: "from-blue-500 to-cyan-500",
                            xp: skillPetStats[0],
                          },
                          {
                            key: "defi",
                            label: "DeFi",
                            icon: "💸",
                            color: "from-green-500 to-emerald-500",
                            xp: skillPetStats[1],
                          },
                          {
                            key: "gov",
                            label: "Governance",
                            icon: "⚖️",
                            color: "from-purple-500 to-pink-500",
                            xp: skillPetStats[2],
                          },
                          {
                            key: "social",
                            label: "Social",
                            icon: "🤝",
                            color: "from-orange-500 to-yellow-500",
                            xp: skillPetStats[3],
                          },
                        ].map((skill) => {
                          const level = calculateLevel(skill.xp);
                          const progress = calculateProgress(skill.xp);
                          const xpValue = skill.xp ? Number(skill.xp) : 0;
                          return (
                            <SkillCard
                              key={skill.key}
                              skill={skill}
                              level={level}
                              progress={progress}
                              xpValue={xpValue}
                              onStartTask={startDailyTask}
                              isAddingXP={xpAdding}
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Daily Task Modal */}
                  {dailyTaskOpen && quizQuestion && (
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(8px)",
                        animation: "fadeIn 0.3s ease-out",
                      }}
                      onClick={() => !xpAdding && setDailyTaskOpen(false)}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 512,
                          borderRadius: 24,
                          border: "1px solid rgba(255,255,255,0.15)",
                          backgroundImage:
                            "radial-gradient(circle at top, rgba(148,163,184,0.18), rgba(15,23,42,0.96) 60%)",
                          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                          overflow: "hidden",
                          animation: "scaleUp 0.3s ease-out",
                          position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #2563eb, #7c3aed)",
                            padding: 32,
                            color: "white",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              padding: 16,
                              opacity: 0.2,
                              transform: "rotate(12deg) scale(1.5)",
                              fontSize: 96,
                              pointerEvents: "none",
                            }}
                          >
                            📝
                          </div>
                          <h2
                            style={{
                              fontSize: 30,
                              fontWeight: 700,
                              marginBottom: 8,
                              position: "relative",
                              zIndex: 10,
                            }}
                          >
                            Daily Task
                          </h2>
                          <p
                            style={{
                              color: "#dbeafe",
                              fontWeight: 500,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontSize: 14,
                              position: "relative",
                              zIndex: 10,
                            }}
                          >
                            {quizQuestion.category} Challenge
                          </p>
                        </div>

                        <div style={{ padding: 32 }}>
                          <p
                            style={{
                              fontSize: 20,
                              fontWeight: 500,
                              marginBottom: 32,
                              lineHeight: 1.6,
                              color: "#e5e7eb",
                            }}
                          >
                            {quizQuestion.question}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 16,
                              marginBottom: 32,
                            }}
                          >
                            {quizQuestion.options.map((option, idx) => {
                              const isSelected = quizSelectedAnswer === idx;
                              let borderColor = "transparent";
                              let bgColor = "rgba(255,255,255,0.05)";
                              let textColor = "#e5e7eb";

                              if (isSelected) {
                                if (quizResult === "correct") {
                                  borderColor = "#22c55e";
                                  bgColor = "rgba(34,197,94,0.1)";
                                  textColor = "#4ade80";
                                } else if (quizResult === "incorrect") {
                                  borderColor = "#ef4444";
                                  bgColor = "rgba(239,68,68,0.1)";
                                  textColor = "#f87171";
                                } else {
                                  borderColor = "#3b82f6";
                                  bgColor = "rgba(59,130,246,0.1)";
                                  textColor = "#60a5fa";
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleQuizAnswer(idx)}
                                  disabled={
                                    quizResult === "correct" ||
                                    (quizResult === "incorrect" &&
                                      quizAttempts >= 3) ||
                                    xpAdding
                                  }
                                  style={{
                                    width: "100%",
                                    padding: 20,
                                    borderRadius: 16,
                                    textAlign: "left",
                                    transition: "all 0.2s ease",
                                    fontWeight: 500,
                                    border: `2px solid ${borderColor}`,
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    cursor:
                                      quizResult || xpAdding
                                        ? "default"
                                        : "pointer",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!quizResult && !xpAdding) {
                                      e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.1)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected && !quizResult) {
                                      e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.05)";
                                    }
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 999,
                                      border: isSelected
                                        ? `2px solid ${
                                            quizResult === "correct"
                                              ? "#22c55e"
                                              : quizResult === "incorrect"
                                              ? "#ef4444"
                                              : "#3b82f6"
                                          }`
                                        : "2px solid rgba(255,255,255,0.2)",
                                      backgroundColor: isSelected
                                        ? quizResult === "correct"
                                          ? "#22c55e"
                                          : quizResult === "incorrect"
                                          ? "#ef4444"
                                          : "#3b82f6"
                                        : "transparent",
                                      color: isSelected
                                        ? "white"
                                        : "rgba(255,255,255,0.4)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 14,
                                      fontWeight: 700,
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <span style={{ fontSize: 18 }}>{option}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Feedback Section */}
                          {quizResult === "correct" && (
                            <div
                              style={{
                                backgroundColor: "rgba(34,197,94,0.1)",
                                border: "1px solid rgba(34,197,94,0.2)",
                                borderRadius: 16,
                                padding: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                marginBottom: 24,
                                animation:
                                  "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                              }}
                            >
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 999,
                                  backgroundColor: "#22c55e",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: 20,
                                }}
                              >
                                ✓
                              </div>
                              <div>
                                <p
                                  style={{
                                    color: "#4ade80",
                                    fontWeight: 700,
                                    fontSize: 18,
                                  }}
                                >
                                  Correct Answer!
                                </p>
                                <p style={{ color: "rgba(74,222,128,0.8)" }}>
                                  Adding 10 XP to {quizQuestion.category}...
                                </p>
                              </div>
                            </div>
                          )}

                          {quizResult === "incorrect" && (
                            <div
                              style={{
                                backgroundColor:
                                  quizAttempts >= 3
                                    ? "rgba(239,68,68,0.1)"
                                    : "rgba(234,179,8,0.1)",
                                border:
                                  quizAttempts >= 3
                                    ? "1px solid rgba(239,68,68,0.2)"
                                    : "1px solid rgba(234,179,8,0.2)",
                                borderRadius: 16,
                                padding: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                marginBottom: 24,
                                animation:
                                  "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
                              }}
                            >
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 999,
                                  backgroundColor:
                                    quizAttempts >= 3 ? "#ef4444" : "#eab308",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: 20,
                                }}
                              >
                                {quizAttempts >= 3 ? "✕" : "!"}
                              </div>
                              <div>
                                <p
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color:
                                      quizAttempts >= 3 ? "#f87171" : "#facc15",
                                  }}
                                >
                                  {quizAttempts >= 3
                                    ? "Out of attempts"
                                    : "Incorrect"}
                                </p>
                                <p
                                  style={{
                                    color:
                                      quizAttempts >= 3
                                        ? "rgba(248,113,113,0.8)"
                                        : "rgba(250,204,21,0.8)",
                                  }}
                                >
                                  {quizAttempts >= 3
                                    ? "Try again tomorrow!"
                                    : `Attempts remaining: ${3 - quizAttempts}`}
                                </p>
                              </div>
                            </div>
                          )}

                          {xpAdding && (
                            <p
                              style={{
                                color: "#3b82f6",
                                fontWeight: 500,
                                marginBottom: 16,
                                animation: "pulse 1.5s infinite",
                              }}
                            >
                              ⏳ Adding XP to your SkillPet...
                            </p>
                          )}
                          <button
                            onClick={() => {
                              setDailyTaskOpen(false);
                              setQuizQuestion(null);
                              setQuizAttempts(0);
                              setQuizSelectedAnswer(null);
                              setQuizResult(null);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 24px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.2)",
                              backgroundColor: "rgba(255,255,255,0.1)",
                              color: "#e5e7eb",
                              fontWeight: 500,
                              cursor: xpAdding ? "not-allowed" : "pointer",
                              opacity: xpAdding ? 0.6 : 1,
                              transition: "all 0.2s ease",
                            }}
                            disabled={xpAdding}
                            onMouseEnter={(e) => {
                              if (!xpAdding)
                                e.currentTarget.style.backgroundColor =
                                  "rgba(255,255,255,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              if (!xpAdding)
                                e.currentTarget.style.backgroundColor =
                                  "rgba(255,255,255,0.1)";
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                      <style jsx>{`
                        @keyframes fadeIn {
                          from {
                            opacity: 0;
                          }
                          to {
                            opacity: 1;
                          }
                        }
                        @keyframes scaleUp {
                          from {
                            transform: scale(0.95);
                            opacity: 0;
                          }
                          to {
                            transform: scale(1);
                            opacity: 1;
                          }
                        }
                        @keyframes bounceIn {
                          0% {
                            transform: scale(0.3);
                            opacity: 0;
                          }
                          50% {
                            transform: scale(1.05);
                            opacity: 1;
                          }
                          70% {
                            transform: scale(0.9);
                          }
                          100% {
                            transform: scale(1);
                          }
                        }
                        @keyframes shake {
                          10%,
                          90% {
                            transform: translate3d(-1px, 0, 0);
                          }
                          20%,
                          80% {
                            transform: translate3d(2px, 0, 0);
                          }
                          30%,
                          50%,
                          70% {
                            transform: translate3d(-4px, 0, 0);
                          }
                          40%,
                          60% {
                            transform: translate3d(4px, 0, 0);
                          }
                        }
                        @keyframes pulse {
                          0%,
                          100% {
                            opacity: 1;
                          }
                          50% {
                            opacity: 0.5;
                          }
                        }
                      `}</style>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}