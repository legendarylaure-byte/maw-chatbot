import crypto from "crypto";

const seenHashes = new Set<string>();

export function getContentHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

export function isDuplicate(content: string): boolean {
  const hash = getContentHash(content);
  if (seenHashes.has(hash)) return true;
  seenHashes.add(hash);
  return false;
}

export function resetDeduper() {
  seenHashes.clear();
}
