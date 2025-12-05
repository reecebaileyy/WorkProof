"use client";

import { useSkillPet, SkillPetStats } from "../lib/hooks/useSkillPet";
import React, { CSSProperties, useState } from "react";

interface SkillCategory {
  name: string;
  label: string;
  color: string; // Gradient for the bar
  textColor: string; // Color for text
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: "dev",
    label: "Development",
    color: "linear-gradient(90deg, #38bdf8, #2563eb)",
    textColor: "#7dd3fc",
  },
  {
    name: "defi",
    label: "DeFi",
    color: "linear-gradient(90deg, #4ade80, #059669)",
    textColor: "#86efac",
  },
  {
    name: "gov",
    label: "Governance",
    color: "linear-gradient(90deg, #c084fc, #7c3aed)",
    textColor: "#d8b4fe",
  },
  {
    name: "social",
    label: "Social",
    color: "linear-gradient(90deg, #f472b6, #db2777)",
    textColor: "#f9a8d4",
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
  const xpInCurrentLevel = Number(xp) % 100;
  return xpInCurrentLevel;
}

export function SkillTree() {
  const { stats, isLoading, exists } = useSkillPet();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const containerStyle: CSSProperties = {
    width: "100%",
    maxWidth: 672, // max-w-2xl
    margin: "0 auto",
    padding: 24,
  };

  const headerStyle: CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    color: "#e5e7eb",
    letterSpacing: "-0.02em",
  };

  const cardStyle: CSSProperties = {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundImage:
      "radial-gradient(circle at top, rgba(148,163,184,0.15), rgba(15,23,42,0.95) 60%)",
    padding: 24,
    boxShadow: "0 18px 45px rgba(15,23,42,0.8)",
    backdropFilter: "blur(18px)",
  };

  const skeletonBlock: CSSProperties = {
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.6)",
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Skill Tree</h2>
        <div style={cardStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {SKILL_CATEGORIES.map((category) => (
              <div
                key={category.name}
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              >
                <div
                  style={{
                    ...skeletonBlock,
                    height: 16,
                    width: "25%",
                    marginBottom: 8,
                  }}
                />
                <div style={{ ...skeletonBlock, height: 24, width: "100%" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!exists) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Skill Tree</h2>
        <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
          <p style={{ color: "#9ca3af", fontSize: 16 }}>
            No SkillPet found. Mint your SkillPet to start tracking your skills!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Skill Tree</h2>
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {SKILL_CATEGORIES.map((category) => {
            const xp = getXPValue(stats, category.name);
            const level = calculateLevel(xp);
            const progress = calculateProgress(xp);
            const isUnlocked = level > 1;
            const isHovered = hoveredCategory === category.name;

            return (
              <div
                key={category.name}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  transition: "transform 0.2s ease",
                  transform: isHovered ? "translateX(4px)" : "translateX(0)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: category.textColor,
                        fontSize: 15,
                      }}
                    >
                      {category.label}
                    </span>
                    {isUnlocked && (
                      <span
                        style={{
                          fontSize: 11,
                          backgroundColor: "rgba(16,185,129,0.15)",
                          color: "#6ee7b7",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 600,
                          border: "1px solid rgba(52,211,153,0.3)",
                        }}
                      >
                        Level {level}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#9ca3af",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {Number(xp).toLocaleString()} XP
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: 20,
                    backgroundColor: "rgba(2,6,23,0.6)",
                    borderRadius: 999,
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(progress, 100)}%`,
                      background: category.color,
                      transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: isUnlocked || progress > 0 ? 1 : 0.4,
                      boxShadow: "0 0 12px rgba(255,255,255,0.2)",
                      borderRadius: 999,
                      position: "relative",
                    }}
                  >
                    {/* Shimmer effect */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                        transform: "skewX(-20deg)",
                        animation: isHovered ? "shimmer 1.5s infinite" : "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.9)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {progress}% to next level
                    </span>
                  </div>
                </div>

                {!isUnlocked && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 6,
                      fontStyle: "italic",
                    }}
                  >
                    Reach 100 XP to unlock Level 2
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-20deg);
          }
          100% {
            transform: translateX(200%) skewX(-20deg);
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
  );
}
