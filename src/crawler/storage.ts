import { adminDb } from "@/lib/firebase-admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";

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
