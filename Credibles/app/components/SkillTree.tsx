"use client";

import { useSkillPet, SkillPetStats } from "../lib/hooks/useSkillPet";

interface SkillCategory {
  name: string;
  label: string;
  color: string;
  bgColor: string;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: "dev",
    label: "Development",
    color: "text-blue-600",
    bgColor: "bg-blue-500",
  },
  {
    name: "defi",
    label: "DeFi",
    color: "text-green-600",
    bgColor: "bg-green-500",
  },
  {
    name: "gov",
    label: "Governance",
    color: "text-purple-600",
    bgColor: "bg-purple-500",
  },
  {
    name: "social",
    label: "Social",
    color: "text-pink-600",
    bgColor: "bg-pink-500",
  },
];

function getXPValue(stats: SkillPetStats | null, category: string): bigint {
  if (!stats) return BigInt(0);
  
  switch (category) {
    case "dev":
      return stats.dev;
    case "defi":
      return stats.defi;
    case "gov":
      return stats.gov;
    case "social":
      return stats.social;
    default:
      return BigInt(0);
  }
}

function calculateLevel(xp: bigint): number {
  return Number(xp) >= 100 ? Math.floor(Number(xp) / 100) : 1;
}

function calculateProgress(xp: bigint): number {
  const level = calculateLevel(xp);
  const xpInCurrentLevel = Number(xp) % 100;
  return xpInCurrentLevel;
}

export function SkillTree() {
  const { stats, isLoading, exists } = useSkillPet();

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Skill Tree</h2>
        <div className="space-y-4">
          {SKILL_CATEGORIES.map((category) => (
            <div key={category.name} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!exists) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Skill Tree</h2>
        <div className="text-center py-12 text-gray-500">
          <p>No SkillPet found. Mint your SkillPet to start tracking your skills!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Skill Tree</h2>
      <div className="space-y-6">
        {SKILL_CATEGORIES.map((category) => {
          const xp = getXPValue(stats, category.name);
          const level = calculateLevel(xp);
          const progress = calculateProgress(xp);
          const isUnlocked = level > 1;

          return (
            <div key={category.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${category.color}`}>
                    {category.label}
                  </span>
                  {isUnlocked && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Level {level}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {Number(xp)} XP
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full ${category.bgColor} transition-all duration-500 ease-out ${
                    isUnlocked ? "opacity-100" : "opacity-60"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {progress}% to next level
                    </span>
                  </div>
                </div>
              </div>
              
              {!isUnlocked && (
                <p className="text-xs text-gray-500">
                  Reach 100 XP to unlock Level 2
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

