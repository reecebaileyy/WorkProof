import React, { useState } from "react";

interface WalletCardProps {
  type: "Main Wallet" | "Resume Wallet";
  address: string;
  onCopy: (address: string) => void;
  copiedAddress: string | null;
}

export default function WalletCard({
  type,
  address,
  onCopy,
  copiedAddress,
}: WalletCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isMain = type === "Main Wallet";

  // Premium Gradients
  const mainGradient = "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)";
  const resumeGradient = "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)";
  const activeGradient = isMain ? mainGradient : resumeGradient;

  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 24,
    padding: 24,
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: isHovered
      ? "0 12px 40px rgba(0, 0, 0, 0.15)"
      : "var(--glass-shadow)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    height: "100%",
    minHeight: 200,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  };

  const typeLabelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: isMain ? "#60A5FA" : "#E879F9",
    marginBottom: 4,
    display: "block",
  };

  const networkLabelStyle: React.CSSProperties = {
    fontSize: 13,
    color: "color-mix(in srgb, var(--foreground), transparent 50%)",
    fontWeight: 500,
  };

  const badgeStyle: React.CSSProperties = {
    background: isMain
      ? "rgba(96, 165, 250, 0.15)"
      : "rgba(232, 121, 249, 0.15)",
    color: isMain ? "#60A5FA" : "#E879F9",
    border: `1px solid ${
      isMain ? "rgba(96, 165, 250, 0.3)" : "rgba(232, 121, 249, 0.3)"
    }`,
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const addressContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "rgba(128, 128, 128, 0.1)",
    padding: 16,
    borderRadius: 16,
    border: "1px solid var(--card-border)",
  };

  const avatarStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: activeGradient,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "white",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
    flexShrink: 0,
  };

  const addressTextStyle: React.CSSProperties = {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 15,
    color: "var(--foreground)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
  };

  const fullAddressStyle: React.CSSProperties = {
    fontSize: 11,
    color: "color-mix(in srgb, var(--foreground), transparent 60%)",
    marginTop: 4,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    wordBreak: "break-all",
  };

  const footerStyle: React.CSSProperties = {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTop: "1px solid var(--card-border)",
  };

  const linkStyle: React.CSSProperties = {
    color: isMain ? "#60A5FA" : "#E879F9",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "opacity 0.2s",
    cursor: "pointer",
  };

  const copyHintStyle: React.CSSProperties = {
    fontSize: 12,
    color: "color-mix(in srgb, var(--foreground), transparent 60%)",
    fontStyle: "italic",
  };

  const badgeChars = address.slice(2, 4).toUpperCase();
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <span style={typeLabelStyle}>{type}</span>
          <span style={networkLabelStyle}>Base Sepolia • EVM</span>
        </div>
        <div style={badgeStyle}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "currentColor",
              boxShadow: "0 0 8px currentColor",
            }}
          />
          {isMain ? "Primary" : "Secondary"}
        </div>
      </div>

      {/* Address Section */}
      <div style={addressContainerStyle}>
        <div style={avatarStyle}>{badgeChars}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() => onCopy(address)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={addressTextStyle}>{shortAddress}</span>
              {copiedAddress === address && (
                <span
                  style={{
                    fontSize: 10,
                    background: "#10B981",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  COPIED
                </span>
              )}
            </div>
            <div style={fullAddressStyle}>{address}</div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <a
          href={`https://sepolia.basescan.org/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          View on BaseScan <span>↗</span>
        </a>
        <span style={copyHintStyle}>Tap address to copy</span>
      </div>

      {/* Decorative Glow */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 200,
          height: 200,
          background: activeGradient,
          filter: "blur(80px)",
          opacity: 0.15,
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
