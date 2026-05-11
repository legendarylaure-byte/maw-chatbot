"use client";

import { useChat } from "@/hooks/useChat";
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
import { useState, useEffect } from "react";
import { Gamepad2, X } from "lucide-react";

type GameTab = "trivia" | "word" | "riddle" | "personality" | null;

function ChatContent() {
  const { showWelcome, startChat, messages, input, setInput, isLoading, language, setLanguage, sendMessage, messagesEndRef } = useChat();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [activeGame, setActiveGame] = useState<GameTab>(null);

  // Sync darkMode state with <html> class + localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("mawbot-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const showPrompts = messages.length === 1 && !showWelcome;

  const gameTabs: { id: GameTab; label: string }[] = [
    { id: "trivia", label: "Trivia" },
    { id: "word", label: "Word Game" },
    { id: "riddle", label: "Riddles" },
    { id: "personality", label: "Quiz" },
  ];

  // Welcome screen
  if (showWelcome) {
    return <WelcomeScreen language={language} onStart={startChat} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      <SeasonalDecorations />
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onDarkModeChange={() => setDarkMode(!darkMode)}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} language={language} voiceId={selectedVoice} messageIndex={i} />
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
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <ChatContent />
    </AuthProvider>
  );
}
