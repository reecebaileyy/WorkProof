"use client";

import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES, CREDIBLES_ABI } from "../contracts";
import { useEffect, useState } from "react";

export interface SkillPetStats {
  dev: bigint;
  defi: bigint;
  gov: bigint;
  social: bigint;
}

export interface SkillPetData {
  tokenId: number | null;
  level: bigint | null;
  stats: SkillPetStats | null;
  tokenURI: string | null;
  exists: boolean;
}

/**
 * Hook to fetch user's SkillPet NFT data
 */
export function useSkillPet() {
  const { address, isConnected } = useAccount();
  const [tokenId, setTokenId] = useState<number | null>(null);

  // Get user's token balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.CREDIBLES,
    abi: CREDIBLES_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Get first token ID if user has tokens
  // Note: This is a simplified version. In production, you'd use tokenOfOwnerByIndex
  // or implement ERC721Enumerable for proper token enumeration
  useEffect(() => {
    if (balance && Number(balance) > 0) {
      // For MVP, assume tokenId starts at 1 and user owns tokenId 1
      // In production, implement proper token enumeration
      setTokenId(1);
    } else {
      setTokenId(null);
    }
  }, [balance]);

  // Get token stats
  const { data: stats } = useReadContract({
    address: CONTRACT_ADDRESSES.CREDIBLES,
    abi: CREDIBLES_ABI,
    functionName: "characterStats",
    args: tokenId !== null ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== null,
    },
  });

  // Get token level
  const { data: level } = useReadContract({
    address: CONTRACT_ADDRESSES.CREDIBLES,
    abi: CREDIBLES_ABI,
    functionName: "levels",
    args: tokenId !== null ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== null,
    },
  });

  // Get token URI
  const { data: tokenURI } = useReadContract({
    address: CONTRACT_ADDRESSES.CREDIBLES,
    abi: CREDIBLES_ABI,
    functionName: "tokenURI",
    args: tokenId !== null ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== null,
    },
  });

  const skillPetData: SkillPetData = {
    tokenId,
    level: level ?? null,
    stats: stats
      ? {
          dev: stats[0],
          defi: stats[1],
          gov: stats[2],
          social: stats[3],
        }
      : null,
    tokenURI: tokenURI ?? null,
    exists: tokenId !== null && !!stats,
  };

  return {
    ...skillPetData,
    isLoading: balance === undefined,
    hasSkillPet: Number(balance ?? 0) > 0,
  };
}

