"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import styles from "./NFTGallery.module.css";

const CREDIBLES_V2_ABI = parseAbi([
  "function getSkillPetTokenId(address) view returns (uint256)",
  "function skillPetStats(uint256) view returns (uint256 dev, uint256 defi, uint256 gov, uint256 social)",
  "function getSkillPetTraits(uint256) view returns ((string traitType, string value)[])",
  "function getResumeWallet(address) view returns (address)",
]);

const ATTESTATION_NFT_ABI = parseAbi([
  "function getUserAttestations(address) view returns (uint256[])",
  "function getAttestationData(uint256) view returns ((address issuer, string category, uint256 timestamp, string issuerInfo, string title))",
]);

interface NFTGalleryProps {
  crediblesV2Address: `0x${string}`;
  attestationNFTAddress: `0x${string}`;
}

export default function NFTGallery({ crediblesV2Address, attestationNFTAddress }: NFTGalleryProps) {
  const { address, isConnected } = useAccount();
  const [resumeWallet, setResumeWallet] = useState<`0x${string}` | null>(null);
  const [skillPetTokenId, setSkillPetTokenId] = useState<bigint | null>(null);
  const [attestationTokenIds, setAttestationTokenIds] = useState<bigint[]>([]);

  // Get resume wallet
  const { data: registeredWallet } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "getResumeWallet",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!crediblesV2Address,
    },
  });

  // Get SkillPet token ID
  const { data: skillPetId } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "getSkillPetTokenId",
    args: resumeWallet ? [resumeWallet] : undefined,
    query: {
      enabled: !!resumeWallet && !!crediblesV2Address,
    },
  });

  // Get SkillPet stats
  const { data: skillPetStats } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "skillPetStats",
    args: skillPetTokenId ? [skillPetTokenId] : undefined,
    query: {
      enabled: !!skillPetTokenId && !!crediblesV2Address,
    },
  });

  // Get attestation token IDs
  const { data: attestationIds } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "getUserAttestations",
    args: resumeWallet ? [resumeWallet] : undefined,
    query: {
      enabled: !!resumeWallet && !!attestationNFTAddress && attestationNFTAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  useEffect(() => {
    if (registeredWallet && registeredWallet !== "0x0000000000000000000000000000000000000000") {
      setResumeWallet(registeredWallet);
    }
  }, [registeredWallet]);

  useEffect(() => {
    if (skillPetId) {
      setSkillPetTokenId(skillPetId);
    }
  }, [skillPetId]);

  useEffect(() => {
    if (attestationIds && attestationIds.length > 0) {
      setAttestationTokenIds([...attestationIds]);
    }
  }, [attestationIds]);

  const getEvolutionStage = (stats: readonly [bigint, bigint, bigint, bigint] | undefined): string => {
    if (!stats) return "Egg";
    const totalXP = Number(stats[0]) + Number(stats[1]) + Number(stats[2]) + Number(stats[3]);
    if (totalXP === 0) return "Egg";
    if (totalXP < 100) return "Egg";
    if (totalXP < 300) return "Baby Dragon";
    if (totalXP < 600) return "Young Dragon";
    return "Dragon";
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <p>Please connect your wallet to view your NFTs</p>
      </div>
    );
  }

  if (!resumeWallet) {
    return (
      <div className={styles.container}>
        <p>No resume wallet found. Please mint your SkillPet NFT first.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Your NFTs</h2>

      {/* SkillPet NFT Section */}
      <section className={styles.section}>
        <h3>SkillPet NFT</h3>
        {skillPetTokenId ? (
          <div className={styles.skillPetCard}>
            <div className={styles.nftHeader}>
              <span className={styles.tokenId}>Token #{skillPetTokenId.toString()}</span>
              <span className={styles.evolution}>
                {skillPetStats ? getEvolutionStage(skillPetStats) : "Loading..."}
              </span>
            </div>
            {skillPetStats && (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span>Development:</span> <strong>{Number(skillPetStats[0])} XP</strong>
                </div>
                <div className={styles.stat}>
                  <span>DeFi:</span> <strong>{Number(skillPetStats[1])} XP</strong>
                </div>
                <div className={styles.stat}>
                  <span>Governance:</span> <strong>{Number(skillPetStats[2])} XP</strong>
                </div>
                <div className={styles.stat}>
                  <span>Social:</span> <strong>{Number(skillPetStats[3])} XP</strong>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p>No SkillPet NFT found. Mint one to get started!</p>
        )}
      </section>

      {/* Attestation NFTs Section */}
      <section className={styles.section}>
        <h3>Attestation NFTs ({attestationTokenIds.length})</h3>
        {attestationTokenIds.length > 0 ? (
          <div className={styles.attestationGrid}>
            {attestationTokenIds.map((tokenId) => (
              <AttestationCard
                key={tokenId.toString()}
                attestationNFTAddress={attestationNFTAddress}
                tokenId={tokenId}
              />
            ))}
          </div>
        ) : (
          <p>No attestation NFTs yet. Issuers can create attestations for you!</p>
        )}
      </section>
    </div>
  );
}

function AttestationCard({
  attestationNFTAddress,
  tokenId,
}: {
  attestationNFTAddress: `0x${string}`;
  tokenId: bigint;
}) {
  const { data: attestationData } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "getAttestationData",
    args: [tokenId],
    query: {
      enabled: !!attestationNFTAddress && attestationNFTAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  if (!attestationData) {
    return (
      <div className={styles.attestationCard}>
        <p>Loading...</p>
      </div>
    );
  }

  const date = new Date(Number(attestationData.timestamp) * 1000);

  return (
    <div className={styles.attestationCard}>
      <div className={styles.cardHeader}>
        <span className={styles.tokenId}>Token #{tokenId.toString()}</span>
        <span className={styles.category}>{attestationData.category.toUpperCase()}</span>
      </div>
      <div className={styles.cardBody}>
        <h4 className={styles.attestationTitle}>{attestationData.title}</h4>
        <p>
          <strong>Issued by:</strong> {attestationData.issuer.slice(0, 6)}...{attestationData.issuer.slice(-4)}
        </p>
        <p>
          <strong>Date:</strong> {date.toLocaleDateString()}
        </p>
        {attestationData.issuerInfo && (
          <p>
            <strong>Details:</strong> {attestationData.issuerInfo}
          </p>
        )}
      </div>
    </div>
  );
}

