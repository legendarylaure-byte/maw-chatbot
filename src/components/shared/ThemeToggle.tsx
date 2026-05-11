"use client";

import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
  variant?: "navbar" | "floating";
}

export function ThemeToggle({ darkMode, onToggle, variant = "navbar" }: ThemeToggleProps) {
  if (variant === "floating") {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full glass hover:bg-[var(--border-color)] transition-all duration-300 text-[var(--text-secondary)] hover:scale-110 active:scale-90 shadow-lg shadow-[var(--color-maw-indigo)]/10"
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <div className="relative w-5 h-5">
          <Sun
            size={20}
            className={`absolute inset-0 transition-all duration-500 ${
              darkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
            }`}
          />
          <Moon
            size={20}
            className={`absolute inset-0 transition-all duration-500 ${
              !darkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            }`}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full glass hover:bg-[var(--border-color)] transition text-[var(--text-secondary)]"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-4 h-4">
        <Sun
          size={16}
          className={`absolute inset-0 transition-all duration-500 ${
            darkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
          }`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-all duration-500 ${
            !darkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
