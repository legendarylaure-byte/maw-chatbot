"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Brain, MessageSquare, Gamepad2, Users, ArrowRight, Sparkles } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";

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
        } catch (e) { console.error("Failed to load admin stats:", e); }
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
      <AdminPageHeader
        title="Dashboard"
        subtitle={`Welcome back${user && "email" in (user as object) ? `, ${(user as { email?: string }).email || ""}` : ""}!`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <AdminCard key={card.label} delay={i * 0.08}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-white/50">{card.label}</p>
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>

      <AdminCard delay={0.3}>
        <h2 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-maw-magenta" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <a
            href="/admin/memory"
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm group"
          >
            <span>✏️ Add new knowledge</span>
            <ArrowRight size={14} className="text-white/20 group-hover:text-maw-magenta transition-colors" />
          </a>
          <a
            href="/admin/jokes"
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm group"
          >
            <span>😂 Manage jokes</span>
            <ArrowRight size={14} className="text-white/20 group-hover:text-maw-magenta transition-colors" />
          </a>
          <a
            href="/admin/settings"
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm group"
          >
            <span>⚙️ Bot settings</span>
            <ArrowRight size={14} className="text-white/20 group-hover:text-maw-magenta transition-colors" />
          </a>
        </div>
      </AdminCard>
    </div>
  );
}
