"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminBadge from "@/components/admin/AdminBadge";

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
        try {
          const res = await fetch("/api/admin/conversations", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setConversations((await res.json()).conversations || []);
        } catch (e) { console.error("Failed to fetch conversations:", e); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = conversations.filter((c) =>
    c.messages?.some((m) => m.content?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <AdminPageHeader title="Conversations" subtitle="Browse recent user conversations with MAWbot" />

      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search conversations..." />

      {loading ? (
        <p className="text-sm text-white/50">Loading conversations...</p>
      ) : filtered.length === 0 ? (
        <AdminCard delay={0.1} hover={false}>
          <p className="text-sm text-white/50 text-center">
            {conversations.length === 0
              ? "No conversations yet. Conversations will appear here as users chat with MAWbot."
              : "No conversations match your search."}
          </p>
        </AdminCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv, i) => (
            <AdminCard key={conv.id} delay={0.05 + i * 0.03} hover={false} className="!p-0 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-white/40" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </span>
                      <AdminBadge variant="brand">{conv.language?.toUpperCase() || "EN"}</AdminBadge>
                    </div>
                    <p className="text-sm text-white/80 truncate max-w-[300px] mt-0.5">
                      {conv.messages?.[0]?.content?.slice(0, 80)}...
                    </p>
                  </div>
                </div>
                {expanded === conv.id ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
              </button>
              {expanded === conv.id && (
                <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-3">
                  {conv.messages?.map((msg, j) => (
                    <div
                      key={j}
                      className={`p-3 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-maw-blue/20 to-maw-purple/10 ml-4"
                          : "bg-white/5 mr-4"
                      }`}
                    >
                      <span className="text-[10px] text-white/40 block mb-1 font-medium">
                        {msg.role === "user" ? "👤 User" : "🤖 MAWbot"}
                      </span>
                      <p className="text-white/80">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
