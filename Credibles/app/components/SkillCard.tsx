import React, { useState } from "react";

interface SkillCardProps {
  skill: {
    key: string;
    label: string;
    icon: string;
    color: string; // e.g. "from-blue-500 to-cyan-500" - we will map this to hex
    xp: bigint;
  };
  level: number;
  progress: number;
  xpValue: number;
  onStartTask: (key: string) => void;
  isAddingXP: boolean;
}

export default function SkillCard({
  skill,
  level,
  progress,
  xpValue,
  onStartTask,
  isAddingXP,
}: SkillCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Map Tailwind gradient classes to actual CSS gradients
  const getGradient = (colorClass: string) => {
    if (colorClass.includes("blue"))
      return "linear-gradient(135deg, #3B82F6, #06B6D4)";
    if (colorClass.includes("green"))
      return "linear-gradient(135deg, #10B981, #34D399)";
    if (colorClass.includes("purple"))
      return "linear-gradient(135deg, #8B5CF6, #EC4899)";
    if (colorClass.includes("orange"))
      return "linear-gradient(135deg, #F97316, #EAB308)";
    return "linear-gradient(135deg, #6B7280, #9CA3AF)";
  };

  const gradient = getGradient(skill.color);
  const progressPercent = Math.min(Math.max(progress * 100, 0), 100);

  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 24,
    padding: 24,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: isHovered
      ? "0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)"
      : "0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 280,
  };

  const iconStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: "rgba(0, 0, 0, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    marginBottom: 20,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  };

  const levelBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: 24,
    right: 24,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "6px 12px",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const levelLabelStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: 600,
  };

  const levelValueStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
    marginTop: 2,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 4,
    letterSpacing: "-0.02em",
  };

  const xpStyle: React.CSSProperties = {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 24,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  };

  const progressLabelStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 8,
  };

  const progressContainerStyle: React.CSSProperties = {
    height: 8,
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 24,
  };

  const progressFillStyle: React.CSSProperties = {
    height: "100%",
    width: `${progressPercent}%`,
    background: gradient,
    borderRadius: 999,
    transition: "width 0.5s ease-out",
    boxShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: "auto",
    width: "100%",
    padding: "14px",
    borderRadius: 16,
    border: "none",
    background: isAddingXP ? "rgba(255, 255, 255, 0.05)" : gradient,
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    cursor: isAddingXP ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    opacity: isAddingXP ? 0.7 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: isAddingXP ? "none" : "0 4px 12px rgba(0, 0, 0, 0.2)",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={iconStyle}>{skill.icon}</div>

      <div style={levelBadgeStyle}>
        <span style={levelLabelStyle}>Level</span>
        <span style={levelValueStyle}>{level}</span>
      </div>

      <div>
        <h3 style={titleStyle}>{skill.label}</h3>
        <p style={xpStyle}>{xpValue.toLocaleString()} XP earned</p>
      </div>

      <div>
        <div style={progressLabelStyle}>
          <span>Progress to next level</span>
          <span>{Math.floor(progressPercent)}%</span>
        </div>
        <div style={progressContainerStyle}>
          <div style={progressFillStyle} />
        </div>
      </div>

      <button
        onClick={() => !isAddingXP && onStartTask(skill.key)}
        disabled={isAddingXP}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!isAddingXP) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.3)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isAddingXP) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
          }
        }}
      >
        <span style={{ fontSize: 18 }}>⚡️</span>
        <span>{isAddingXP ? "Updating XP..." : "Complete Daily Task"}</span>
      </button>

      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: gradient,
          filter: "blur(60px)",
          opacity: 0.1,
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
