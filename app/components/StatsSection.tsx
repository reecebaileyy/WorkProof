"use client";

import { StatsCounter } from "./StatsCounter";

export function StatsSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="glass-panel p-16">
          <div className="grid md:grid-cols-3 gap-16">
            <StatsCounter end={10000} label="Attestations Created" suffix="+" />
            <StatsCounter end={5000} label="Active Users" suffix="+" />
            <StatsCounter end={99} label="Uptime" suffix="%" />
          </div>
        </div>
      </div>
    </section>
  );
}
