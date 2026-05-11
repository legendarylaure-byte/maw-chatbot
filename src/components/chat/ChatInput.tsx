"use client";

import { Mic, Send, Sparkles } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  language: "en" | "np";
  onSend: (text: string) => void;
  onMicResult?: (text: string) => void;
  extraButtons?: React.ReactNode;
}

export function ChatInput({ input, setInput, isLoading, language, onSend, onMicResult, extraButtons }: ChatInputProps) {
  const { isListening, startListening, stopListening, transcript } = useVoice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMic = () => {
    if (isListening) {
      stopListening();
      if (transcript && onMicResult) {
        onMicResult(transcript);
      }
    } else {
      const locale = language === "np" ? "ne-NP" : "en-US";
      startListening(locale);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
      <div className="relative">
        {/* Gradient border glow */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[var(--color-maw-blue)] via-[var(--color-maw-indigo)] to-[var(--color-maw-magenta)] opacity-30 blur-sm" />
        <div className="relative flex items-end gap-2 bg-[var(--bg-glass)] backdrop-blur-xl rounded-2xl p-2 border border-[var(--border-glass)]">
          {extraButtons}
          <button
            type="button"
            onClick={handleMic}
            className={`p-2 rounded-full transition shrink-0 ${
              isListening
                ? "bg-[var(--color-maw-magenta)] text-white animate-pulse shadow-lg shadow-[var(--color-maw-magenta)]/30"
                : "hover:bg-[var(--border-color)] text-[var(--text-secondary)]"
            }`}
            title="Voice input"
          >
            <Mic size={18} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading
                ? "MAWbot is thinking..."
                : language === "np"
                ? "सन्देश लेख्नुहोस्..."
                : "Type your message..."
            }
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)] py-1.5 text-[var(--text-primary)]"
            maxLength={2000}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            onClick={(e) => {
              if (!input.trim() || isLoading) return;
              const btn = e.currentTarget;
              const circle = document.createElement("span");
              const rect = btn.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height);
              circle.style.width = circle.style.height = `${size}px`;
              circle.style.left = `${e.clientX - rect.left - size / 2}px`;
              circle.style.top = `${e.clientY - rect.top - size / 2}px`;
              circle.classList.add("ripple-effect");
              btn.appendChild(circle);
              setTimeout(() => circle.remove(), 600);
            }}
            className="relative p-2 rounded-full gradient-glow disabled:opacity-30 transition shrink-0 hover:scale-105 active:scale-95 disabled:hover:scale-100 overflow-hidden"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
        MAWbot may occasionally make mistakes. Verify important information.
      </p>
    </form>
  );
}
