#!/usr/bin/env node

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });

const db = getFirestore(app);

async function getEmbedding(text: string): Promise<number[]> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text.slice(0, 3000));
  return result.embedding.values;
}

async function main() {
  console.log("Scanning memory entries for missing embeddings...\n");

  const snapshot = await db.collection("memory").get();
  const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));

  const needsEmbedding = docs.filter((d) => {
    const emb = d.data.embedding;
    return !emb || !Array.isArray(emb) || emb.length === 0;
  });

  console.log(`Found ${docs.length} total memory entries.`);
  console.log(`${needsEmbedding.length} entries need embeddings.\n`);

  if (needsEmbedding.length === 0) {
    console.log("All entries already have embeddings. Nothing to do.");
    process.exit(0);
  }

  let updated = 0;
  let failed = 0;

  for (const doc of needsEmbedding) {
    const data = doc.data;
    const content = data.content?.en || data.content || "";
    const keywords = data.keywords || [];
    const text = `${content}\n${keywords.join(", ")}`.slice(0, 3000);

    if (!text.trim()) {
      console.warn(`  ⚠ Skipping ${doc.id} — no content found`);
      continue;
    }

    try {
      const embedding = await getEmbedding(text);
      await db.collection("memory").doc(doc.id).update({ embedding });
      console.log(`  ✓ Updated: ${content.split("\n")[0].slice(0, 60)}...`);
      updated++;
    } catch (e) {
      console.error(`  ✗ Failed for ${doc.id}:`, e);
      failed++;
    }

    if (updated % 5 === 0) {
      console.log(`  Progress: ${updated}/${needsEmbedding.length}`);
    }
  }

  console.log(`\nDone! ${updated} entries updated, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
