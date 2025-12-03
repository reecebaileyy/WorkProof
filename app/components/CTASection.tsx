"use client";

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-5xl md:text-7xl font-black mb-8">
          <span className="gradient-text">Ready to Build Your</span>
          <br />
          <span className="text-white">Verifiable Identity?</span>
        </h2>

        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Join thousands of professionals using WorkProof to create permanent,
          verifiable records of their achievements.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
            <span className="relative z-10">Start Now - It's Free</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button className="px-12 py-6 border-2 border-white/20 rounded-2xl font-bold text-xl hover:bg-white/5 hover:border-white/30 transition-all">
            View Documentation
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Always Free</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Open Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span>Fully Decentralized</span>
          </div>
        </div>
      </div>
    </section>
  );
}
