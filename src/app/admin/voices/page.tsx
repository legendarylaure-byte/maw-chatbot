"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Volume2, Play, RefreshCw, Save, Check, Search, Plus } from "lucide-react";
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sharedVoices, setSharedVoices] = useState<ElevenVoice[]>([]);
  const [browsing, setBrowsing] = useState(false);
  const [browsingAccent, setBrowsingAccent] = useState<string>("");
  const [addingVoice, setAddingVoice] = useState<string | null>(null);

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
    // Mount-only auth listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testVoice = async (voiceId: string) => {
    setTesting(voiceId);
    try {
      const voice = allVoices.find((v) => v.voice_id === voiceId);
      if (voice?.preview_url) {
        try {
          const audio = new Audio(voice.preview_url);
          audio.onended = () => setTesting(null);
          await audio.play();
          showMessage(`Playing preview for ${voice.name}`);
          return;
        } catch {
          showMessage("Preview playback failed (CSP or network). Trying TTS generation...");
        }
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello! This is MAWbot testing the voice. How does this sound?",
          voiceId,
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "Unknown error");
        showMessage(`Voice test failed (${res.status}).`);
        setTesting(null);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("audio/mpeg")) {
        showMessage("Voice test returned unexpected format.");
        setTesting(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setTesting(null); };
      await audio.play();
      showMessage(`Playing TTS for ${voice?.name || voiceId}`);
    } catch (e) {
      showMessage("Failed to test voice. Check console for details.");
      console.error("Failed to test voice:", e);
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
      }
    } catch (e) { console.error("Failed to save voice assignments:", e); }
    setSaving(false);
  };

  const browseSharedVoices = async (accent: string) => {
    setBrowsing(true);
    setBrowsingAccent(accent);
    try {
      const res = await fetch(`/api/tts/voices/shared?accent=${encodeURIComponent(accent)}&pageSize=20`);
      const data = await res.json();
      setSharedVoices(data.voices || []);
      if (!data.voices?.length) {
        showMessage(`No shared ${accent} voices found in ElevenLabs library.`);
      }
    } catch (e) {
      showMessage("Failed to browse shared voices. Check console.");
      console.error("Browse shared voices error:", e);
    }
    setBrowsing(false);
  };

  const addSharedVoice = async (voiceId: string, name: string) => {
    setAddingVoice(voiceId);
    try {
      const res = await fetch("/api/tts/voices/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_id: voiceId, name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        showMessage(`Failed to add voice: ${err.error}`);
        setAddingVoice(null);
        return;
      }
      showMessage(`Added "${name}" to your voices. Refreshing list...`);
      setSharedVoices([]);
      await fetchVoices();
    } catch (e) {
      showMessage("Failed to add voice. Check console.");
      console.error("Add voice error:", e);
    }
    setAddingVoice(null);
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
          {statusMessage && (
            <div className="px-3 py-2 rounded-lg bg-white/10 text-sm text-white/80 text-center">
              {statusMessage}
            </div>
          )}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">All Available Voices</h3>
              <div className="flex gap-1">
                {["all", "indian", "nepali"].map((f) => (
                  <button key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 text-[10px] rounded-md transition ${
                      filter === f ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(() => {
                const filtered = allVoices.filter(
                  (v) => filter === "all" || v.labels?.accent?.toLowerCase() === filter || v.name.toLowerCase().includes(filter)
                );
                if (filtered.length === 0) {
                  return (
                    <div className="p-3 text-center text-white/40 text-xs space-y-2">
                      <p>No {filter} voices in your account.</p>
                      <button
                        onClick={() => browseSharedVoices(filter)}
                        disabled={browsing}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition text-[10px] disabled:opacity-40"
                      >
                        {browsing && browsingAccent === filter ? (
                          <RefreshCw size={10} className="animate-spin" />
                        ) : (
                          <Search size={10} />
                        )}
                        Browse ElevenLabs {filter.charAt(0).toUpperCase() + filter.slice(1)} Voices
                      </button>
                    </div>
                  );
                }
                return filtered.map((v) => (
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
                ));
              })()}
            </div>
          </AdminCard>

          {sharedVoices.length > 0 && (
            <AdminCard delay={0.25}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">
                  Shared {browsingAccent.charAt(0).toUpperCase() + browsingAccent.slice(1)} Voices
                </h3>
                <button
                  onClick={() => { setSharedVoices([]); setBrowsingAccent(""); }}
                  className="text-[10px] text-white/40 hover:text-white/80 transition"
                >
                  Close
                </button>
              </div>
              <p className="text-[10px] text-white/30 mb-3">
                Click a voice to preview, then <strong>Add</strong> to add it to your account.
              </p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {sharedVoices.map((v) => (
                  <div key={v.voice_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Volume2 size={14} className="shrink-0 text-white/40" />
                      <span className="truncate text-white/80">{v.name}</span>
                      {v.labels?.accent && (
                        <span className="text-[10px] text-white/30 truncate hidden sm:inline">
                          {v.labels.accent}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {v.preview_url && (
                        <button
                          onClick={async () => {
                            setTesting(v.voice_id);
                            try {
                              const audio = new Audio(v.preview_url!);
                              audio.onended = () => setTesting(null);
                              await audio.play();
                            } catch {
                              showMessage("Preview playback failed. Try adding and using TTS.");
                              setTesting(null);
                            }
                          }}
                          disabled={testing === v.voice_id}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white disabled:opacity-40"
                        >
                          {testing === v.voice_id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Play size={12} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => addSharedVoice(v.voice_id, v.name)}
                        disabled={addingVoice === v.voice_id}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition text-green-400/60 hover:text-green-400 disabled:opacity-40"
                      >
                        {addingVoice === v.voice_id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Plus size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}
        </div>
      )}
    </div>
  );
}
