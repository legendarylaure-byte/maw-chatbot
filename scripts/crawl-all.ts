#!/usr/bin/env node

/**
 * Crawl all 213 MAW websites
 * Run: npx tsx scripts/crawl-all.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import("../src/crawler").then(({ runCrawl }) => {
  runCrawl().catch((err) => {
    console.error("Crawl failed:", err);
    process.exit(1);
  });
});
