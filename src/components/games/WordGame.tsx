"use client";

import { useState, useEffect } from "react";

interface DailyChallenge {
  scrambled: string;
  hint: string;
  answer: string;
}

export function WordGame() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/games?type=daily-challenge");
      const data = await res.json();
      setChallenge(data);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || result) return;

    setAttempts(attempts + 1);
    if (guess.trim().toUpperCase() === challenge?.answer) {
      setResult("win");
    } else if (attempts >= 2) {
      setResult("lose");
    }
    setGuess("");
  };

  if (loading) return <div className="text-center text-sm text-white/50 py-4">Loading...</div>;
  if (!challenge) return null;

  return (
    <div className="py-2">
      <p className="text-xs text-white/50 mb-2">Unscramble the word!</p>

      <div className="text-center mb-3">
        <div className="text-2xl tracking-[0.5em] font-heading font-bold text-gradient">
          {challenge.scrambled}
        </div>
        <p className="text-xs text-white/40 mt-1">Hint: {challenge.hint}</p>
      </div>

      {result ? (
        <div className="text-center">
          <p className="text-sm font-medium mb-1">
            {result === "win" ? "🎉 Correct!" : "😅 Out of tries!"}
          </p>
          <p className="text-xs text-white/50 mb-2">Answer: <strong>{challenge.answer}</strong></p>
          <button
            onClick={() => { setResult(null); setAttempts(0); loadChallenge(); }}
            className="px-3 py-1.5 rounded-lg gradient-glow text-xs"
          >
            New Word
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase())}
            placeholder="Your answer..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none uppercase"
            maxLength={20}
            autoFocus
          />
          <button
            type="submit"
            disabled={!guess.trim()}
            className="px-4 py-2 rounded-lg gradient-glow text-sm disabled:opacity-30"
          >
            Guess
          </button>
        </form>
      )}
      <p className="text-xs text-white/30 mt-2">Attempts: {attempts}/3</p>
    </div>
  );
}
