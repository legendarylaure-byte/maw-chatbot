"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Globe, RefreshCw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";

const auth = getAuth(app);

interface Language {
  code: string;
  name: string;
  nativeLabel: string;
  enabled: boolean;
}

export default function AdminLanguages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [token, setToken] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        try {
          const res = await fetch("/api/admin/languages", {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (res.ok) setLanguages(await res.json());
        } catch (e) { console.error("Failed to fetch languages:", e); }
      }
    });
    return () => unsub();
  }, []);

  const toggleLanguage = (code: string) => {
    setLanguages(languages.map((l) =>
      l.code === code ? { ...l, enabled: !l.enabled } : l
    ));
  };

  const save = async () => {
    if (!token) return;
    try {
      await fetch("/api/admin/languages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ languages }),
      });
    } catch (e) { console.error("Failed to save languages:", e); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Languages"
        subtitle="Enable/disable languages for MAWbot"
        actions={
          <AdminButton onClick={save} icon={<RefreshCw size={14} />}>
            Save Changes
          </AdminButton>
        }
      />

      <div className="space-y-2 max-w-md">
        {languages.map((lang, i) => (
          <AdminCard key={lang.code} delay={i * 0.06}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium">{lang.name}</p>
                  <p className="text-xs text-white/50">{lang.nativeLabel} ({lang.code})</p>
                </div>
              </div>
              <button
                onClick={() => toggleLanguage(lang.code)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                  lang.enabled ? "bg-gradient-to-r from-maw-magenta to-maw-purple" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                    lang.enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
