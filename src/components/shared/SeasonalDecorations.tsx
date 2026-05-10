"use client";

import { useSeasonal } from "@/hooks/useSeasonal";
import { motion } from "framer-motion";

export function SeasonalDecorations() {
  const seasonal = useSeasonal();

  if (!seasonal) return null;

  const decorations: Record<string, { emoji: string; count: number }> = {
    Dashain: { emoji: "🪁", count: 5 },
    Tihar: { emoji: "🪔", count: 6 },
    Holi: { emoji: "🌈", count: 4 },
    "New Year": { emoji: "🎉", count: 4 },
    "Buddha Jayanti": { emoji: "🪷", count: 3 },
  };

  const deco = decorations[seasonal.name] || { emoji: "✨", count: 3 };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: deco.count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-20"
          initial={{
            x: Math.random() * 100,
            y: Math.random() * 100,
            scale: 0.5,
          }}
          animate={{
            x: Math.random() * 100,
            y: Math.random() * 100,
            rotate: 360,
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        >
          {deco.emoji}
        </motion.div>
      ))}
    </div>
  );
}
