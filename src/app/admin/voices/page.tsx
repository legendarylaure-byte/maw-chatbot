"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Volume2, Play, RefreshCw, Save, Check } from "lucide-react";

const auth = getAuth(app);

interface ElevenVoice {
  voice_id: string;
  name: string;
  labels?: { accent?: string; description?: string; gender?: string };
  preview_url?: string;
}

export default function AdminVoices() {
  const [allVoices, setAllVoices] = useState<ElevenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchVoices();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tts/voices");
      const data = await res.json();
      setAllVoices(data.voices || []);
      if (data.voices?.length) {
        const enVoices = data.voices.filter((v: ElevenVoice) =>
          v.labels?.accent === "american" || v.name.toLowerCase().includes("english")
        );
        const npVoices = data.voices.filter((v: ElevenVoice) =>
          v.labels?.accent === "indian" || v.name.toLowerCase().includes("hindi") || v.name.toLowerCase().includes("indian")
        );
        const maleVoices = data.voices.filter((v: ElevenVoice) =>
          v.labels?.gender === "male" || v.name.toLowerCase().includes("male")
        );
        if (!assignments["en-male"]) {
          setAssignments({
            "en-male": maleVoices[0]?.voice_id || data.voices[0]?.voice_id || "",
            "en-female": data.voices.find((v: ElevenVoice) => v.labels?.gender !== "male")?.voice_id || data.voices[1]?.voice_id || "",
            "np-male": npVoices[0]?.voice_id || data.voices[0]?.voice_id || "",
            "np-female": npVoices[1]?.voice_id || data.voices[1]?.voice_id || "",
          });
        }
      }
    } catch {}
    setLoading(false);
  };

  const testVoice = async (voiceId: string) => {
    setTesting(voiceId);
    try {
      await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello! This is MAWbot testing the voice. How does this sound?",
          voiceId,
        }),
      });
    } catch {}
    setTimeout(() => setTesting(null), 1000);
  };

  const voiceSlots = [
    { id: "en-male", label: "English Male", lang: "en" },
    { id: "en-female", label: "English Female", lang: "en" },
    { id: "np-male", label: "Nepali Male", lang: "np" },
    { id: "np-female", label: "Nepali Female", lang: "np" },
  ];

  return (
    <div>
      <h1 className="font-heading font-semibold text-xl text-gradient mb-2">Voice Manager</h1>
      <p className="text-sm text-white/50 mb-6">Manage ElevenLabs voices for male/female across languages</p>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={fetchVoices}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10 transition"
        >
          <RefreshCw size={14} /> Refresh Voices
        </button>
        <button
          onClick={async () => {
            setSaving(true);
            try {
              const user = auth.currentUser;
              if (user) {
                const token = await user.getIdToken();
                await fetch("/api/admin/memory", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "update",
                    collection: "admin_settings",
                    id: "voices",
                    data: { assignments },
                  }),
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }
            } catch {}
            setSaving(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-glow text-xs"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : "Save Assignments"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading voices from ElevenLabs...</p>
      ) : allVoices.length === 0 ? (
        <div className="glass rounded-xl p-6 border border-white/10 text-center text-white/50 text-sm">
          No ElevenLabs voices available. Check your API key configuration.
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {voiceSlots.map((slot) => (
            <div key={slot.id} className="glass rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium">{slot.label}</h3>
                  <span className="text-[10px] text-white/50">{slot.lang === "en" ? "English" : "Nepali"}</span>
                </div>
                {assignments[slot.id] && (
                  <button
                    onClick={() => testVoice(assignments[slot.id])}
                    disabled={testing === assignments[slot.id]}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition"
                  >
                    {testing === assignments[slot.id] ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    Test
                  </button>
                )}
              </div>
              <select
                value={assignments[slot.id] || ""}
                onChange={(e) => setAssignments({ ...assignments, [slot.id]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
              >
                <option value="">Select a voice...</option>
                {allVoices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name} {v.labels?.description ? `— ${v.labels.description}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="glass rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-2">All Available Voices</h3>
            <div className="grid gap-1.5 max-h-48 overflow-y-auto">
              {allVoices.map((v) => (
                <div key={v.voice_id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 size={14} className="shrink-0 text-white/40" />
                    <span className="truncate">{v.name}</span>
                    {v.labels?.description && (
                      <span className="text-[10px] text-white/40 truncate hidden sm:inline">
                        {v.labels.description}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => testVoice(v.voice_id)}
                    disabled={testing === v.voice_id}
                    className="shrink-0 p-1 rounded hover:bg-white/10 transition"
                  >
                    {testing === v.voice_id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
