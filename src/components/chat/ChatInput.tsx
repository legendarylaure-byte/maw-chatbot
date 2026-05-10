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
      <div className="flex items-end gap-2 glass rounded-2xl p-2 border border-white/10">
        {extraButtons}
        <button
          type="button"
          onClick={handleMic}
          className={`p-2 rounded-full transition shrink-0 ${
            isListening
              ? "bg-[#cf107a] text-white animate-pulse"
              : "hover:bg-white/10 text-white/60"
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
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30 py-1.5"
          maxLength={2000}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-full gradient-glow disabled:opacity-30 transition shrink-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
      <p className="text-[10px] text-white/20 text-center mt-2">
        MAWbot may occasionally make mistakes. Verify important information.
      </p>
    </form>
  );
}
