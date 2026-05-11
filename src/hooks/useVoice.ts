"use client";

import { useState, useRef, useCallback } from "react";

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  const playAudio = useCallback(async (text: string, voiceId?: string, lang?: string) => {
    // Try ElevenLabs first if voiceId is provided
    if (voiceId) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
          return;
        }
      } catch {}
    }

    // Fallback to browser speech synthesis (always works, no API key needed)
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || "en-US";
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    } catch {}
  }, []);

  return { isListening, transcript, startListening, stopListening, playAudio };
}
