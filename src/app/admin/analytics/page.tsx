"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Brain, MessageSquare, Gamepad2, ThumbsUp } from "lucide-react";

const auth = getAuth(app);

interface AnalyticsData {
  memoryEntries: number;
  conversations: number;
  feedbackCount: number;
  gamesPlayed: number;
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        fetchAnalytics(token);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchAnalytics = async (token: string) => {
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) { console.error("Failed to fetch analytics:", e); }
  };

  const cards = [
    { label: "Memory Entries", value: data?.memoryEntries ?? "--", icon: Brain, color: "from-maw-blue to-maw-indigo" },
    { label: "Conversations", value: data?.conversations ?? "--", icon: MessageSquare, color: "from-maw-indigo to-maw-purple" },
    { label: "Games Played", value: data?.gamesPlayed ?? "--", icon: Gamepad2, color: "from-maw-purple to-maw-magenta" },
    { label: "Feedback Given", value: data?.feedbackCount ?? "--", icon: ThumbsUp, color: "from-maw-magenta to-maw-blue" },
  ];

  return (
    <div>
      <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Analytics</h1>
      <p className="text-sm text-white/50 mb-6">Usage metrics, popular topics, and user insights</p>

      {loading ? (
        <p className="text-sm text-white/50">Loading analytics...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="glass rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-white/50">{card.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
