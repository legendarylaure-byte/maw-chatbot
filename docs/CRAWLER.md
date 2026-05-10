# MAWbot Website Crawler

## Overview

Crawls 213 MAW Group website URLs, discovers subpages up to 2 levels deep, extracts content, summarizes with Gemini, and stores in Firestore.

## Running

```bash
npx tsx scripts/crawl-all.ts
```

## Configuration

See `src/crawler/config.ts`:
- `rateLimitMs`: 1000 (1s delay between requests)
- `maxConcurrency`: 5
- `maxRetries`: 3
- `maxDepth`: 2
- `timeoutMs`: 30000

## Storage

Results stored in Firestore collections:
- `crawled_sites` — Per-domain stats
- `crawled_pages` — Individual page content + summary
- `crawled_documents` — PDF extractions

## Deduplication

Content is MD5-hashed. Pages with identical content are skipped on re-crawl.

## Security

Crawled data is stored in admin-only Firestore collections. Chatbot reads from the `memory` collection which admins populate from crawled data.
