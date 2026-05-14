import { START_URLS, CRAWL_CONFIG } from "./config";
import { fetchPage } from "./fetcher";
import { parsePage } from "./parser";
import { compressContent, splitIntoSections } from "./compressor";
import { summarizePageContent } from "./summarizer";
import { getContentHash, isDuplicate, resetDeduper } from "./deduper";
import { storePage, updateSiteStatus, promoteToMemory } from "./storage";
import { discoverInternalLinks, getDomain, normalizeUrl } from "./discoverer";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function crawlUrl(
  url: string,
  depth: number,
  visited: Set<string>,
  domainPageCount: Map<string, number>
): Promise<void> {
  const normalized = normalizeUrl(url);
  if (visited.has(normalized) || depth > CRAWL_CONFIG.maxDepth) return;
  if (isDuplicate(url)) return;

  visited.add(normalized);
  const domain = getDomain(url);

  console.log(`[${depth}/${CRAWL_CONFIG.maxDepth}] Crawling: ${url}`);

  const result = await fetchPage(url);
  if (!result) return;

  const parsed = parsePage(url, result.html);
  const compressed = compressContent(parsed.content);

  const summary = await summarizePageContent(compressed, parsed.title);

  const stored = await storePage({
    url: normalized,
    domain,
    title: parsed.title,
    description: parsed.description,
    content: compressed,
    sections: splitIntoSections(parsed.sections),
    summary,
    wordCount: parsed.wordCount,
    md5Hash: getContentHash(compressed),
    crawledAt: new Date().toISOString(),
  });

  if (stored) {
    domainPageCount.set(domain, (domainPageCount.get(domain) || 0) + 1);
    await promoteToMemory({
      url: normalized,
      title: parsed.title,
      description: parsed.description,
      summary,
      content: compressed,
    });
  }

  if (depth < CRAWL_CONFIG.maxDepth) {
    const internalLinks = discoverInternalLinks(result.html, domain);
    const uniqueLinks = [...new Set(internalLinks.map(normalizeUrl))]
      .filter((l) => !visited.has(l))
      .slice(0, 20);

    for (const link of uniqueLinks) {
      await delay(CRAWL_CONFIG.rateLimitMs);
      await crawlUrl(link, depth + 1, visited, domainPageCount);
    }
  }
}

export async function runCrawl() {
  console.log(`Starting MAWbot crawler for ${START_URLS.length} seed URLs...`);
  console.log(`Max depth: ${CRAWL_CONFIG.maxDepth}, Concurrency: ${CRAWL_CONFIG.maxConcurrency}`);

  resetDeduper();
  const visited = new Set<string>();
  const domainPageCount = new Map<string, number>();

  const startTime = Date.now();
  let crawled = 0;

  const seedBatchSize = CRAWL_CONFIG.maxConcurrency;
  for (let i = 0; i < START_URLS.length; i += seedBatchSize) {
    const batch = START_URLS.slice(i, i + seedBatchSize);
    const batchPromises = batch.map(async (url) => {
      if (visited.has(normalizeUrl(url))) return;
      await delay(CRAWL_CONFIG.rateLimitMs);
      await crawlUrl(url, 0, visited, domainPageCount);
      crawled++;
      if (crawled % 10 === 0) {
        console.log(`Progress: ${crawled}/${START_URLS.length} seed URLs processed`);
      }
    });
    await Promise.all(batchPromises);
  }

  for (const [domain, count] of domainPageCount) {
    await updateSiteStatus(domain, { pageCount: count, status: "complete" });
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\nCrawl complete!`);
  console.log(`Total pages stored: ${visited.size}`);
  console.log(`Domains crawled: ${domainPageCount.size}`);
  console.log(`Time elapsed: ${elapsed} minutes`);
}
