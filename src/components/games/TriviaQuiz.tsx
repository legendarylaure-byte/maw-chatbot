"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface Question {
  q: string;
  a: string;
  options: string[];
}

export function TriviaQuiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrivia();
  }, []);

  const loadTrivia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/games?type=trivia");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) { console.error("Failed to load trivia quiz:", e); }
    setLoading(false);
  };

  const handleAnswer = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === questions[current].a) {
      setScore(score + 1);
    }
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(current + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  if (loading) {
    return <div className="text-center text-sm text-white/50 py-4">Loading quiz...</div>;
  }

  if (showResult) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
        <div className="text-4xl mb-2">{score === questions.length ? "🏆" : score >= 3 ? "🌟" : "💪"}</div>
        <p className="text-lg font-semibold">
          You scored {score}/{questions.length}!
        </p>
        <p className="text-sm text-white/50 mb-3">
          {score === questions.length ? "Perfect! You're a MAW expert!" : "Great try! Keep learning!"}
        </p>
        <button
          onClick={() => { setCurrent(0); setScore(0); setSelected(null); setShowResult(false); loadTrivia(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm"
        >
          <RefreshCw size={14} /> Play Again
        </button>
      </motion.div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/50">
          Question {current + 1}/{questions.length}
        </span>
        <span className="text-xs text-white/50">Score: {score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <p className="text-sm font-medium mb-3">{q.q}</p>
          <div className="space-y-1.5">
            {q.options.map((option) => {
              const isCorrect = option === q.a;
              const isSelected = option === selected;
              let bg = "bg-white/5 hover:bg-white/10";
              if (isSelected) bg = isCorrect ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500";

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selected}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border border-white/10 ${bg} transition`}
                >
                  {option}
                  {isSelected && isCorrect && " ✅"}
                  {isSelected && !isCorrect && " ❌"}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
