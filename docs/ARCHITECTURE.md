# MAWbot Architecture

## Overview

MAWbot is a bilingual (English/Nepali) AI chatbot for MAW Group of Companies, built with Next.js 14, Firebase, Google Gemini 2.0, and ElevenLabs TTS.

## System Architecture

```
User → Next.js (Vercel) → API Routes → Gemini 2.0 / ElevenLabs / Firebase
```

## Key Components

### Frontend
- **Chat UI**: `src/app/page.tsx` — Main chat interface with glassmorphism design
- **Admin Panel**: `src/app/admin/*` — Protected dashboard for memory, jokes, quizzes, settings
- **PWA**: `public/manifest.json`, `public/sw.js` — Installable on mobile

### Backend API Routes
- `/api/chat` — Gemini 2.0 chat completion with context injection
- `/api/tts` — ElevenLabs text-to-speech
- `/api/auth` — Firebase auth verification
- `/api/admin/*` — Admin CRUD operations
- `/api/feedback` — Thumbs up/down feedback

### Database (Firestore)
- `memory` — Admin-injected knowledge (EN+NP)
- `users` — User profiles and preferences
- `conversations` — Chat history
- `user_memory` — Per-user learned facts
- `crawled_pages` — Website crawl results

### Crawler
- `src/crawler/*` — Scrapes 213 MAW websites, 2 levels deep, Gemini-summarized

## Security
- Rate limiting on all API endpoints
- Input sanitization on all user input
- Firebase Auth with admin role verification
- No secrets in source code (all in .env.local)
- pre-commit hook scans for hardcoded secrets
