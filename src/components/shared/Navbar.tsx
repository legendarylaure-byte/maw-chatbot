"use client";

import { useState } from "react";
import { Sun, Moon, LogIn, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonal } from "@/hooks/useSeasonal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VoiceSelector } from "@/components/chat/VoiceSelector";

interface NavbarProps {
  language: "en" | "np";
  onLanguageChange: (lang: "en" | "np") => void;
  darkMode: boolean;
  onDarkModeChange: () => void;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
}

export function Navbar({ language, onLanguageChange, darkMode, onDarkModeChange, selectedVoice, onVoiceChange }: NavbarProps) {
  const { user, isAdmin, logout } = useAuth();
  const seasonal = useSeasonal();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="glass border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-glow flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-[#cf107a]/20">
            M
          </div>
          <div>
            <h1 className="font-heading font-semibold text-sm">
              MAWbot <span className="text-xs text-[#cf107a]">✦</span>
            </h1>
            {seasonal && (
              <p className="text-[10px] text-white/40 flex items-center gap-1">
                <span>{seasonal.emoji}</span> {seasonal.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VoiceSelector currentLanguage={language} onVoiceChange={onVoiceChange} />

          {/* Language toggle */}
          <button
            onClick={() => onLanguageChange(language === "en" ? "np" : "en")}
            className="px-3 py-1 rounded-full text-[11px] font-medium glass hover:bg-white/10 transition"
          >
            {language === "en" ? "नेपाली" : "English"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={onDarkModeChange}
            className="p-2 rounded-full glass hover:bg-white/10 transition"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <a
                  href="/admin"
                  className="text-[11px] px-2 py-1 rounded-full bg-[#cf107a]/20 text-[#cf107a] hover:bg-[#cf107a]/30 transition"
                >
                  Admin
                </a>
              )}
              <button
                onClick={logout}
                className="p-2 rounded-full glass hover:bg-white/10 transition text-white/60"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
              <div className="w-7 h-7 rounded-full bg-[#1457ee]/30 flex items-center justify-center text-xs font-medium">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="p-2 rounded-full gradient-glow transition"
              title="Sign in"
            >
              <LogIn size={15} />
            </button>
          )}
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
