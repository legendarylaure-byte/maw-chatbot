"use client";

import { useState } from "react";
import { useSeasonal } from "@/hooks/useSeasonal";
import { motion } from "framer-motion";

export function SeasonalDecorations() {
  const seasonal = useSeasonal();

  const decorations: Record<string, { emoji: string; count: number }> = {
    Dashain: { emoji: "🪁", count: 5 },
    Tihar: { emoji: "🪔", count: 6 },
    Holi: { emoji: "🌈", count: 4 },
    "New Year": { emoji: "🎉", count: 4 },
    "Buddha Jayanti": { emoji: "🪷", count: 3 },
  };

  const deco = decorations[seasonal?.name || ""] || { emoji: "✨", count: 3 };

  const [positions] = useState(() =>
    Array.from({ length: deco.count }, () => ({
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      animateX: Math.random() * 100,
      animateY: Math.random() * 100,
      duration: 10 + Math.random() * 10,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
    }))
  );

  if (!seasonal) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-20"
          initial={{
            x: pos.initialX,
            y: pos.initialY,
            scale: 0.5,
          }}
          animate={{
            x: pos.animateX,
            y: pos.animateY,
            rotate: 360,
          }}
          transition={{
            duration: pos.duration,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
        >
          {deco.emoji}
        </motion.div>
      ))}
    </div>
  );
}
