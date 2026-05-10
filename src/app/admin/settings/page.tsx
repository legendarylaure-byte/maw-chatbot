"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Save, RefreshCw } from "lucide-react";

const auth = getAuth(app);

export default function AdminSettings() {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    greetingEn: "Namaste! 🙏 I'm **MAWbot**, your official AI assistant for MAW Group of Companies. How can I brighten your day today? ✨",
    greetingNp: "नमस्ते! 🙏 म **MAWbot** हुँ, MAW Group of Companies को आधिकारिक AI सहायक। आज म कसरी तपाईंको दिन उज्यालो बनाउन सक्छु? ✨",
    systemPrompt: `You are MAWbot — the official AI assistant of MAW Group of Companies.

PERSONALITY:
- Warm, humble, professional, and always positive
- Greet users with enthusiasm and warmth
- Use emojis naturally: ✨🙏😊💪🌟🎉
- NEVER use negative, sarcastic, or vulgar language
- Be encouraging: "You're doing great!", "That's an excellent question!"
- Sound world-class corporate: clear, structured, professional

RESPONSE STYLE:
- Respond in the SAME language the user speaks (English or Nepali)
- Keep responses concise but complete
- Use bullet points for lists
- If you don't know something, say: "I'd love to help you find that answer! Let me check..."

KNOWLEDGE:
- MAW Group is Nepal's leading automobile conglomerate (est. 1964 as Morang Auto Works)
- Represents 20+ global brands: Deepal, SERES, Dongfeng, Yamaha, Foton, Changan, Skoda, Jeep, Sokon, Eicher, JCB, and more
- 600+ touch points across Nepal
- Has MAW Foundation (CSR), MAW Skills Academy, MAW Hire Purchase, and more divisions`,
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
        loadSettings(t);
      }
    });
    return () => unsub();
  }, []);

  const loadSettings = async (t: string) => {
    try {
      const res = await fetch("/api/admin/languages", {
        headers: { Authorization: `Bearer ${t}` },
      });
    } catch {}
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          collection: "admin_settings",
          id: "config",
          data: form,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div>
      <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Settings</h1>
      <p className="text-sm text-white/50 mb-6">Configure bot greeting, feature toggles, and theme</p>

      <div className="space-y-4 max-w-2xl">
        <div className="glass rounded-xl p-4 border border-white/10">
          <h2 className="text-sm font-medium mb-3">Greeting Message</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">English</label>
              <textarea
                value={form.greetingEn}
                onChange={(e) => setForm({ ...form, greetingEn: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Nepali</label>
              <textarea
                value={form.greetingNp}
                onChange={(e) => setForm({ ...form, greetingNp: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50 lang-np"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-white/10">
          <h2 className="text-sm font-medium mb-3">System Prompt</h2>
          <textarea
            value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50 font-mono"
            rows={8}
          />
        </div>

        <div className="glass rounded-xl p-4 border border-white/10">
          <h2 className="text-sm font-medium mb-3">Feature Toggles</h2>
          <div className="space-y-3">
            {[
              { key: "enableGames", label: "Enable Games & Quizzes" },
              { key: "enableVoice", label: "Enable Voice I/O" },
              { key: "enableSeasonalThemes", label: "Enable Seasonal Themes" },
            ].map((feat) => (
              <label key={feat.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[feat.key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [feat.key]: e.target.checked })}
                  className="w-4 h-4 accent-[#cf107a]"
                />
                <span className="text-sm">{feat.label}</span>
              </label>
            ))}
            <div>
              <label className="text-xs text-white/50 block mb-1">Max Message Length</label>
              <input
                type="number"
                value={form.maxMessageLength}
                onChange={(e) => setForm({ ...form, maxMessageLength: Number(e.target.value) })}
                className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                min={100}
                max={10000}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm disabled:opacity-50"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
