# MAWbot Security Guide

## Secrets Management

NEVER commit `.env.local` or any file containing real API keys.

### Required Environment Variables

See `.env.example` for the full list. All real values go in `.env.local` which is gitignored.

## Rate Limiting

| Endpoint | Max Requests | Window |
|----------|-------------|--------|
| POST /api/auth | 5 | 15 minutes |
| POST /api/chat | 30 | 1 minute |
| POST /api/feedback | 60 | 1 minute |
| POST /api/admin/* | 30 | 1 minute |

## Input Sanitization

- All user messages: max 2000 chars, HTML stripped, script tags removed
- All payloads: max 10KB size limit
- Admin inputs: validated against required fields

## Authentication

- Firebase Auth for user/admin login
- Admin role checked via Firebase custom claims
- Bearer token verification on all admin endpoints

## Firestore Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin-only collections
    match /{collection} {
      allow read, write: if request.auth != null 
        && request.auth.token.role == 'admin';
    }
  }
}
```

## Pre-Launch Audit

Run before deployment:
```bash
npx tsx scripts/security-scan.ts
```
