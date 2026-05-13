"use client";

import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { Navbar } from "@/components/shared/Navbar";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SuggestedPrompts } from "@/components/chat/SuggestedPrompts";
import { WelcomeScreen } from "@/components/shared/WelcomeScreen";
import { SeasonalDecorations } from "@/components/shared/SeasonalDecorations";
import { TriviaQuiz } from "@/components/games/TriviaQuiz";
import { WordGame } from "@/components/games/WordGame";
import { RiddleCard } from "@/components/games/RiddleCard";
import { PersonalityQuiz } from "@/components/games/PersonalityQuiz";
import { AuthProvider } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, X } from "lucide-react";

type GameTab = "trivia" | "word" | "riddle" | "personality" | null;

function ChatContent() {
  const { showWelcome, startChat, messages, input, setInput, isLoading, language, setLanguage, sendMessage, messagesEndRef, resetChat } = useChat();
  const { playAudio, isPlaying, stopAudio, ttsLoading } = useVoice();
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem("mawbot-theme");
      if (stored) return stored === "dark";
      return false;
    } catch { return false; }
  });
  const [selectedVoice, setSelectedVoice] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [activeGame, setActiveGame] = useState<GameTab>(null);
  const lastAutoPlayedRef = useRef(-1);

  // Sync darkMode state with <html> class + localStorage + theme-color
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("mawbot-theme", darkMode ? "dark" : "light");

    // Update browser theme-color meta tag
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", darkMode ? "#0A0A1A" : "#F5F2FF");
    }
  }, [darkMode]);

  // Auto-play voice for new bot messages
  useEffect(() => {
    if (isLoading || showWelcome || !autoPlayEnabled) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    // Skip empty content (streaming hasn't delivered text yet)
    if (!lastMsg.content) return;
    const msgIndex = messages.length - 1;
    if (msgIndex <= lastAutoPlayedRef.current) return;
    lastAutoPlayedRef.current = msgIndex;
    const lang = language === "np" ? "ne-NP" : "en-US";
    playAudio(lastMsg.content, selectedVoice || undefined, lang, playbackSpeed);
  }, [messages, isLoading, showWelcome, language, selectedVoice, playAudio, playbackSpeed]);

  const showPrompts = messages.length === 1 && !showWelcome;

  const gameTabs: { id: GameTab; label: string }[] = [
    { id: "trivia", label: "Trivia" },
    { id: "word", label: "Word Game" },
    { id: "riddle", label: "Riddles" },
    { id: "personality", label: "Quiz" },
  ];

  return (
    <AnimatePresence mode="wait">
      {showWelcome ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-[var(--bg-primary)]"
        >
          <WelcomeScreen
            language={language}
            onStart={startChat}
            darkMode={darkMode}
            onDarkModeChange={() => setDarkMode(!darkMode)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative"
        >
      <SeasonalDecorations />
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onDarkModeChange={() => setDarkMode(!darkMode)}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        isPlaying={isPlaying}
        onStopAudio={stopAudio}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={setPlaybackSpeed}
        ttsLoading={ttsLoading}
        autoPlayEnabled={autoPlayEnabled}
        onAutoPlayToggle={() => setAutoPlayEnabled(!autoPlayEnabled)}
        onResetChat={resetChat}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} language={language} voiceId={selectedVoice} messageIndex={i} playAudio={playAudio} isPlaying={isPlaying} stopAudio={stopAudio} playbackSpeed={playbackSpeed} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {activeGame && (
        <div className="relative z-10 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {gameTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGame(tab.id)}
                    className={`px-3 py-1 rounded-full text-xs transition ${
                      activeGame === tab.id ? "bg-[var(--color-maw-magenta)]/20 text-[var(--color-maw-magenta)]" : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActiveGame(null)}
                className="p-1 rounded-lg hover:bg-[var(--border-color)] transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="glass rounded-xl p-4 border border-[var(--border-color)]">
              {activeGame === "trivia" && <TriviaQuiz />}
              {activeGame === "word" && <WordGame />}
              {activeGame === "riddle" && <RiddleCard />}
              {activeGame === "personality" && <PersonalityQuiz />}
            </div>
          </div>
        </div>
      )}

      {showPrompts && !activeGame && (
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <SuggestedPrompts
            language={language}
            onSelect={(text) => {
              sendMessage(text);
            }}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          language={language}
          onSend={sendMessage}
          onMicResult={(text) => {
            setInput(text);
          }}
          extraButtons={
            <button
              onClick={() => setActiveGame(activeGame ? null : "trivia")}
              className={`p-2 rounded-full transition ${
                activeGame ? "bg-[var(--color-maw-magenta)]/20 text-[var(--color-maw-magenta)]" : "glass hover:bg-[var(--border-color)] text-[var(--text-secondary)]"
              }`}
              title="Games"
            >
              <Gamepad2 size={16} />
            </button>
          }
        />
      </div>
          </motion.div>
        )}
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <ChatContent />
    </AuthProvider>
  );
}
