"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Play, Save, Check, Volume2, RefreshCw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";

const auth = getAuth(app);

interface Voice {
  voice_id: string;
  name: string;
  language: string;
  languageLabel: string;
  gender: "male" | "female";
  tier: string;
}

const SLOTS = [
  { id: "en-male", label: "English Male", lang: "en", langLabel: "Indian English (en-IN)" },
  { id: "en-female", label: "English Female", lang: "en", langLabel: "Indian English (en-IN)" },
  { id: "np-male", label: "Nepali Male", lang: "np", langLabel: "Hindi (hi-IN) — closest to Nepali" },
  { id: "np-female", label: "Nepali Female", lang: "np", langLabel: "Hindi (hi-IN) — closest to Nepali" },
];

export default function AdminVoices() {
  const [allVoices, setAllVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [refTab, setRefTab] = useState<"en-IN" | "hi-IN">("en-IN");

  const showMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tts/voices");
      const data = await res.json();
      setAllVoices(data.voices || []);
    } catch (e) { console.error("Failed to fetch voices:", e); }
    setLoading(false);
  };

  const loadSavedAssignments = async () => {
    try {
      const res = await fetch("/api/admin/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get", collection: "admin_settings", id: "voices",
        }),
      });
      const data = await res.json();
      if (data?.data?.assignments) {
        setAssignments(data.data.assignments);
      }
    } catch (e) { console.error("Failed to load saved voice assignments:", e); }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await Promise.all([fetchVoices(), loadSavedAssignments()]);
      }
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (!res.ok) {
        showMessage(`Voice test failed (${res.status}).`);
        setTesting(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setTesting(null); };
      await audio.play();
    } catch {
      showMessage("Failed to test voice.");
    }
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
        showMessage("Voice assignments saved!");
      }
    } catch (e) { console.error("Failed to save voice assignments:", e); }
    setSaving(false);
  };

  const getVoiceLabel = (voiceId: string) => {
    const v = allVoices.find((x) => x.voice_id === voiceId);
    if (!v) return "Unknown voice";
    const tierBadge = v.tier === "Neural2" ? "★ " : v.tier === "WaveNet" ? "● " : "";
    return `${tierBadge}${v.languageLabel} — ${v.name} (${v.gender === "male" ? "Male" : "Female"})`;
  };

  const getShortLabel = (voiceId: string) => {
    const v = allVoices.find((x) => x.voice_id === voiceId);
    if (!v) return "Not assigned";
    return `${v.tier} ${v.name} (${v.gender === "male" ? "M" : "F"})`;
  };

  const voicesForSlot = (slotId: string) => {
    if (slotId.startsWith("en-")) return allVoices.filter((v) => v.language === "en-IN");
    if (slotId.startsWith("np-")) return allVoices.filter((v) => v.language === "hi-IN");
    return allVoices;
  };

  const refVoices = allVoices.filter((v) => v.language === refTab);

  const tierOrder = { Neural2: 0, WaveNet: 1, Standard: 2 };
  const sortVoices = (a: Voice, b: Voice) =>
    (tierOrder[a.tier as keyof typeof tierOrder] ?? 9) - (tierOrder[b.tier as keyof typeof tierOrder] ?? 9);

  return (
    <div>
      <AdminPageHeader
        title="Voice Manager"
        subtitle="Assign Google Cloud TTS voices for male/female across English and Nepali"
        actions={
          <AdminButton onClick={saveAssignments} loading={saving}
            icon={saved ? <Check size={14} /> : <Save size={14} />}>
            {saved ? "Saved" : "Save Assignments"}
          </AdminButton>
        }
      />

      <AdminCard delay={0} hover={false}>
        <div className="text-xs text-white/70 space-y-2">
          <p className="text-sm font-medium text-white">How voices work</p>
          <ol className="list-decimal list-inside space-y-1 text-white/50">
            <li>Pick a voice for each slot below — <strong className="text-white/80">English Male</strong>, <strong className="text-white/80">English Female</strong>, <strong className="text-white/80">Nepali Male</strong>, <strong className="text-white/80">Nepali Female</strong></li>
            <li>English slots show <strong className="text-white/80">Indian English (en-IN)</strong> voices. Nepali slots show <strong className="text-white/80">Hindi (hi-IN)</strong> voices — the closest match to Nepali in Google Cloud TTS</li>
            <li>Only assigned voices appear in the chat as <span className="text-white/80">Male</span> and <span className="text-white/80">Female</span> options. Switching language there automatically switches voices</li>
            <li>Voice quality tiers: <span className="text-white/80">Neural2 ★</span> (best) → <span className="text-white/80">WaveNet ●</span> (great) → <span className="text-white/80">Standard</span> (free, basic)</li>
            <li>Click <strong className="text-white/80">Save</strong> to apply changes</li>
          </ol>
        </div>
      </AdminCard>

      {statusMessage && (
        <div className="px-3 py-2 rounded-lg bg-white/10 text-sm text-white/80 text-center my-3 max-w-2xl">
          {statusMessage}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/50">Loading voices...</p>
      ) : allVoices.length === 0 ? (
        <AdminCard delay={0.1} hover={false}>
          <p className="text-sm text-white/50 text-center">
            No voices available. Check your Google Cloud TTS API key.
          </p>
        </AdminCard>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {SLOTS.map((slot) => {
            const assigned = assignments[slot.id];
            const assignedVoice = allVoices.find((v) => v.voice_id === assigned);
            const compatible = voicesForSlot(slot.id).sort(sortVoices);

            return (
              <AdminCard key={slot.id} delay={0.08}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{slot.label}</h3>
                    <span className="text-[10px] text-white/40">{slot.langLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">
                      {assignedVoice ? assignedVoice.tier : "—"}
                    </span>
                    {assigned && (
                      <AdminButton variant="secondary" onClick={() => testVoice(assigned)}
                        disabled={testing === assigned}
                        loading={testing === assigned}
                        icon={<Play size={12} />}>
                        Test
                      </AdminButton>
                    )}
                  </div>
                </div>

                {!assigned && (
                  <p className="text-[10px] text-white/30 mb-2 italic">
                    No voice assigned — chat will use browser speech for {slot.lang === "en" ? "English" : "Nepali"} {slot.label.includes("Male") ? "male" : "female"} messages
                  </p>
                )}

                {assignedVoice && (
                  <p className="text-xs text-white/60 mb-2 flex items-center gap-1">
                    <Volume2 size={12} />
                    {getVoiceLabel(assigned)}
                  </p>
                )}

                <div className="max-h-40 overflow-y-auto space-y-0.5 rounded-lg bg-white/[0.02] p-1">
                  {compatible.map((v) => {
                    const isSelected = assignments[slot.id] === v.voice_id;
                    const tierDot = v.tier === "Neural2" ? "★" : v.tier === "WaveNet" ? "●" : "○";
                    const tierColor = v.tier === "Neural2" ? "text-amber-400/80" : v.tier === "WaveNet" ? "text-blue-400/60" : "text-white/20";

                    return (
                      <button
                        key={v.voice_id}
                        onClick={() => setAssignments({ ...assignments, [slot.id]: v.voice_id })}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-left transition ${
                          isSelected
                            ? "bg-[#cf107a]/15 text-white"
                            : "text-white/50 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <span className={`${tierColor} w-4 text-center shrink-0 text-[10px]`}>{tierDot}</span>
                        <span className="font-medium">{v.name}</span>
                        <span className="text-[10px] text-white/30">{v.gender === "male" ? "Male" : "Female"}</span>
                        {isSelected && <span className="ml-auto text-[10px] text-[#cf107a]">Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </AdminCard>
            );
          })}

          <AdminCard delay={0.2}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Reference: All Voices</h3>
              <div className="flex gap-1">
                <button onClick={() => setRefTab("en-IN")}
                  className={`px-2 py-0.5 text-[10px] rounded-md transition ${refTab === "en-IN" ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
                  Indian English
                </button>
                <button onClick={() => setRefTab("hi-IN")}
                  className={`px-2 py-0.5 text-[10px] rounded-md transition ${refTab === "hi-IN" ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
                  Hindi
                </button>
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {refVoices.sort(sortVoices).map((v) => (
                <div key={v.voice_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 size={14} className="shrink-0 text-white/40" />
                    <span className="truncate text-white/80">{v.name}</span>
                    <span className="text-[10px] text-white/30 hidden sm:inline">{v.gender === "male" ? "Male" : "Female"}</span>
                    <span className={`text-[10px] ${v.tier === "Neural2" ? "text-amber-400/60" : v.tier === "WaveNet" ? "text-blue-400/40" : "text-white/20"}`}>
                      {v.tier}
                    </span>
                  </div>
                  <button onClick={() => testVoice(v.voice_id)}
                    disabled={testing === v.voice_id}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white disabled:opacity-40">
                    {testing === v.voice_id ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
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
