"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const CACHE_MAX = 20;

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Map<string, string>>(new Map());

  const stopAudio = useCallback(() => {
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsPlaying(false);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const startListening = useCallback((language: string = "en-US") => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in your browser. Try Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const playAudio = useCallback(async (text: string, voiceId?: string, lang?: string, speed: number = 1.0) => {
    // Stop any current playback
    stopAudio();

    if (!text) return;

    // Strip emojis for cleaner TTS
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    if (!cleanText) return;

    // Try ElevenLabs first if voiceId is provided
    if (voiceId) {
      setTtsLoading(true);

      // Check cache
      const cacheKey = `${voiceId}:${cleanText.slice(0, 100)}`;
      const cachedUrl = ttsCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        const audio = new Audio(cachedUrl);
        audio.playbackRate = speed;
        audioRef.current = audio;
        setIsPlaying(true);
        setTtsLoading(false);
        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        audio.play().catch(() => {
          setIsPlaying(false);
          audioRef.current = null;
        });
        return;
      }

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText, voiceId, streaming: true, style: 0.3, useSpeakerBoost: true }),
        });
        if (res.ok) {
          setTtsLoading(false);
          // Try streaming playback via MediaSource
          if (res.body && typeof MediaSource !== "undefined") {
            try {
              const reader = res.body.getReader();
              const mediaSource = new MediaSource();
              const audioUrl = URL.createObjectURL(mediaSource);
              const audio = new Audio(audioUrl);
              audio.playbackRate = speed;
              audioRef.current = audio;

              mediaSource.addEventListener("sourceopen", async () => {
                let sourceBuffer: SourceBuffer;
                try {
                  sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                } catch {
                  // MediaSource MP3 not supported, fall back
                  mediaSource.endOfStream();
                  URL.revokeObjectURL(audioUrl);
                  throw new Error("MediaSource MP3 unsupported");
                }

                setIsPlaying(true);
                audio.play().catch(() => {});

                const pump = async () => {
                  try {
                    const { done, value } = await reader.read();
                    if (done) {
                      if (mediaSource.readyState === "open") {
                        mediaSource.endOfStream();
                      }
                      return;
                    }
                    await new Promise<void>((resolve, reject) => {
                      sourceBuffer.addEventListener("updateend", () => resolve(), { once: true });
                      sourceBuffer.addEventListener("error", () => reject(), { once: true });
                      sourceBuffer.appendBuffer(value);
                    });
                    pump();
                  } catch {
                    if (mediaSource.readyState === "open") {
                      mediaSource.endOfStream();
                    }
                  }
                };
                pump();
              });

              audio.onended = () => {
                setIsPlaying(false);
                audioRef.current = null;
                URL.revokeObjectURL(audioUrl);
              };
              audio.onerror = () => {
                setIsPlaying(false);
                audioRef.current = null;
                URL.revokeObjectURL(audioUrl);
              };
              return;
            } catch {
              // MediaSource failed, fall through to blob approach
            }
          }

          // Non-streaming fallback (blob)
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);

          // Cache the blob URL
          if (ttsCacheRef.current.size >= CACHE_MAX) {
            const firstKey = ttsCacheRef.current.keys().next().value;
            if (firstKey) ttsCacheRef.current.delete(firstKey);
          }
          ttsCacheRef.current.set(cacheKey, url);

          const audio = new Audio(url);
          audio.playbackRate = speed;
          audioRef.current = audio;
          setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            audioRef.current = null;
            URL.revokeObjectURL(url);
          };
          audio.onerror = () => {
            setIsPlaying(false);
            audioRef.current = null;
            URL.revokeObjectURL(url);
          };
          audio.play().catch(() => {
            setIsPlaying(false);
            audioRef.current = null;
          });
          return;
        }
      } catch (e) { console.error("TTS fetch failed:", e); }
      setTtsLoading(false);
    }

    // Fallback to browser speech synthesis
    setTtsLoading(false);
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang || "en-US";
      utterance.rate = speed;
      utterance.pitch = 1.0;

      // Select Nepali voice if available
      if (lang?.startsWith("ne")) {
        utterance.lang = "ne-NP";
        const voices = speechSynthesis.getVoices();
        const neVoice = voices.find((v) => v.lang.startsWith("ne"));
        if (neVoice) {
          utterance.voice = neVoice;
        }
      }

      utteranceRef.current = utterance;
      setIsPlaying(true);

      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      // If voices aren't loaded yet, wait for them
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((resolve) => {
          speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.onvoiceschanged = null;
            if (lang?.startsWith("ne")) {
              const neVoice = speechSynthesis.getVoices().find((v) => v.lang.startsWith("ne"));
              if (neVoice) {
                utterance.voice = neVoice;
              }
            }
            resolve();
          };
          setTimeout(resolve, 3000);
        });
      }

      speechSynthesis.speak(utterance);
    } catch (e) { console.error("Speech synthesis failed:", e); }
  }, [stopAudio]);

  return { isListening, isPlaying, ttsLoading, transcript, startListening, stopListening, playAudio, stopAudio };
}
