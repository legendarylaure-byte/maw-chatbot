"use client";

import { useState, useEffect } from "react";
import { Volume2, Loader2 } from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
  language: string;
  languageLabel: string;
  gender: string;
  tier: string;
}

interface VoiceSelectorProps {
  currentLanguage: "en" | "np";
  onVoiceChange: (voiceId: string) => void;
}

const GENDER_KEY = "mawbot-gender";

export function VoiceSelector({ currentLanguage, onVoiceChange }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [gender, setGender] = useState<"male" | "female">(() => {
    return (localStorage.getItem(GENDER_KEY) as "male" | "female") || "male";
  });

  const hasAss = Object.values(assignments).some(Boolean);

  const resolveVoiceId = () => {
    const key = `${currentLanguage}-${gender}`;
    return assignments[key] || null;
  };

  const resolvedId = resolveVoiceId();
  const resolvedVoice = voices.find((v) => v.voice_id === resolvedId);

  useEffect(() => {
    if (resolvedId && voices.find((v) => v.voice_id === resolvedId)) {
      onVoiceChange(resolvedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedId]);

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

        const allVoices: Voice[] = vData.voices || [];
        const ass: Record<string, string> = aData.assignments || {};
        setVoices(allVoices);
        setAssignments(ass);

        const hasAss = Object.values(ass).some(Boolean);

        if (hasAss) {
          const key = `${currentLanguage}-${gender}`;
          const vid = ass[key];
          if (vid && allVoices.find((v) => v.voice_id === vid)) {
            onVoiceChange(vid);
          } else {
            const first = Object.values(ass).find(Boolean) as string | undefined;
            if (first && allVoices.find((v) => v.voice_id === first)) {
              onVoiceChange(first);
            }
          }
        } else if (allVoices.length > 0) {
          onVoiceChange(allVoices[0].voice_id);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenderChange = (g: "male" | "female") => {
    setGender(g);
    localStorage.setItem(GENDER_KEY, g);
    const key = `${currentLanguage}-${g}`;
    const vid = assignments[key];
    if (vid && voices.find((v) => v.voice_id === vid)) {
      onVoiceChange(vid);
    }
  };

  if (loading) {
    return (
      <button className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] glass">
        <Loader2 size={12} className="animate-spin" />
      </button>
    );
  }

  if (voices.length === 0) return null;

  // Show inline Male/Female toggle when admin has assignments
  if (hasAss) {
    const maleId = assignments[`${currentLanguage}-male`];
    const femaleId = assignments[`${currentLanguage}-female`];
    const maleVoice = voices.find((v) => v.voice_id === maleId);
    const femaleVoice = voices.find((v) => v.voice_id === femaleId);

    return (
      <div className="flex items-center gap-1" title={`${gender === "male" ? "Male" : "Female"}: ${resolvedVoice?.voice_id || ""}`}>
        {maleId && (
          <button
            onClick={() => handleGenderChange("male")}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
              gender === "male"
                ? "bg-[#cf107a]/20 text-[#cf107a] border border-[#cf107a]/30"
                : "glass text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
            }`}
            title={maleVoice ? `Male: ${maleVoice.voice_id} (${maleVoice.tier})` : "Male"}
          >
            ♂ Male
          </button>
        )}
        {femaleId && (
          <button
            onClick={() => handleGenderChange("female")}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
              gender === "female"
                ? "bg-[#cf107a]/20 text-[#cf107a] border border-[#cf107a]/30"
                : "glass text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
            }`}
            title={femaleVoice ? `Female: ${femaleVoice.voice_id} (${femaleVoice.tier})` : "Female"}
          >
            ♀ Female
          </button>
        )}
      </div>
    );
  }

  // Fallback: no admin assignments — show all voices dropdown
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] glass hover:bg-white/10 transition"
      >
        <Volume2 size={12} />
        <span className="max-w-[80px] truncate">{resolvedVoice?.voice_id || "Voice"}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl p-1 border border-white/10 min-w-[220px] max-h-[300px] overflow-y-auto">
            {voices.map((v) => (
              <button key={v.voice_id} onClick={() => { onVoiceChange(v.voice_id); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-left transition ${
                  resolvedId === v.voice_id ? "bg-[#cf107a]/20 text-[#cf107a]" : "text-white/70 hover:bg-white/5"
                }`}>
                <Volume2 size={14} className="shrink-0" />
                <div className="min-w-0">
                  <span className="block truncate">{v.voice_id}</span>
                  <span className="block text-[10px] text-white/40 truncate">{v.languageLabel} — {v.tier}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
