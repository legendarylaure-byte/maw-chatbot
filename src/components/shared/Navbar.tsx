"use client";

import { useState } from "react";
import { LogIn, LogOut, VolumeX, Volume2, Zap, Snail, Rabbit, Turtle, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonal } from "@/hooks/useSeasonal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VoiceSelector } from "@/components/chat/VoiceSelector";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  language: "en" | "np";
  onLanguageChange: (lang: "en" | "np") => void;
  darkMode: boolean;
  onDarkModeChange: () => void;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  isPlaying?: boolean;
  onStopAudio?: () => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  ttsLoading?: boolean;
  autoPlayEnabled?: boolean;
  onAutoPlayToggle?: () => void;
  onResetChat?: () => void;
}

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;

function SpeedIcon({ speed, current }: { speed: number; current: number }) {
  const isActive = speed === current;
  if (speed <= 0.5) return <Snail size={12} className={isActive ? "text-[var(--color-maw-magenta)]" : ""} />;
  if (speed <= 0.75) return <Turtle size={12} className={isActive ? "text-[var(--color-maw-magenta)]" : ""} />;
  if (speed <= 1.25) return <Zap size={12} className={isActive ? "text-[var(--color-maw-magenta)]" : ""} />;
  return <Rabbit size={12} className={isActive ? "text-[var(--color-maw-magenta)]" : ""} />;
}

export function Navbar({ language, onLanguageChange, darkMode, onDarkModeChange, selectedVoice, onVoiceChange, isPlaying, onStopAudio, playbackSpeed = 1.0, onPlaybackSpeedChange, ttsLoading, autoPlayEnabled, onAutoPlayToggle, onResetChat }: NavbarProps) {
  const { user, isAdmin, logout } = useAuth();
  const seasonal = useSeasonal();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="glass border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-maw-blue)] via-[var(--color-maw-indigo)] to-[var(--color-maw-magenta)] p-[2px] shadow-lg shadow-[var(--color-maw-indigo)]/20 group-hover:shadow-[var(--color-maw-indigo)]/40 transition-shadow">
              <div className="w-full h-full rounded-xl bg-[var(--bg-primary)] flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="MAW"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    const parent = (e.currentTarget as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="text-sm font-bold text-gradient">M</span>';
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <h1 className="font-heading font-semibold text-sm text-[var(--text-primary)]">
                MAWbot <span className="text-xs text-[var(--color-maw-magenta)]">✦</span>
              </h1>
              {seasonal && (
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <span>{seasonal.emoji}</span> {seasonal.name}
                </p>
              )}
            </div>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <VoiceSelector currentLanguage={language} onVoiceChange={onVoiceChange} />

          {/* New Chat */}
          {onResetChat && (
            <button
              onClick={onResetChat}
              className="p-1.5 rounded text-[10px] text-[var(--text-muted)] hover:text-[var(--color-maw-magenta)] transition"
              title="New conversation"
            >
              <Plus size={12} />
            </button>
          )}

          {/* Auto-play toggle */}
          {onAutoPlayToggle !== undefined && (
            <button
              onClick={onAutoPlayToggle}
              className={`p-1.5 rounded text-[10px] transition ${
                autoPlayEnabled
                  ? "text-[var(--color-maw-magenta)]"
                  : "text-[var(--text-muted)] opacity-50"
              }`}
              title={autoPlayEnabled ? "Auto-play on" : "Auto-play off"}
            >
              <Volume2 size={12} />
            </button>
          )}

          {/* Speed control */}
          {onPlaybackSpeedChange && (
            <div className="relative flex items-center gap-0.5">
              {SPEED_PRESETS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => onPlaybackSpeedChange(speed)}
                  className={`flex flex-col items-center px-1.5 py-1 rounded text-[10px] font-medium transition ${
                    playbackSpeed === speed
                      ? "text-[var(--color-maw-magenta)] bg-[var(--color-maw-magenta)]/10"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] glass"
                  }`}
                  title={`Speed: ${speed}x`}
                >
                  <SpeedIcon speed={speed} current={playbackSpeed} />
                  <span className="text-[8px] leading-none mt-0.5 opacity-60">{speed}x</span>
                </button>
              ))}
            </div>
          )}

          {/* TTS loading indicator */}
          {ttsLoading && (
            <div className="p-1.5 rounded text-[var(--color-maw-magenta)]" title="Loading voice...">
              <Loader2 size={14} className="animate-spin" />
            </div>
          )}

          {/* Global stop button */}
          {isPlaying && onStopAudio && (
            <button
              onClick={onStopAudio}
              className="p-2 rounded-full text-[var(--color-maw-magenta)] bg-[var(--color-maw-magenta)]/10 hover:bg-[var(--color-maw-magenta)]/20 transition animate-pulse"
              title="Stop voice"
            >
              <VolumeX size={15} />
            </button>
          )}

          {/* Language toggle */}
          <button
            onClick={() => onLanguageChange(language === "en" ? "np" : "en")}
            className="px-3 py-1 rounded-full text-[11px] font-medium glass hover:bg-[var(--border-color)] transition text-[var(--text-secondary)]"
          >
            {language === "en" ? "नेपाली" : "English"}
          </button>

          <ThemeToggle darkMode={darkMode} onToggle={onDarkModeChange} variant="navbar" />

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <a
                  href="/admin"
                  className="text-[11px] px-2 py-1 rounded-full bg-[var(--color-maw-magenta)]/20 text-[var(--color-maw-magenta)] hover:bg-[var(--color-maw-magenta)]/30 transition"
                >
                  Admin
                </a>
              )}
              <button
                onClick={logout}
                className="p-2 rounded-full glass hover:bg-[var(--border-color)] transition text-[var(--text-muted)]"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
              <div className="w-7 h-7 rounded-full bg-[var(--color-maw-blue)]/30 flex items-center justify-center text-xs font-medium text-[var(--text-primary)]">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="p-2 rounded-full gradient-glow transition hover:scale-105 active:scale-95"
              title="Sign in"
            >
              <LogIn size={15} className="text-white" />
            </button>
          )}
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
