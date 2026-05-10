# MAWbot Deployment Guide

## Domain Setup

1. In Hostinger DNS panel:
   - Add CNAME record: `mawbot` → `cname.vercel-dns.com`

2. In Vercel:
   - Go to Project → Domains → Add `mawbot.vyomai.cloud`
   - Verify domain ownership
   - SSL auto-provisioned

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Environment Variables

All env vars in `.env.local` → Add to Vercel:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable from `.env.local`
3. Deploy

## Firebase Setup

1. Enable Authentication (Email/Password + Google)
2. Create Firestore database
3. Set Firestore security rules

## Post-Deploy

1. Run the crawler: `npx tsx scripts/crawl-all.ts`
2. Seed initial knowledge via admin panel
3. Test chat functionality
4. Run security scan: `npx tsx scripts/security-scan.ts`
