"use client";
import { useState, useEffect } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId, useSwitchChain } from "wagmi";
import { parseAbi } from "viem";
import { baseSepolia } from "wagmi/chains";
import styles from "./page.module.css";
import UserTypeSelection from "./components/UserTypeSelection";
import IssuerVerification from "./components/IssuerVerification";
import SkillPetMint from "./components/SkillPetMint";
import CreateAttestation from "./components/CreateAttestation";
import NFTGallery from "./components/NFTGallery";
import { getResumeWallet } from "./lib/baseAccount";

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
  const [isAddingChain, setIsAddingChain] = useState(false);
  
  const [userType, setUserType] = useState<UserType>(null);
  const [resumeWallet, setResumeWallet] = useState<`0x${string}` | null>(null);
  const [skillPetMinted, setSkillPetMinted] = useState(false);
  const [dailyTaskOpen, setDailyTaskOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<{ question: string; options: string[]; correct: number; category: string } | null>(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);
  const [xpAdding, setXpAdding] = useState(false);

  const crediblesV2Address = process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS as `0x${string}` || 
    process.env.NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS as `0x${string}`;

  // Get resume wallet if user type is "user"
  const { data: registeredWallet } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "getResumeWallet",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && userType === "user" && !!crediblesV2Address,
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

  const { writeContract: writeContractXP, data: xpHash, isPending: isXPPending } = useWriteContract();
  const { writeContract: writeContractTrait, data: traitHash, isPending: isTraitPending } = useWriteContract();
  
  const { isLoading: isXPConfirming, isSuccess: isXPSuccess } = useWaitForTransactionReceipt({
    hash: xpHash,
  });

  const { isLoading: isTraitConfirming, isSuccess: isTraitSuccess } = useWaitForTransactionReceipt({
    hash: traitHash,
  });

  // Check if user is verified issuer
  const { data: isVerifiedIssuer } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "isVerifiedIssuer",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && userType === "issuer" && !!crediblesV2Address,
    },
  });

  // Set resume wallet when registered
  useEffect(() => {
    if (registeredWallet && registeredWallet !== "0x0000000000000000000000000000000000000000") {
      setResumeWallet(registeredWallet);
    }
  }, [registeredWallet]);

  // Get resume wallet from Base Account (only on Base Sepolia)
  useEffect(() => {
    if (userType === "user" && isConnected && chainId === baseSepolia.id && !resumeWallet && !isSwitchingChain) {
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

  // Quiz questions
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
    if (!resumeWallet || !skillPetMinted) return;
    
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
  const getEvolutionStatus = (stats: readonly [bigint, bigint, bigint, bigint] | undefined): { stage: string; totalXP: number } => {
    if (!stats) return { stage: "Egg", totalXP: 0 };
    
    const totalXP = Number(stats[0]) + Number(stats[1]) + Number(stats[2]) + Number(stats[3]);
    
    if (totalXP === 0) return { stage: "Egg", totalXP: 0 };
    if (totalXP < 100) return { stage: "Egg", totalXP };
    if (totalXP < 300) return { stage: "Baby Dragon", totalXP };
    if (totalXP < 600) return { stage: "Young Dragon", totalXP };
    return { stage: "Dragon", totalXP };
  };

  const evolution = getEvolutionStatus(skillPetStats);

  const calculateLevel = (xp: bigint | undefined) => {
    if (!xp) return 0;
    return Math.floor(Number(xp) / 100);
  };

  const calculateProgress = (xp: bigint | undefined) => {
    if (!xp) return 0;
    return (Number(xp) % 100) / 100;
  };

  // Network switching - automatically switch to Base Sepolia when wallet connects
  const switchToBaseSepolia = async () => {
    try {
      await switchChainAsync({ chainId: baseSepolia.id });
    } catch (error: any) {
      // Chain not added to wallet - add it first
      if (error?.code === 4902 || error?.shortMessage?.includes('4902') || error?.message?.includes('Unrecognized chain')) {
        setIsAddingChain(true);
        try {
          const provider = (window as any).ethereum;
          if (provider) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${baseSepolia.id.toString(16)}`,
                chainName: baseSepolia.name,
                rpcUrls: baseSepolia.rpcUrls.default.http,
                nativeCurrency: baseSepolia.nativeCurrency,
                blockExplorerUrls: baseSepolia.blockExplorers?.default ? [baseSepolia.blockExplorers.default.url] : [],
              }],
            });
            // After adding, switch to it
            await switchChainAsync({ chainId: baseSepolia.id });
          }
        } catch (addError) {
          console.error("Failed to add chain:", addError);
          setIsAddingChain(false);
        } finally {
          setIsAddingChain(false);
        }
      } else {
        console.error("Error switching chain:", error);
      }
    }
  };

  // Automatically switch to Base Sepolia when wallet connects
  useEffect(() => {
    if (isConnected && chainId !== baseSepolia.id && !isSwitchingChain && !isAddingChain) {
      switchToBaseSepolia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, chainId, isSwitchingChain, isAddingChain]);

  // Show user type selection if not selected
  if (!userType) {
    return (
      <div className={styles.container}>
        <header className={styles.headerWrapper}>
          <h1 className={styles.title}>Credibles - Living Resume</h1>
          <Wallet />
        </header>
        <div className={styles.content}>
          {!isConnected ? (
            <div className={styles.connectPrompt}>
              <p>Connect your wallet to get started</p>
            </div>
          ) : (
            <UserTypeSelection onSelectUserType={handleUserTypeSelect} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <h1 className={styles.title}>Credibles - Living Resume</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            onClick={() => setUserType(null)}
            className={styles.backButton}
          >
            ← Change Role
          </button>
        <Wallet />
        </div>
      </header>

      <div className={styles.content}>
        {/* Network Status */}
            {isConnected && chainId !== baseSepolia.id && (
              <div className={styles.infoText} style={{ 
                background: 'rgba(255, 170, 0, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 170, 0, 0.3)',
                marginBottom: '1rem'
              }}>
            <p>
              ⚠️ Wrong network. Please switch to Base Sepolia.
                  </p>
                </div>
              )}

        {!crediblesV2Address || crediblesV2Address === "0x0000000000000000000000000000000000000000" ? (
          <div className={styles.connectPrompt}>
            <p>⚠️ Contract address not configured. Please set NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS</p>
                </div>
        ) : userType === "issuer" ? (
          <>
            {isVerifiedIssuer ? (
              <>
                <CreateAttestation contractAddress={crediblesV2Address} />
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
                <NFTGallery contractAddress={crediblesV2Address} />
                
                {/* Skill Tree Section */}
                {skillPetStats && (
              <section className={styles.skillTree}>
                <div className={styles.skillTreeHeader}>
                      <h2>Skill Tree</h2>
                  <div className={styles.evolutionBadge}>
                    <span className={styles.evolutionLabel}>Evolution:</span>
                    <span className={styles.evolutionStage}>{evolution.stage}</span>
                    <span className={styles.evolutionXP}>({evolution.totalXP} Total XP)</span>
                  </div>
                </div>
                  <div className={styles.skillsGrid}>
                    {[
                        { key: "dev", label: "Development", xp: skillPetStats[0] },
                        { key: "defi", label: "DeFi", xp: skillPetStats[1] },
                        { key: "gov", label: "Governance", xp: skillPetStats[2] },
                        { key: "social", label: "Social", xp: skillPetStats[3] },
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
                              disabled={xpAdding}
                            >
                              Complete Daily Task
                            </button>
                        </div>
                      );
                    })}
                  </div>
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
                        <p className={styles.quizInfo}>⏳ Adding XP to your SkillPet...</p>
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
