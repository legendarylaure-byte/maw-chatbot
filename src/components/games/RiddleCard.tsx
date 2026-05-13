"use client";

import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";

interface Riddle {
  riddle: string;
  answer: string;
}

export function RiddleCard() {
  const [riddle, setRiddle] = useState<Riddle | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRiddle(); }, []);

  const loadRiddle = async () => {
    setLoading(true);
    setShowAnswer(false);
    try {
      const res = await fetch("/api/games?type=riddle");
      const data = await res.json();
      setRiddle(data);
    } catch (e) { console.error("Failed to load riddle:", e); }
    setLoading(false);
  };

  if (loading) return <div className="text-center text-sm text-white/50 py-4">Loading...</div>;
  if (!riddle) return null;

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={16} className="text-yellow-400" />
        <span className="text-xs text-white/50">Riddle Me This!</span>
      </div>

      <p className="text-sm italic mb-3">&ldquo;{riddle.riddle}&rdquo;</p>

      {showAnswer ? (
        <div className="text-center">
          <p className="text-sm">
            Answer: <strong className="text-[#cf107a]">{riddle.answer}</strong>
          </p>
          <button
            onClick={loadRiddle}
            className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg gradient-glow text-xs"
          >
            <RefreshCw size={12} /> Next Riddle
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnswer(true)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
          >
            Show Answer
          </button>
          <button
            onClick={loadRiddle}
            className="px-4 py-2 rounded-lg gradient-glow text-sm"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
