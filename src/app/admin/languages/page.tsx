"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Globe, Check, X, Save, RefreshCw } from "lucide-react";

const auth = getAuth(app);

const DEFAULT_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", enabled: true },
  { code: "np", label: "Nepali", nativeLabel: "नेपाली", enabled: true },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", enabled: false },
  { code: "ma", label: "Maithili", nativeLabel: "मैथिली", enabled: false },
];

export default function AdminLanguages() {
  const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        loadLanguages(t);
      }
    });
    return () => unsub();
  }, []);

  const loadLanguages = async (t: string) => {
    try {
      const res = await fetch("/api/admin/languages", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.languages) {
          setLanguages(data.languages);
        }
      }
    } catch (e) { console.error("Failed to fetch languages:", e); }
  };

  const toggleLanguage = (code: string) => {
    setLanguages(languages.map((l) => l.code === code ? { ...l, enabled: !l.enabled } : l));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await fetch("/api/admin/languages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ languages }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error("Failed to save languages:", e); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Language Manager 🌐</h1>
          <p className="text-sm text-white/50">Enable/disable languages for MAWbot</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !token}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm disabled:opacity-50"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="glass rounded-xl border border-white/10 overflow-hidden max-w-md">
        {languages.map((lang) => (
          <div key={lang.code} className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-b-0">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-white/40" />
              <div>
                <p className="text-sm font-medium">{lang.label}</p>
                <p className="text-xs text-white/50">{lang.nativeLabel} ({lang.code})</p>
              </div>
            </div>
            <button
              onClick={() => toggleLanguage(lang.code)}
              className={`p-1.5 rounded-lg transition ${
                lang.enabled ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"
              }`}
            >
              {lang.enabled ? <Check size={16} /> : <X size={16} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
