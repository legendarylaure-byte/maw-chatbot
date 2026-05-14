import { adminDb } from "@/lib/firebase-admin";

interface KnowledgeEntry {
  content: string;
  sourceUrl?: string;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "has", "have", "been", "some", "them", "than", "what", "when", "which", "will", "your", "about", "into", "over", "such", "that", "this", "with", "would", "from", "they", "also", "their", "there", "these", "like", "just", "more", "make", "than"].includes(w))
    .slice(0, 10);
}

function scoreByKeywords(text: string, queryKeywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of queryKeywords) {
    if (lower.includes(kw)) score += 1;
  }
  return queryKeywords.length > 0 ? score / queryKeywords.length : 0;
}

export async function getBotKnowledge(language: string = "en", query?: string): Promise<KnowledgeEntry[]> {
  try {
    const q = adminDb.collection("memory").where("active", "==", true);
    const snapshot = await q.limit(50).get();

    const queryKeywords = query ? extractKeywords(query) : [];
    const scored: { entry: KnowledgeEntry; score: number }[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const content = data.content?.[language] || data.content?.en;
      if (!content) return;

      let score = 1;
      if (queryKeywords.length > 0) {
        const kwScore = scoreByKeywords(content, queryKeywords);
        const titleScore = data.title ? scoreByKeywords(data.title, queryKeywords) : 0;
        const categoryScore = data.category ? scoreByKeywords(data.category, queryKeywords) : 0;
        const keywordField = data.keywords || [];
        const keywordMatch = keywordField.filter((k: string) =>
          queryKeywords.some((qk) => k.toLowerCase().includes(qk))
        ).length;
        score = Math.max(kwScore, titleScore, categoryScore);
        if (keywordMatch > 0) score = Math.max(score, 0.5);
        if (score < 0.15) return;
      }

      scored.push({
        entry: { content, sourceUrl: data.sourceUrl || undefined },
        score,
      });
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, query ? 15 : 25);
    return top.map((s) => s.entry);
  } catch (e) {
    console.error("getBotKnowledge failed:", e);
    return [];
  }
}

export async function getUserMemory(userId: string): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection("user_memory")
      .where("userId", "==", userId)
      .orderBy("confidence", "desc")
      .limit(20)
      .get();

    const facts: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fact) facts.push(data.fact);
    });

    return facts;
  } catch (e) {
    console.error("getUserMemory failed:", e);
    return [];
  }
}

export async function saveUserMemory(userId: string, fact: string, confidence: number = 0.5) {
  try {
    const existing = await adminDb
      .collection("user_memory")
      .where("userId", "==", userId)
      .where("fact", "==", fact)
      .limit(1)
      .get();

    if (existing.empty) {
      await adminDb.collection("user_memory").add({
        userId,
        fact,
        confidence,
        source: "inferred",
        createdAt: new Date().toISOString(),
        lastReferenced: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("saveUserMemory failed:", e);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

export async function searchKnowledge(query: string, language: string = "en", limit: number = 5): Promise<KnowledgeEntry[]> {
  try {
    const { getEmbedding } = await import("@/lib/gemini");
    const queryEmbedding = await getEmbedding(query);

    const snapshot = await adminDb.collection("memory").where("active", "==", true).limit(50).get();

    const scored: { entry: KnowledgeEntry; score: number }[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const storedEmbedding = data.embedding;
      const content = data.content?.[language] || data.content?.en;
      if (!content) return;

      if (storedEmbedding && storedEmbedding.length > 0) {
        const len = Math.min(queryEmbedding.length, storedEmbedding.length);
        const a = queryEmbedding.slice(0, len);
        const b = storedEmbedding.slice(0, len);
        const score = cosineSimilarity(a, b);
        if (score > 0.25) {
          scored.push({
            entry: { content, sourceUrl: data.sourceUrl || undefined },
            score,
          });
        }
      } else {
        const kwScore = scoreByKeywords(content, extractKeywords(query));
        if (kwScore > 0) {
          scored.push({
            entry: { content, sourceUrl: data.sourceUrl || undefined },
            score: kwScore * 0.5,
          });
        }
      }
    });

    scored.sort((a, b) => b.score - a.score);
    const memoryResults = scored.slice(0, limit).map((s) => s.entry);

    // Fallback: also search crawled_pages by keyword if memory results are weak
    if (memoryResults.length < 3) {
      try {
        const queryKeywords = extractKeywords(query);
        const cpSnapshot = await adminDb.collection("crawled_pages").limit(30).get();
        const cpScored: { entry: KnowledgeEntry; score: number }[] = [];

        cpSnapshot.forEach((doc) => {
          const data = doc.data();
          const content = data.summary || data.content?.slice(0, 2000);
          if (!content) return;
          const kwScore = scoreByKeywords(content, queryKeywords);
          const titleScore = data.title ? scoreByKeywords(data.title, queryKeywords) : 0;
          const score = Math.max(kwScore, titleScore);
          if (score > 0) {
            cpScored.push({
              entry: { content: content.slice(0, 1500), sourceUrl: data.url || undefined },
              score: score * 0.4,
            });
          }
        });

        cpScored.sort((a, b) => b.score - a.score);
        const cpResults = cpScored.slice(0, 2).map((s) => s.entry);
        memoryResults.push(...cpResults);
      } catch (e) {
        console.error("crawled_pages fallback search failed:", e);
      }
    }

    return memoryResults;
  } catch (e) {
    console.error("searchKnowledge failed:", e);
    return [];
  }
}

export async function saveConversation(
  userId: string,
  messages: { role: string; content: string }[],
  language: string
) {
  try {
    await adminDb.collection("conversations").add({
      userId,
      messages: messages.slice(-10),
      language,
      createdAt: new Date().toISOString(),
      messageCount: messages.length,
    });
  } catch (e) {
    console.error("saveConversation failed:", e);
  }
}
