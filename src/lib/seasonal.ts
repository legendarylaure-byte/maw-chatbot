export function getCurrentSeason(): { name: string; emoji: string; color: string } | null {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();

  const seasons = [
    { name: "Dashain", check: () => month === 10 && day >= 1 && day <= 15, emoji: "🪁", color: "#cf107a" },
    { name: "Tihar", check: () => month === 11 && day >= 1 && day <= 5, emoji: "🪔", color: "#ff6b35" },
    { name: "Holi", check: () => month === 3 && day >= 15 && day <= 25, emoji: "🌈", color: "#9227a0" },
    { name: "New Year", check: () => (month === 1 && day <= 2) || (month === 4 && day >= 13 && day <= 15), emoji: "🎉", color: "#1457ee" },
    { name: "Buddha Jayanti", check: () => month === 5 && day >= 1 && day <= 7, emoji: "🪷", color: "#513fc7" },
  ];

  for (const s of seasons) {
    if (s.check()) return { name: s.name, emoji: s.emoji, color: s.color };
  }

  return null;
}
