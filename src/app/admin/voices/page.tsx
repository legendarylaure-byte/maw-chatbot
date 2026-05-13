"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Volume2, Play, RefreshCw, Save, Check } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminButton from "@/components/admin/AdminButton";

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
        const maleVoices = data.voices.filter((v: ElevenVoice) =>
          v.labels?.gender === "male" || v.name.toLowerCase().includes("male")
        );
        const npVoices = data.voices.filter((v: ElevenVoice) =>
          v.labels?.accent === "indian" || v.name.toLowerCase().includes("hindi") || v.name.toLowerCase().includes("indian")
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
    } catch (e) { console.error("Failed to fetch voices:", e); }
    setLoading(false);
  };

  const testVoice = async (voiceId: string) => {
    setTesting(voiceId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello! This is MAWbot testing the voice. How does this sound?",
          voiceId,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) { console.error("Failed to test voice:", e); }
    setTesting(null);
  };

  const saveAssignments = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        await fetch("/api/admin/memory", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update", collection: "admin_settings", id: "voices",
            data: { assignments },
          }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) { console.error("Failed to save voice assignments:", e); }
    setSaving(false);
  };

  const voiceSlots = [
    { id: "en-male", label: "English Male", lang: "en" },
    { id: "en-female", label: "English Female", lang: "en" },
    { id: "np-male", label: "Nepali Male", lang: "np" },
    { id: "np-female", label: "Nepali Female", lang: "np" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Voice Manager"
        subtitle="Manage ElevenLabs voices for male/female across languages"
        actions={
          <div className="flex items-center gap-2">
            <AdminButton variant="secondary" onClick={fetchVoices} icon={<RefreshCw size={14} />}>
              Refresh Voices
            </AdminButton>
            <AdminButton onClick={saveAssignments} loading={saving}
              icon={saved ? <Check size={14} /> : <Save size={14} />}>
              {saved ? "Saved" : "Save Assignments"}
            </AdminButton>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-white/50">Loading voices from ElevenLabs...</p>
      ) : allVoices.length === 0 ? (
        <AdminCard delay={0.1} hover={false}>
          <p className="text-sm text-white/50 text-center">
            No ElevenLabs voices available. Check your API key configuration.
          </p>
        </AdminCard>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {voiceSlots.map((slot) => (
            <AdminCard key={slot.id} delay={0.08}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-white">{slot.label}</h3>
                  <span className="text-[10px] text-white/50">{slot.lang === "en" ? "English" : "Nepali"}</span>
                </div>
                {assignments[slot.id] && (
                  <AdminButton variant="secondary" onClick={() => testVoice(assignments[slot.id])}
                    disabled={testing === assignments[slot.id]}
                    loading={testing === assignments[slot.id]}
                    icon={<Play size={12} />}>
                    Test
                  </AdminButton>
                )}
              </div>
              <AdminSelect
                value={assignments[slot.id] || ""}
                onChange={(e) => setAssignments({ ...assignments, [slot.id]: e.target.value })}
              >
                <option value="">Select a voice...</option>
                {allVoices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name}{v.labels?.description ? ` — ${v.labels.description}` : ""}
                  </option>
                ))}
              </AdminSelect>
            </AdminCard>
          ))}

          <AdminCard delay={0.2}>
            <h3 className="text-sm font-medium text-white mb-3">All Available Voices</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {allVoices.map((v) => (
                <div key={v.voice_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 size={14} className="shrink-0 text-white/40" />
                    <span className="truncate text-white/80">{v.name}</span>
                    {v.labels?.description && (
                      <span className="text-[10px] text-white/30 truncate hidden sm:inline">
                        {v.labels.description}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => testVoice(v.voice_id)}
                    disabled={testing === v.voice_id}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white disabled:opacity-40"
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
          </AdminCard>
        </div>
      )}
    </div>
  );
}
