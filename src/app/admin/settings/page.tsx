"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Save, RefreshCw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminInput from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";

const auth = getAuth(app);

export default function AdminSettings() {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    greetingEn: "Namaste! 🙏 I'm **MAWbot**, your official AI assistant for MAW Group of Companies. How can I brighten your day today? ✨",
    greetingNp: "नमस्ते! 🙏 म **MAWbot** हुँ, MAW Group of Companies को आधिकारिक AI सहायक। आज म कसरी तपाईंको दिन उज्यालो बनाउन सक्छु? ✨",
    systemPrompt: "",
    maxMessageLength: 2000,
    enableGames: true,
    enableVoice: true,
    enableSeasonalThemes: true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", collection: "admin_settings", id: "config", data: form }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error("Failed to save settings:", e); }
    setSaving(false);
  };

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Configure bot greeting, feature toggles, and theme"
        actions={
          <AdminButton onClick={handleSave} loading={saving}
            icon={saved ? <RefreshCw size={14} /> : <Save size={14} />}>
            {saved ? "Saved!" : "Save Settings"}
          </AdminButton>
        }
      />

      <div className="space-y-4 max-w-2xl">
        <AdminCard delay={0.05}>
          <h2 className="text-sm font-medium text-white mb-3">Greeting Message</h2>
          <div className="space-y-3">
            <AdminTextarea label="English" value={form.greetingEn}
              onChange={(e) => setForm({ ...form, greetingEn: e.target.value })} rows={2} />
            <AdminTextarea label="Nepali" value={form.greetingNp}
              onChange={(e) => setForm({ ...form, greetingNp: e.target.value })} className="lang-np" rows={2} />
          </div>
        </AdminCard>

        <AdminCard delay={0.1}>
          <h2 className="text-sm font-medium text-white mb-3">System Prompt</h2>
          <AdminTextarea value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            className="font-mono" rows={8} />
        </AdminCard>

        <AdminCard delay={0.15}>
          <h2 className="text-sm font-medium text-white mb-3">Feature Toggles</h2>
          <div className="space-y-3">
            {[
              { key: "enableGames", label: "Enable Games & Quizzes" },
              { key: "enableVoice", label: "Enable Voice I/O" },
              { key: "enableSeasonalThemes", label: "Enable Seasonal Themes" },
            ].map((feat) => (
              <label key={feat.key} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form[feat.key as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, [feat.key]: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-all duration-300 ${
                    form[feat.key as keyof typeof form]
                      ? "bg-gradient-to-r from-maw-magenta to-maw-purple"
                      : "bg-white/10"
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                      form[feat.key as keyof typeof form] ? "left-5" : "left-0.5"
                    }`} />
                  </div>
                </div>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">{feat.label}</span>
              </label>
            ))}
            <div className="pt-2">
              <AdminInput label="Max Message Length" type="number"
                value={form.maxMessageLength}
                onChange={(e) => setForm({ ...form, maxMessageLength: Number(e.target.value) })}
                className="w-32" min={100} max={10000} />
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
