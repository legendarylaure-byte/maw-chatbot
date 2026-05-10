"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Brain, MessageSquare, Gamepad2, Users, Activity } from "lucide-react";

const auth = getAuth(app);

interface Stats {
  memoryEntries: number;
  conversations: number;
  gamesPlayed: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<unknown>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdToken();
        try {
          const res = await fetch("/api/admin/analytics", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  const statsCards = [
    { label: "Memory Entries", value: stats?.memoryEntries ?? "--", icon: Brain, color: "from-maw-blue to-maw-indigo" },
    { label: "Conversations", value: stats?.conversations ?? "--", icon: MessageSquare, color: "from-maw-indigo to-maw-purple" },
    { label: "Games Played", value: stats?.gamesPlayed ?? "--", icon: Gamepad2, color: "from-maw-purple to-maw-magenta" },
    { label: "Active Users", value: "--", icon: Users, color: "from-maw-magenta to-maw-blue" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-semibold text-xl text-gradient">Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Welcome back{user && "email" in (user as object) ? `, ${(user as { email?: string }).email || ""}` : ""}!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card) => {
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

      <div className="glass rounded-xl p-6 border border-white/10">
        <h2 className="font-heading font-semibold text-sm mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <a
            href="/admin/memory"
            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
          >
            ✏️ Add new knowledge
          </a>
          <a
            href="/admin/jokes"
            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
          >
            😂 Manage jokes
          </a>
          <a
            href="/admin/settings"
            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
          >
            ⚙️ Bot settings
          </a>
        </div>
      </div>
    </div>
  );
}
