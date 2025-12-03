"use client";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  delay = "0s",
}: FeatureCardProps) {
  return (
    <div
      className="group relative glass-panel p-8 hover:scale-105 transition-all duration-500 cursor-pointer fade-in"
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-500" />

      <div className="relative z-10">
        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {title}
        </h3>

        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>

      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
