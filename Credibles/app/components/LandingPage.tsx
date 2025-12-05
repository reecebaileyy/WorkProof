import { useState } from "react";
import Card from "./ui/Card";

interface LandingPageProps {
  onLaunchApp: () => void;
}

export default function LandingPage({ onLaunchApp }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    paddingTop: 80,
  };

  const sectionStyle: React.CSSProperties = {
    padding: "80px 24px",
    position: "relative",
    overflow: "hidden",
  };

  const heroTitleStyle: React.CSSProperties = {
    fontSize: 64,
    fontWeight: 800,
    lineHeight: 1.1,
    textAlign: "center",
    marginBottom: 24,
    background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.03em",
  };

  const heroSubtitleStyle: React.CSSProperties = {
    fontSize: 20,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 600,
    margin: "0 auto 48px",
    lineHeight: 1.6,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "16px 32px",
    borderRadius: 999,
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    color: "white",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)",
  };

  const glassButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "white",
    backdropFilter: "blur(10px)",
  };

  const featureCardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 24,
    padding: 32,
    backdropFilter: "blur(20px)",
    transition: "all 0.3s ease",
  };

  const evolveSectionStyle: React.CSSProperties = {
    ...sectionStyle,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(59, 130, 246, 0.05) 100%)",
  };

  const stageCardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    padding: 32,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 32,
    backdropFilter: "blur(20px)",
    transition: "all 0.3s ease",
    width: "100%",
    maxWidth: 300,
  };

  const stageIconStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 64,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  return (
    <div style={containerStyle}>
      {/* Hero Section */}
      <section style={sectionStyle}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: 999,
              color: "#60A5FA",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 32,
            }}
          >
            ✨ Introducing Credibles V2
          </div>

          <h1 style={heroTitleStyle}>
            Your Living Resume <br />
            <span
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              on the Blockchain
            </span>
          </h1>

          <p style={heroSubtitleStyle}>
            Turn your skills into a verifiable, evolving NFT. Prove your worth
            with on-chain attestations and level up your career.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              onClick={onLaunchApp}
              style={primaryButtonStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              Launch App
            </button>
            <button
              style={glassButtonStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")
              }
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={sectionStyle}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 40,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 60,
              color: "#fff",
            }}
          >
            Why Credibles?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 32,
            }}
          >
            {[
              {
                icon: "🐉",
                title: "SkillPets",
                desc: "Your resume is now a living, breathing NFT pet that evolves as you gain experience and verify skills.",
                color: "#3B82F6",
              },
              {
                icon: "✅",
                title: "Verifiable",
                desc: "Powered by Ethereum Attestation Service (EAS). Every skill is cryptographically verified on-chain.",
                color: "#8B5CF6",
              },
              {
                icon: "💼",
                title: "Portable",
                desc: "Take your reputation anywhere. Your Credibles profile works across the entire Web3 ecosystem.",
                color: "#10B981",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  ...featureCardStyle,
                  transform:
                    hoveredFeature === idx
                      ? "translateY(-8px)"
                      : "translateY(0)",
                  borderColor:
                    hoveredFeature === idx
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(255, 255, 255, 0.08)",
                }}
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: `${feature.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    marginBottom: 24,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 12,
                    color: "#fff",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Watch it Evolve Section */}
      <section style={evolveSectionStyle}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 800,
              marginBottom: 24,
              background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Watch it Evolve
          </h2>
          <p
            style={{
              fontSize: 20,
              color: "#94a3b8",
              maxWidth: 700,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            As you grow, your SkillPet evolves visually, signaling your
            seniority to the world.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 60,
              flexWrap: "wrap",
            }}
          >
            {/* Stage 1 */}
            <div style={stageCardStyle}>
              <div style={stageIconStyle}>🥚</div>
              <div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  Egg
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  Beginner
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ fontSize: 48, color: "rgba(255, 255, 255, 0.2)" }}>
              →
            </div>

            {/* Stage 2 */}
            <div
              style={{
                ...stageCardStyle,
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                boxShadow: "0 0 40px rgba(139, 92, 246, 0.15)",
              }}
            >
              <div
                style={{
                  ...stageIconStyle,
                  background:
                    "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                  border: "none",
                  boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)",
                }}
              >
                <span
                  style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}
                >
                  🐉
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  Dragon
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#A78BFA",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  Master
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "40px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          textAlign: "center",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        © 2024 Credibles. Built on Base.
      </footer>
    </div>
  );
}
