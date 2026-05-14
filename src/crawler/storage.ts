import { adminDb } from "@/lib/firebase-admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { getEmbedding } from "@/lib/gemini";

const MEMORY_EMBEDDING_DIMS = 768;

interface StoredPage {
  url: string;
  domain: string;
  title: string;
  description: string;
  content: string;
  sections: { heading: string; text: string }[];
  summary?: string;
  wordCount: number;
  md5Hash: string;
  crawledAt: string;
}

export async function storePage(page: StoredPage): Promise<boolean> {
  try {
    const col = adminDb.collection(FIRESTORE_COLLECTIONS.CRAWLED_PAGES);
    const existing = await col.where("md5Hash", "==", page.md5Hash).limit(1).get();

    if (!existing.empty) {
      return false; // Already exists
    }

    await col.add(page);
    return true;
  } catch (error) {
    console.error(`Failed to store page ${page.url}:`, error);
    return false;
  }
}

export async function updateSiteStatus(domain: string, stats: {
  pageCount: number;
  status: string;
}) {
  try {
    const col = adminDb.collection(FIRESTORE_COLLECTIONS.CRAWLED_SITES);
    const existing = await col.where("domain", "==", domain).limit(1).get();

    if (existing.empty) {
      await col.add({ domain, ...stats, lastCrawled: new Date().toISOString() });
    } else {
      await existing.docs[0].ref.update({ ...stats, lastCrawled: new Date().toISOString() });
    }
  } catch (error) {
    console.error(`Failed to update site status for ${domain}:`, error);
  }
}

interface PromoteInput {
  url: string;
  title: string;
  description: string;
  summary?: string;
  content: string;
}

export async function promoteToMemory(page: PromoteInput): Promise<void> {
  try {
    const memCol = adminDb.collection(FIRESTORE_COLLECTIONS.MEMORY);
    const existing = await memCol.where("sourceUrl", "==", page.url).limit(1).get();
    if (!existing.empty) return;

    const content = page.summary || page.content.slice(0, 3000);
    const keywords = [
      ...new Set(
        [...extractKeywords(page.title), ...extractKeywords(page.description || "")]
      ),
    ];

    let embedding: number[] = [];
    try {
      embedding = await getEmbedding(content.slice(0, 2000));
    } catch {
      console.warn(`Embedding failed for ${page.url}, skipping embedding`);
    }

    await memCol.add({
      content: { en: content },
      category: "crawled",
      active: true,
      keywords,
      sourceUrl: page.url,
      title: page.title,
      embedding,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to promote ${page.url} to memory:`, error);
  }
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "has", "have", "been", "some", "them", "than", "what", "when", "which", "will", "your", "about", "into", "over", "such", "that", "this", "with", "would", "from", "they", "also", "their", "there", "these", "like", "just", "more", "make"].includes(w));
}
