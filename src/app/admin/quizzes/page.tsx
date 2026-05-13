"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Plus, Trash2 } from "lucide-react";

const auth = getAuth(app);

interface Question {
  id: string;
  content: { en: string };
  category: string;
  active: boolean;
  keywords?: string[];
}

export default function AdminQuizzes() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [en, setEn] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        loadQuestions(t);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadQuestions = async (t: string) => {
    try {
      const res = await fetch("/api/admin/memory?type=memory", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      const filtered = (data.items || []).filter((i: Question) => i.category === "quiz");
      setQuestions(filtered);
    } catch (e) { console.error("Failed to load questions:", e); }
  };

  const addQuestion = async () => {
    if (!en.trim()) return;
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          collection: "memory",
          data: { content: { en }, category: "quiz", active: true, keywords: ["quiz", "trivia"] },
        }),
      });
      setEn("");
      loadQuestions(token);
    } catch (e) { console.error("Failed to add question:", e); }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", collection: "memory", id }),
      });
      loadQuestions(token);
    } catch (e) { console.error("Failed to delete question:", e); }
  };

  return (
    <div>
      <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Quiz Builder 🎮</h1>
      <p className="text-sm text-white/50 mb-6">Create trivia questions for MAWbot games</p>

      <div className="glass rounded-xl p-4 border border-white/10 mb-6 space-y-3">
        <h2 className="text-sm font-medium">Add Question</h2>
        <input
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="Quiz question content"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button onClick={addQuestion} disabled={!en.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm disabled:opacity-30">
          <Plus size={16} /> Add Question
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading...</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-white/50">No quiz questions yet.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="glass rounded-lg p-3 border border-white/10 flex items-start justify-between gap-3">
              <p className="text-sm flex-1">{q.content?.en}</p>
              <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
