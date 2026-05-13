"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Plus, Trash2, RefreshCw } from "lucide-react";

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
        loadJokes(t);
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
      const filtered = (data.items || []).filter((i: Joke & { category: string }) => i.category === "joke");
      setJokes(filtered);
    } catch (e) { console.error("Failed to load jokes:", e); }
  };

  const addJoke = async () => {
    if (!en.trim()) return;
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          collection: "memory",
          data: { content: { en, np }, category: "joke", active: true, keywords: ["joke", "humor"] },
        }),
      });
      setEn("");
      setNp("");
      loadJokes(token);
    } catch (e) { console.error("Failed to add joke:", e); }
  };

  const deleteJoke = async (id: string) => {
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", collection: "memory", id }),
      });
      loadJokes(token);
    } catch (e) { console.error("Failed to delete joke:", e); }
  };

  return (
    <div>
      <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Joke Manager 😂</h1>
      <p className="text-sm text-white/50 mb-6">Manage positive jokes for MAWbot</p>

      <div className="glass rounded-xl p-4 border border-white/10 mb-6 space-y-3">
        <h2 className="text-sm font-medium">Add New Joke</h2>
        <input
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="Joke in English"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <input
          value={np}
          onChange={(e) => setNp(e.target.value)}
          placeholder="Joke in Nepali (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none lang-np"
        />
        <button onClick={addJoke} disabled={!en.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm disabled:opacity-30">
          <Plus size={16} /> Add Joke
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading...</p>
      ) : jokes.length === 0 ? (
        <p className="text-sm text-white/50">No jokes yet. Add one above!</p>
      ) : (
        <div className="space-y-2">
          {jokes.map((joke) => (
            <div key={joke.id} className="glass rounded-lg p-3 border border-white/10 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm">{joke.content?.en}</p>
                {joke.content?.np && <p className="text-sm text-white/50 mt-1 lang-np">{joke.content.np}</p>}
              </div>
              <button onClick={() => deleteJoke(joke.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
