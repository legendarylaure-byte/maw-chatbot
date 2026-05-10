#!/usr/bin/env node

/**
 * Security scanner — checks for hardcoded secrets
 * Run: npx tsx scripts/security-scan.ts
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");

const patterns = [
  { name: "Gemini API Key", regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Firebase API Key", regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Private Key", regex: /-----BEGIN (RSA )?PRIVATE KEY-----/ },
  { name: "Generic Secret", regex: /(?:secret|password|token|apikey|api_key)\s*[:=]\s*['"][^'"]{8,}['"]/i },
  { name: "JWT Secret", regex: /jwt_secret|JWT_SECRET|secret_key|SECRET_KEY/i },
  { name: "npm token", regex: /npm_[A-Za-z0-9]{36,}/ },
];

const excludeDirs = ["node_modules", ".next", "out", ".git", "temp"];

function scanFile(filePath: string): { line: number; match: string; pattern: string }[] {
  const results: { line: number; match: string; pattern: string }[] = [];
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          results.push({
            line: index + 1,
            match: line.trim().slice(0, 80),
            pattern: pattern.name,
          });
        }
      }
    });
  } catch {}
  return results;
}

function scanDirectory(dir: string): { file: string; findings: { line: number; match: string; pattern: string }[] }[] {
  const results: { file: string; findings: { line: number; match: string; pattern: string }[] }[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          results.push(...scanDirectory(fullPath));
        }
      } else if (
        entry.isFile() &&
        /\.(ts|tsx|js|jsx|json|env|yml|yaml|md|txt|css)$/i.test(entry.name)
      ) {
        const findings = scanFile(fullPath);
        if (findings.length > 0) {
          results.push({ file: fullPath.replace(ROOT, "."), findings });
        }
      }
    }
  } catch {}
  return results;
}

console.log("🔍 MAWbot Security Scanner\n");
console.log(`Scanning ${ROOT}...\n`);

const results = scanDirectory(ROOT);

if (results.length === 0) {
  console.log("✅ No potential secrets found in scanned files!");
} else {
  console.log(`⚠️  Found ${results.length} file(s) with potential secrets:\n`);
  for (const { file, findings } of results) {
    console.log(`  📄 ${file}`);
    for (const f of findings) {
      console.log(`     Line ${f.line}: [${f.pattern}] ${f.match}`);
    }
    console.log();
  }
  console.log("Action: Review each finding. If legitimate, add to .env.local and remove from source.");
}
