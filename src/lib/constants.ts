// Core constants for MAWbot
// Do NOT put secrets here — use .env.local only

export const APP_NAME = "MAWbot";
export const APP_DESCRIPTION = "Official AI Assistant of MAW Group of Companies";
export const APP_URL = "https://mawbot.vyomai.cloud";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", voiceLocale: "en-US" },
  { code: "np", label: "नेपाली", voiceLocale: "ne-NP" },
] as const;

export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMinutes: 15 },
  CHAT: { maxRequests: 30, windowMinutes: 1 },
  FEEDBACK: { maxRequests: 60, windowMinutes: 1 },
} as const;

export const INPUT_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_PAYLOAD_SIZE: 10240,
} as const;

export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  MEMORY: "memory",
  CONVERSATIONS: "conversations",
  USER_MEMORY: "user_memory",
  FEEDBACK: "feedback",
  CRAWLED_SITES: "crawled_sites",
  CRAWLED_PAGES: "crawled_pages",
  CRAWLED_DOCUMENTS: "crawled_documents",
  GAME_SCORES: "game_scores",
  DAILY_CHALLENGES: "daily_challenges",
  STREAKS: "streaks",
  ADMIN_SETTINGS: "admin_settings",
} as const;

export const MAW_BRANDS = [
  "Deepal", "SERES", "Dongfeng", "Yamaha", "CKD-Yamaha Assembly Plant",
  "Foton", "Changan Motors", "Skoda", "Jeep", "Sokon", "Eicher",
  "JCB", "Mettler Toledo", "Ingersoll Rand", "JCB Parts", "Puzzolana",
  "Trane", "KONE Lifts", "Bass and Treble", "MAW Engineering",
  "MAW Foundation", "MAW Skills Academy", "MAW Hire Purchase", "HPCL",
] as const;

export const SEASONAL_EVENTS = [
  { name: "Dashain", month: 10, emoji: "🪁", color: "#cf107a" },
  { name: "Tihar", month: 11, emoji: "🪔", color: "#ff6b35" },
  { name: "Holi", month: 3, emoji: "🌈", color: "#9227a0" },
  { name: "New Year", month: 1, emoji: "🎉", color: "#1457ee" },
  { name: "Buddha Jayanti", month: 5, emoji: "🪷", color: "#513fc7" },
  { name: "Indra Jatra", month: 9, emoji: "🏮", color: "#cf107a" },
] as const;
