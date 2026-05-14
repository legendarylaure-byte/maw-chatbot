"use client";

import { useState, useEffect } from "react";
import { Volume2, ChevronDown, Loader2 } from "lucide-react";

interface ElevenVoice {
  voice_id: string;
  name: string;
  labels?: { accent?: string; description?: string; gender?: string };
  preview_url?: string;
}

interface VoiceSelectorProps {
  currentLanguage: "en" | "np";
  onVoiceChange: (voiceId: string) => void;
}

const SLOT_KEY = "mawbot-voice-slot";

type Slot = { type: "slot"; gender: "male" | "female" } | { type: "custom"; voiceId: string };

function parseSlot(raw: string | null): Slot {
  if (!raw) return { type: "slot", gender: "male" };
  if (raw.startsWith("custom:")) return { type: "custom", voiceId: raw.slice(7) };
  if (raw === "female") return { type: "slot", gender: "female" };
  return { type: "slot", gender: "male" };
}

function slotToKey(slot: Slot, lang: "en" | "np"): string {
  if (slot.type === "custom") return slot.voiceId;
  return `${lang}-${slot.gender}`;
}

export function VoiceSelector({ currentLanguage, onVoiceChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showAllPicker, setShowAllPicker] = useState(false);
  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [slot, setSlot] = useState<Slot>(() => parseSlot(localStorage.getItem(SLOT_KEY)));

  const hasAssignments = Object.values(assignments).some(Boolean);

  const resolveVoiceId = (s: Slot): string | null => {
    if (s.type === "custom") return s.voiceId;
    const key = slotToKey(s, currentLanguage);
    return assignments[key] || null;
  };

  const resolvedId = resolveVoiceId(slot);
  const resolvedVoice = voices.find((v) => v.voice_id === resolvedId);

  // Update parent whenever resolved voice changes
  useEffect(() => {
    if (resolvedId && voices.find((v) => v.voice_id === resolvedId)) {
      onVoiceChange(resolvedId);
    }
    // only run when these change, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedId]);

  // Fetch voices + admin assignments on mount
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [vRes, aRes] = await Promise.all([
          fetch("/api/tts/voices"),
          fetch("/api/admin/voices/assignments"),
        ]);
        const [vData, aData] = await Promise.all([vRes.json(), aRes.json()]);
        if (cancelled) return;

        const allVoices: ElevenVoice[] = vData.voices || [];
        const ass: Record<string, string> = aData.assignments || {};
        setVoices(allVoices);
        setAssignments(ass);

        const hasAss = Object.values(ass).some(Boolean);

        // Pick initial voice if not yet set
        if (hasAss) {
          const vid = resolveVoiceId(slot);
          if (vid && allVoices.find((v) => v.voice_id === vid)) {
            onVoiceChange(vid);
          } else {
            const first = Object.values(ass).find(Boolean) as string | undefined;
            if (first && allVoices.find((v) => v.voice_id === first)) {
              onVoiceChange(first);
            }
          }
        } else {
          const stored = slot.type === "custom" ? slot.voiceId : null;
          if (stored && allVoices.find((v) => v.voice_id === stored)) {
            onVoiceChange(stored);
          } else if (allVoices.length > 0) {
            const newSlot: Slot = { type: "custom", voiceId: allVoices[0].voice_id };
            setSlot(newSlot);
            localStorage.setItem(SLOT_KEY, "custom:" + allVoices[0].voice_id);
            onVoiceChange(allVoices[0].voice_id);
          }
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSlotPick = (gender: "male" | "female") => {
    const newSlot: Slot = { type: "slot", gender };
    setSlot(newSlot);
    localStorage.setItem(SLOT_KEY, gender);
    setShowAllPicker(false);
    setOpen(false);

    const vid = resolveVoiceId(newSlot);
    const v = voices.find((v) => v.voice_id === vid);
    if (vid && v) onVoiceChange(vid);
  };

  const handleCustomPick = (voice: ElevenVoice) => {
    const newSlot: Slot = { type: "custom", voiceId: voice.voice_id };
    setSlot(newSlot);
    localStorage.setItem(SLOT_KEY, "custom:" + voice.voice_id);
    setShowAllPicker(false);
    setOpen(false);
    onVoiceChange(voice.voice_id);
  };

  // Build label for trigger button
  let label = "Voice";
  if (!loading) {
    if (slot.type === "slot" && hasAssignments) {
      const genderLabel = slot.gender === "male" ? "Male" : "Female";
      label = `${genderLabel}${resolvedVoice ? ` (${resolvedVoice.name})` : ""}`;
    } else if (resolvedVoice) {
      label = resolvedVoice.name;
    } else if (voices.length > 0) {
      label = voices[0].name;
    }
  }

  // Build slot options for current language
  const lang = currentLanguage;
  const maleId = assignments[`${lang}-male`];
  const femaleId = assignments[`${lang}-female`];
  const maleVoice = voices.find((v) => v.voice_id === maleId);
  const femaleVoice = voices.find((v) => v.voice_id === femaleId);

  if (loading) {
    return (
      <button className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] glass">
        <Loader2 size={12} className="animate-spin" />
      </button>
    );
  }

  if (voices.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] glass hover:bg-white/10 transition"
      >
        <Volume2 size={12} />
        <span className="max-w-[80px] truncate">{label}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {showAllPicker ? (
            <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl p-1 border border-white/10 min-w-[240px] max-h-[300px] overflow-y-auto">
              <button
                onClick={() => setShowAllPicker(false)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[10px] text-white/50 hover:text-white/80 hover:bg-white/5 transition text-left mb-1"
              >
                ← Back to slots
              </button>
              {voices.map((voice) => (
                <button
                  key={voice.voice_id}
                  onClick={() => handleCustomPick(voice)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-left transition ${
                    resolvedId === voice.voice_id
                      ? "bg-[#cf107a]/20 text-[#cf107a]"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Volume2 size={14} className="shrink-0" />
                  <div className="min-w-0">
                    <span className="block truncate">{voice.name}</span>
                    {voice.labels?.description && (
                      <span className="block text-[10px] text-white/40 truncate">
                        {voice.labels.description}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl p-1 border border-white/10 min-w-[220px]">
              {hasAssignments ? (
                <>
                  <p className="px-3 py-1 text-[10px] text-white/40 uppercase tracking-wider">
                    {currentLanguage === "np" ? "Nepali" : "English"}
                  </p>
                  {maleId && (
                    <button
                      onClick={() => handleSlotPick("male")}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-left transition ${
                        slot.type === "slot" && slot.gender === "male"
                          ? "bg-[#cf107a]/20 text-[#cf107a]"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <Volume2 size={14} className="shrink-0" />
                      <div className="min-w-0">
                        <span className="block truncate">Male</span>
                        {maleVoice && (
                          <span className="block text-[10px] text-white/40 truncate">
                            {maleVoice.name}
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                  {femaleId && (
                    <button
                      onClick={() => handleSlotPick("female")}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-left transition ${
                        slot.type === "slot" && slot.gender === "female"
                          ? "bg-[#cf107a]/20 text-[#cf107a]"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <Volume2 size={14} className="shrink-0" />
                      <div className="min-w-0">
                        <span className="block truncate">Female</span>
                        {femaleVoice && (
                          <span className="block text-[10px] text-white/40 truncate">
                            {femaleVoice.name}
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => setShowAllPicker(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition text-left"
                  >
                    All Voices...
                  </button>
                </>
              ) : (
                <>
                  {voices.map((voice) => (
                    <button
                      key={voice.voice_id}
                      onClick={() => handleCustomPick(voice)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-left transition ${
                        resolvedId === voice.voice_id
                          ? "bg-[#cf107a]/20 text-[#cf107a]"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <Volume2 size={14} className="shrink-0" />
                      <div className="min-w-0">
                        <span className="block truncate">{voice.name}</span>
                        {voice.labels?.description && (
                          <span className="block text-[10px] text-white/40 truncate">
                            {voice.labels.description}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
