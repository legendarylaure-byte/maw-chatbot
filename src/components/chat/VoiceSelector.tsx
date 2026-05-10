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

const STORAGE_KEY = "mawbot-selected-voice";

export function VoiceSelector({ currentLanguage, onVoiceChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedId(saved);
      onVoiceChange(saved);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchVoices = async () => {
      try {
        const res = await fetch("/api/tts/voices");
        const data = await res.json();
        if (!cancelled && data.voices?.length) {
          setVoices(data.voices);
          if (!selectedId || !data.voices.find((v: ElevenVoice) => v.voice_id === selectedId)) {
            const first = data.voices[0];
            setSelectedId(first.voice_id);
            onVoiceChange(first.voice_id);
            localStorage.setItem(STORAGE_KEY, first.voice_id);
          }
        }
      } catch {
        // No voices available
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchVoices();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (voice: ElevenVoice) => {
    setSelectedId(voice.voice_id);
    onVoiceChange(voice.voice_id);
    localStorage.setItem(STORAGE_KEY, voice.voice_id);
    setOpen(false);
  };

  const selected = voices.find((v) => v.voice_id === selectedId);

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
        <span className="max-w-[80px] truncate">{selected?.name || "Voice"}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl p-1 border border-white/10 min-w-[220px] max-h-[300px] overflow-y-auto">
            {voices.map((voice) => (
              <button
                key={voice.voice_id}
                onClick={() => handleSelect(voice)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-left transition ${
                  selectedId === voice.voice_id
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
        </>
      )}
    </div>
  );
}
