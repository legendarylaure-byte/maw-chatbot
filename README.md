# MAWbot 🤖✨

Official AI Assistant of **MAW Group of Companies**

Bilingual (English + Nepali) AI chatbot with voice support, games, quizzes, and an admin dashboard. Powered by Google Gemini 2.0, ElevenLabs TTS, Firebase, and hosted on Vercel.

## Features

- 💬 **Bilingual Chat** — English & Nepali with auto-detection
- 🎤 **Voice Input/Output** — Speech-to-Text + ElevenLabs male/female voices
- 🧠 **Memory System** — Admin-injected knowledge + user learning
- 😂 **Jokes & Humor** — Positive, curated joke bank
- 🎮 **Games & Quizzes** — Trivia, word games, daily challenges, riddles
- 🎛️ **Admin Dashboard** — Memory, jokes, quizzes, languages, voices, analytics
- 🔒 **Security-First** — Rate limiting, input sanitization, no hardcoded secrets
- 📱 **PWA** — Installable on mobile home screen
- 🌈 **Seasonal Themes** — Auto-detects Dashain, Tihar, Holi, and more

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| AI | Google Gemini 2.0 Flash |
| Voice | ElevenLabs (Eleven v3) + Web Speech API |
| Auth | Firebase Auth (Email + Google) |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Hosting | Vercel → mawbot.vyomai.cloud |
| Crawler | Node.js + axios + cheerio |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys in .env.local

# Run development server
npm run dev
```

## Environment Variables

See `.env.example` for required variables. All secrets go in `.env.local` (gitignored).

## Security

```bash
# Scan for hardcoded secrets
npm run security-scan
```

**Rate Limits:**
- Auth: 5 requests / 15 min
- Chat: 30 requests / 1 min
- Admin: 30 requests / 1 min

## Crawler

```bash
# Crawl all 213 MAW websites
npm run crawl
```

## Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Set domain: `mawbot.vyomai.cloud`
5. In Hostinger DNS: `CNAME mawbot → cname.vercel-dns.com`

## License

Private — MAW Group of Companies
