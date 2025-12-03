"use client";

import { useAccount } from "wagmi";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AttestationForm } from "./components/AttestationForm";
import { AttestationList } from "./components/AttestationList";
import { Hero } from "./components/Hero";
import { FeatureCard } from "./components/FeatureCard";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { UseCasesSection } from "./components/UseCasesSection";
import { StatsSection } from "./components/StatsSection";
import { CTASection } from "./components/CTASection";

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      <Navbar />

      {!isConnected ? (
        <main className="flex-grow">
          <Hero />

          <section className="py-32 relative">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-black mb-6">
                  <span className="gradient-text">Why WorkProof?</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  The future of professional verification is here
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon="🔐"
                  title="Tamper-Proof"
                  description="Blockchain-based attestations that can never be altered or faked. Your achievements are permanently secured."
                  delay="0s"
                />
                <FeatureCard
                  icon="⚡"
                  title="Instant Verification"
                  description="Anyone can verify your attestations in seconds using blockchain explorers. No waiting, no intermediaries."
                  delay="0.1s"
                />
                <FeatureCard
                  icon="🌍"
                  title="Globally Accessible"
                  description="Your verifiable identity travels with you anywhere in the world. Accessible 24/7 from any device."
                  delay="0.2s"
                />
                <FeatureCard
                  icon="💎"
                  title="Own Your Data"
                  description="Complete control over your professional identity. You decide what to share and when."
                  delay="0.3s"
                />
                <FeatureCard
                  icon="🚀"
                  title="Built to Scale"
                  description="From individual freelancers to enterprise organizations. WorkProof scales with your needs."
                  delay="0.4s"
                />
                <FeatureCard
                  icon="🔗"
                  title="Interoperable"
                  description="Works seamlessly with existing Web3 infrastructure. Compatible with ENS, wallets, and dApps."
                  delay="0.5s"
                />
              </div>
            </div>
          </section>

          <HowItWorksSection />

          <UseCasesSection />

          <StatsSection />

          <CTASection />
        </main>
      ) : (
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="space-y-16 fade-in">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-black mb-4">
                <span className="gradient-text">Your Dashboard</span>
              </h1>
              <p className="text-xl text-gray-400">
                Manage and view your verifiable attestations
              </p>
            </div>

            <section className="flex justify-center">
              <AttestationForm />
            </section>

            <section>
              <div className="mb-12 text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-4 gradient-text">
                  Your Attestations
                </h2>
                <p className="text-lg text-gray-400">
                  View all your verified on-chain proofs
                </p>
              </div>
              <AttestationList address={address as `0x${string}`} />
            </section>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
