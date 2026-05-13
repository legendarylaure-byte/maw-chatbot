"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { MessageSquare, Search, ChevronDown, ChevronUp } from "lucide-react";

const auth = getAuth(app);

interface Conversation {
  id: string;
  userId: string;
  messages: { role: string; content: string }[];
  language: string;
  createdAt: string;
}

export default function AdminConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        fetchConversations(token);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchConversations = async (token: string) => {
    try {
      const res = await fetch("/api/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setConversations(json.conversations || []);
      }
    } catch (e) { console.error("Failed to fetch conversations:", e); }
  };

  const filtered = conversations.filter((c) =>
    c.messages?.some((m) => m.content?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Conversations</h1>
      <p className="text-sm text-white/50 mb-6">Browse recent user conversations with MAWbot</p>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
        />
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading conversations...</p>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-6 border border-white/10 text-center text-white/50 text-sm">
          {conversations.length === 0
            ? "No conversations yet. Conversations will appear here as users chat with MAWbot."
            : "No conversations match your search."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <div key={conv.id} className="glass rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-white/40" />
                  <div className="text-left">
                    <p className="text-xs text-white/50">
                      {new Date(conv.createdAt).toLocaleDateString()} — {conv.language?.toUpperCase() || "EN"}
                    </p>
                    <p className="text-sm truncate max-w-[300px]">
                      {conv.messages?.[0]?.content?.slice(0, 80)}...
                    </p>
                  </div>
                </div>
                {expanded === conv.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expanded === conv.id && (
                <div className="px-4 pb-3 space-y-2">
                  {conv.messages?.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-[#1457ee]/20 ml-4"
                          : "bg-white/5 mr-4"
                      }`}
                    >
                      <span className="text-[10px] text-white/40 block mb-0.5">
                        {msg.role === "user" ? "User" : "MAWbot"}
                      </span>
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
