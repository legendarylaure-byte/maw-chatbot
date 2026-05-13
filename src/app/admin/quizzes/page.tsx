"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Plus, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminInput from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";

const auth = getAuth(app);

interface Question {
  id: string;
  content: { en: string; np?: string };
  active: boolean;
}

export default function AdminQuizzes() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [en, setEn] = useState("");
  const [np, setNp] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        await loadQuestions(t);
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
      setQuestions((data.items || []).filter((i: Question & { category: string }) => i.category === "quiz"));
    } catch (e) { console.error("Failed to load questions:", e); }
  };

  const addQuestion = async () => {
    if (!en.trim()) return;
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create", collection: "memory",
          data: { content: { en, np }, category: "quiz", active: true, keywords: ["quiz", "trivia"] },
        }),
      });
      setEn(""); setNp("");
      await loadQuestions(token);
    } catch (e) { console.error("Failed to add question:", e); }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", collection: "memory", id }),
      });
      await loadQuestions(token);
    } catch (e) { console.error("Failed to delete question:", e); }
  };

  return (
    <div>
      <AdminPageHeader title="Quiz Manager" subtitle="Create trivia questions for MAWbot games" />

      <AdminCard delay={0.1} className="mb-6">
        <h2 className="text-sm font-medium mb-3">Add New Question</h2>
        <div className="space-y-3">
          <AdminInput value={en} onChange={(e) => setEn(e.target.value)} placeholder="Question in English" />
          <AdminInput value={np} onChange={(e) => setNp(e.target.value)} placeholder="Question in Nepali (optional)" className="lang-np" />
          <AdminButton onClick={addQuestion} disabled={!en.trim()} icon={<Plus size={15} />}>
            Add Question
          </AdminButton>
        </div>
      </AdminCard>

      {loading ? (
        <p className="text-sm text-white/50">Loading...</p>
      ) : questions.length === 0 ? (
        <AdminCard delay={0.2} hover={false}>
          <p className="text-sm text-white/50 text-center">No quiz questions yet.</p>
        </AdminCard>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <AdminCard key={q.id} delay={0.1 + i * 0.04}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{q.content?.en}</p>
                  {q.content?.np && <p className="text-sm text-white/50 mt-1 lang-np">{q.content.np}</p>}
                </div>
                <AdminButton variant="danger" onClick={() => deleteQuestion(q.id)}>
                  <Trash2 size={14} />
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
