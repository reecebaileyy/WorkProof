import Link from "next/link";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useState } from "react";

interface NavbarProps {
  onLogoClick?: () => void;
}

export default function Navbar({ onLogoClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onLogoClick) {
      e.preventDefault();
      onLogoClick();
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "16px 24px",
      }}
    >
      <div
        className="nav-content"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          borderRadius: 20,
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        }}
      >
        <Link
          href="/"
          onClick={handleLogoClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              background: "linear-gradient(135deg, #0071e3 0%, #5e5ce6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Credibles
          </span>
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div className="nav-links">
            {["Features", "How it Works"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color:
                    hoveredLink === item
                      ? "var(--foreground)"
                      : "rgba(var(--foreground-rgb), 0.8)",
                  opacity: hoveredLink === item ? 1 : 0.8,
                  transition: "color 0.2s, opacity 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={() => setHoveredLink(item)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {item}
              </Link>
            ))}
          </div>

          <Wallet />

          <button
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              fontSize: 24,
              color: "inherit",
            }}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 24,
              borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              animation: "slideDown 0.3s ease-out",
              marginTop: 8,
              borderRadius: "0 0 20px 20px",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
            }}
          >
            {["Features", "How it Works"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "inherit",
                  textAlign: "center",
                  padding: 8,
                  textDecoration: "none",
                }}
              >
                {item}
              </Link>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .nav-links {
          display: none;
          align-items: center;
          gap: 24px;
        }
        .mobile-menu-button {
          display: flex;
        }
        @media (min-width: 768px) {
          .nav-links {
            display: flex;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
        @media (prefers-color-scheme: dark) {
          .nav-content {
            background: rgba(28, 28, 30, 0.6) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
