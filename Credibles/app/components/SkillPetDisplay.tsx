"use client";

import React, { CSSProperties } from "react";
import Image from "next/image";
import { useSkillPet } from "../lib/hooks/useSkillPet";

export function SkillPetDisplay() {
  const { tokenId, level, stats, tokenURI, exists, isLoading } = useSkillPet();

  const numericLevel = level ? Number(level) : 1;
  const devXP = stats ? Number(stats.dev) : 0;
  const defiXP = stats ? Number(stats.defi) : 0;
  const govXP = stats ? Number(stats.gov) : 0;
  const socialXP = stats ? Number(stats.social) : 0;
  const totalXP = devXP + defiXP + govXP + socialXP;

  const wrapperStyle: CSSProperties = {
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    padding: 16,
  };

  const cardStyle: CSSProperties = {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.15)",
    backgroundImage:
      "radial-gradient(circle at top, rgba(148,163,184,0.18), rgba(15,23,42,0.96) 60%)",
    padding: 24,
    boxShadow: "0 18px 45px rgba(15,23,42,0.85)",
    backdropFilter: "blur(18px)",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const skeletonBlock: CSSProperties = {
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.8)",
  };

  if (isLoading) {
    return (
      <div style={wrapperStyle}>
        <div
          style={{ ...cardStyle, animation: "pulse 1.5s ease-in-out infinite" }}
        >
          <div style={{ ...skeletonBlock, height: 256, marginBottom: 16 }} />
          <div
            style={{
              ...skeletonBlock,
              height: 16,
              width: "50%",
              marginBottom: 8,
            }}
          />
          <div style={{ ...skeletonBlock, height: 16, width: "35%" }} />
        </div>
      </div>
    );
  }

  if (!exists) {
    return (
      <div style={wrapperStyle}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div
            style={{
              height: 256,
              borderRadius: 20,
              backgroundColor: "rgba(15,23,42,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 48 }}>🥚</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            No SkillPet Yet
          </h3>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>
            Mint your SkillPet NFT to start leveling up your onchain skills.
          </p>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 999,
              border: "1px solid rgba(56,189,248,0.6)",
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
              backgroundImage: "linear-gradient(135deg, #38bdf8, #6366f1)",
              boxShadow: "0 12px 30px rgba(56,189,248,0.6)",
              cursor: "pointer",
            }}
          >
            ✨ Mint SkillPet
          </button>
        </div>
      </div>
    );
  }

  const stageEmoji = numericLevel >= 7 ? "🐉" : numericLevel >= 4 ? "🐲" : "🥚";

  return (
    <div style={wrapperStyle}>
      <div style={cardStyle}>
        {/* Visual */}
        <div
          style={{
            position: "relative",
            height: 256,
            borderRadius: 20,
            marginBottom: 20,
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(135deg, rgba(56,189,248,0.9), rgba(79,70,229,0.95), rgba(168,85,247,0.9))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {tokenURI ? (
            <Image
              src={tokenURI}
              alt="SkillPet"
              fill
              style={{ objectFit: "contain" }}
              unoptimized
            />
          ) : (
            <span
              style={{
                fontSize: 64,
                textShadow: "0 12px 30px rgba(15,23,42,0.8)",
              }}
            >
              {stageEmoji}
            </span>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to top, rgba(15,23,42,0.5), transparent 50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>
              SkillPet #{tokenId}
            </h3>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              Your onchain companion for skill progression
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.6)",
                backgroundColor: "rgba(56,189,248,0.18)",
                color: "#7dd3fc",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
              }}
            >
              Level {numericLevel}
            </span>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Total XP: {totalXP.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            borderTop: "1px solid rgba(148,163,184,0.2)",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <StatPill label="Dev XP" value={devXP} color="#7dd3fc" />
            <StatPill label="DeFi XP" value={defiXP} color="#6ee7b7" />
            <StatPill label="Gov XP" value={govXP} color="#c4b5fd" />
            <StatPill label="Social XP" value={socialXP} color="#f9a8d4" />
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(148,163,184,0.2)",
              paddingTop: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#9ca3af",
                }}
              >
                Total Experience
              </span>
              <span
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {totalXP.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatPillProps {
  label: string;
  value: number;
  color: string;
}

function StatPill({ label, value, color }: StatPillProps) {
  const pillStyle: CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,23,42,0.9)",
    padding: "10px 12px",
    boxShadow: "0 10px 25px rgba(15,23,42,0.7)",
  };

  return (
    <div style={pillStyle}>
      <span style={{ display: "block", fontSize: 12, color: "#9ca3af" }}>
        {label}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 4,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
          fontWeight: 600,
          color,
        }}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}
