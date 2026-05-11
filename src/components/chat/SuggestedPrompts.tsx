"use client";

interface SuggestedPromptsProps {
  onSelect: (text: string) => void;
  language: "en" | "np";
}

const prompts = {
  en: [
    "Tell me about MAW Group",
    "What brands do you have?",
    "Tell me a joke! 😂",
    "Play a quiz! 🎮",
  ],
  np: [
    "MAW Group को बारेमा बताउनुहोस्",
    "तपाईंको ब्रान्डहरू के के हुन्?",
    "एउटा जोक सुनाउनुहोस्! 😂",
    "क्विज खेलौं! 🎮",
  ],
};

export function SuggestedPrompts({ onSelect, language }: SuggestedPromptsProps) {
  const items = prompts[language] || prompts.en;

  return (
    <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
      {items.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="shrink-0 px-4 py-2 text-xs rounded-xl border border-[var(--color-maw-indigo)]/30 bg-[var(--color-maw-indigo)]/5 hover:bg-[var(--color-maw-indigo)]/15 hover:border-[var(--color-maw-indigo)]/60 transition-all whitespace-nowrap text-[var(--text-secondary)] hover:text-[var(--color-maw-indigo)] font-medium"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
