"use client";

export function UseCasesSection() {
  const useCases = [
    {
      title: "Freelance Portfolio",
      description:
        "Prove completed projects with client attestations. Build an unforgeable portfolio of work.",
      gradient: "from-blue-500 to-cyan-500",
      emoji: "💼",
    },
    {
      title: "Educational Credentials",
      description:
        "Verify course completions, certifications, and skill achievements on-chain.",
      gradient: "from-purple-500 to-pink-500",
      emoji: "🎓",
    },
    {
      title: "Community Contributions",
      description:
        "Document open-source contributions, hackathon wins, and community impact.",
      gradient: "from-orange-500 to-red-500",
      emoji: "🌟",
    },
    {
      title: "Professional Milestones",
      description:
        "Create verifiable records of career achievements, projects, and recognitions.",
      gradient: "from-green-500 to-emerald-500",
      emoji: "🚀",
    },
  ];

  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            <span className="gradient-text">Real World Use Cases</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transform how you prove your achievements across every aspect of
            your professional life
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="relative group fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="glass-panel p-10 hover:scale-[1.02] transition-all duration-500 overflow-hidden">
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div className="text-6xl mb-6">{useCase.emoji}</div>

                  <h3 className="text-3xl font-bold mb-4">
                    <span
                      className={`bg-clip-text text-transparent bg-gradient-to-r ${useCase.gradient}`}
                    >
                      {useCase.title}
                    </span>
                  </h3>

                  <p className="text-gray-400 text-lg leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
