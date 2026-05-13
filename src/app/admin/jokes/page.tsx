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

interface Joke {
  id: string;
  content: { en: string; np?: string };
  active: boolean;
  createdAt: string;
}

export default function AdminJokes() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [en, setEn] = useState("");
  const [np, setNp] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        await loadJokes(t);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadJokes = async (t: string) => {
    try {
      const res = await fetch("/api/admin/memory?type=memory", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setJokes((data.items || []).filter((i: Joke & { category: string }) => i.category === "joke"));
    } catch (e) { console.error("Failed to load jokes:", e); }
  };

  const addJoke = async () => {
    if (!en.trim()) return;
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create", collection: "memory",
          data: { content: { en, np }, category: "joke", active: true, keywords: ["joke", "humor"] },
        }),
      });
      setEn(""); setNp("");
      await loadJokes(token);
    } catch (e) { console.error("Failed to add joke:", e); }
  };

  const deleteJoke = async (id: string) => {
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", collection: "memory", id }),
      });
      await loadJokes(token);
    } catch (e) { console.error("Failed to delete joke:", e); }
  };

  return (
    <div>
      <AdminPageHeader title="Joke Manager" subtitle="Manage positive jokes for MAWbot" />

      <AdminCard delay={0.1} className="mb-6">
        <h2 className="text-sm font-medium mb-3">Add New Joke</h2>
        <div className="space-y-3">
          <AdminInput value={en} onChange={(e) => setEn(e.target.value)} placeholder="Joke in English" />
          <AdminInput value={np} onChange={(e) => setNp(e.target.value)} placeholder="Joke in Nepali (optional)" className="lang-np" />
          <AdminButton onClick={addJoke} disabled={!en.trim()} icon={<Plus size={15} />}>
            Add Joke
          </AdminButton>
        </div>
      </AdminCard>

      {loading ? (
        <p className="text-sm text-white/50">Loading...</p>
      ) : jokes.length === 0 ? (
        <AdminCard delay={0.2} hover={false}>
          <p className="text-sm text-white/50 text-center">No jokes yet. Add one above!</p>
        </AdminCard>
      ) : (
        <div className="space-y-2">
          {jokes.map((joke, i) => (
            <AdminCard key={joke.id} delay={0.1 + i * 0.04}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{joke.content?.en}</p>
                  {joke.content?.np && <p className="text-sm text-white/50 mt-1 lang-np">{joke.content.np}</p>}
                </div>
                <AdminButton variant="danger" onClick={() => deleteJoke(joke.id)}>
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
