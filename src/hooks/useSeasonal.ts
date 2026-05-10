"use client";

import { useState, useEffect } from "react";

interface SeasonalEvent {
  name: string;
  emoji: string;
  color: string;
}

const seasons: { name: string; check: () => boolean; emoji: string; color: string }[] = [
  { name: "Dashain", check: () => { const d = new Date(); return d.getMonth() === 9 && d.getDate() >= 1 && d.getDate() <= 15; }, emoji: "🪁", color: "#cf107a" },
  { name: "Tihar", check: () => { const d = new Date(); return d.getMonth() === 10 && d.getDate() >= 1 && d.getDate() <= 5; }, emoji: "🪔", color: "#ff6b35" },
  { name: "Holi", check: () => { const d = new Date(); return d.getMonth() === 2 && d.getDate() >= 15 && d.getDate() <= 25; }, emoji: "🌈", color: "#9227a0" },
  { name: "New Year", check: () => { const d = new Date(); return (d.getMonth() === 0 && d.getDate() <= 2) || (d.getMonth() === 3 && d.getDate() >= 13 && d.getDate() <= 15); }, emoji: "🎉", color: "#1457ee" },
  { name: "Buddha Jayanti", check: () => { const d = new Date(); return d.getMonth() === 4 && d.getDate() >= 1 && d.getDate() <= 7; }, emoji: "🪷", color: "#513fc7" },
];

export function useSeasonal(): SeasonalEvent | null {
  const [event, setEvent] = useState<SeasonalEvent | null>(null);

  useEffect(() => {
    for (const s of seasons) {
      if (s.check()) {
        setEvent({ name: s.name, emoji: s.emoji, color: s.color });
        return;
      }
    }
    setEvent(null);
  }, []);

  return event;
}
