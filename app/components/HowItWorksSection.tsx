"use client";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description:
        "Link your Ethereum wallet in seconds using industry-standard web3 authentication.",
      icon: "🔗",
    },
    {
      number: "02",
      title: "Create Attestation",
      description:
        "Document your achievement with recipient details and metadata pointing to proof.",
      icon: "📝",
    },
    {
      number: "03",
      title: "On-Chain Verification",
      description:
        "Your attestation is permanently recorded on Base blockchain for eternal verification.",
      icon: "✨",
    },
    {
      number: "04",
      title: "Build Reputation",
      description:
        "Showcase your growing collection of verified achievements to the world.",
      icon: "🏆",
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            <span className="gradient-text">How It Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Four simple steps to building your verifiable on-chain identity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent -translate-x-1/2 z-0" />
              )}

              <div className="relative z-10 glass-panel p-8 hover:scale-105 transition-all duration-500 group">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>

                <div className="text-blue-400 font-mono text-sm mb-2">
                  {step.number}
                </div>

                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>

                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>

                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
