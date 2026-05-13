import { adminDb } from "@/lib/firebase-admin";

interface KnowledgeEntry {
  content: string;
  sourceUrl?: string;
}

export async function getBotKnowledge(language: string = "en", category?: string): Promise<KnowledgeEntry[]> {
  try {
    let query = adminDb.collection("memory").where("active", "==", true);
    if (category) {
      query = query.where("category", "==", category);
    }
    const snapshot = await query.limit(50).get();

    const entries: KnowledgeEntry[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const content = data.content?.[language] || data.content?.en;
      if (content) {
        entries.push({
          content,
          sourceUrl: data.sourceUrl || undefined,
        });
      }
    });

    return entries;
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

export async function searchKnowledge(query: string, language: string = "en", limit: number = 3): Promise<KnowledgeEntry[]> {
  try {
    const { getEmbedding } = await import("@/lib/gemini");
    const queryEmbedding = await getEmbedding(query);
    const trimmedEmbedding = queryEmbedding.slice(0, 128);

    const snapshot = await adminDb.collection("memory").where("active", "==", true).limit(50).get();

    const scored: { entry: KnowledgeEntry; score: number }[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const storedEmbedding = data.embedding;
      const content = data.content?.[language] || data.content?.en;
      if (!content) return;

      if (storedEmbedding && storedEmbedding.length > 0) {
        const a = trimmedEmbedding;
        const b = storedEmbedding.slice(0, 128);
        const score = cosineSimilarity(a, b);
        if (score > 0.3) {
          scored.push({
            entry: { content, sourceUrl: data.sourceUrl || undefined },
            score,
          });
        }
      } else {
        scored.push({
          entry: { content, sourceUrl: data.sourceUrl || undefined },
          score: 0,
        });
      }
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.entry);
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
