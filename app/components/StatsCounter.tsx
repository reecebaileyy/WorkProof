"use client";

import { useEffect, useState, useRef } from "react";

interface StatsCounterProps {
  end: number;
  duration?: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export function StatsCounter({
  end,
  duration = 2000,
  label,
  suffix = "",
  prefix = "",
}: StatsCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = Date.now();
          const endTime = startTime + duration;

          const updateCount = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(easeOutQuart * end));

            if (now < endTime) {
              requestAnimationFrame(updateCount);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(updateCount);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <div ref={ref} className="text-center fade-in">
      <div className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-gray-400 text-lg">{label}</div>
    </div>
  );
}
