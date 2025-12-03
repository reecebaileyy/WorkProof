"use client";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <div className="inline-block px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-blue-400 mb-8 backdrop-blur-sm">
          ⚡ Powered by Base Sepolia
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8">
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
            Verifiable
          </span>
          <span
            className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-400 animate-gradient"
            style={{ animationDelay: "0.5s" }}
          >
            Micro-Experience
          </span>
          <span className="block mt-2">Identity</span>
        </h1>

        <p className="text-xl md:text-3xl text-gray-400 max-w-4xl mx-auto mb-12 leading-relaxed">
          Build trust through blockchain-verified achievements.
          <br />
          <span className="text-gray-500">
            Every task. Every milestone. Permanently proven.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button className="px-10 py-5 border-2 border-white/10 rounded-2xl font-bold text-lg hover:bg-white/5 hover:border-white/20 transition-all">
            Learn More
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mx-auto animate-scroll" />
          </div>
        </div>
      </div>
    </section>
  );
}
