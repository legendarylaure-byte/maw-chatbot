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
    const snapshot = await query.limit(15).get();

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
  } catch {
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
  } catch {
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
  } catch {}
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
  } catch {}
}
