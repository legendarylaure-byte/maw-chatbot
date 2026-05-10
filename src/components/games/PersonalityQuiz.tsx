"use client";

import { useState, useEffect } from "react";

interface QuizQuestion {
  id: number;
  text: string;
  options: { value: string; label: string; emoji: string }[];
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
  results: Record<string, string>;
}

export function PersonalityQuiz() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuiz(); }, []);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/games?type=personality-quiz");
      const data = await res.json();
      setQuiz(data);
    } catch {}
    setLoading(false);
  };

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (!quiz || step >= quiz.questions.length - 1) {
      const counts: Record<string, number> = {};
      newAnswers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(quiz?.results[top] || "");
    } else {
      setStep(step + 1);
    }
  };

  if (loading) return <div className="text-center text-sm text-white/50 py-4">Loading quiz...</div>;
  if (!quiz) return null;

  if (result) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-sm font-semibold mb-2">Your MAW Brand Match is:</p>
        <p className="text-sm text-[#cf107a] font-medium mb-3">{result}</p>
        <button
          onClick={() => { setStep(0); setAnswers([]); setResult(null); loadQuiz(); }}
          className="px-4 py-2 rounded-lg gradient-glow text-sm"
        >
          Take Again
        </button>
      </div>
    );
  }

  const q = quiz.questions[step];
  return (
    <div className="py-2">
      <p className="text-xs text-white/50 mb-1">Question {step + 1}/{quiz.questions.length}</p>
      <p className="text-sm font-medium mb-3">{q.text}</p>
      <div className="space-y-1.5">
        {q.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleAnswer(opt.value)}
            className="w-full text-left px-3 py-2.5 rounded-lg glass hover:bg-white/10 text-sm transition flex items-center gap-2"
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
