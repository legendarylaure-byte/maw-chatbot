import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/gemini";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { validateMessageBody } from "@/lib/sanitizer";
import { RATE_LIMITS } from "@/lib/constants";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { getBotKnowledge, getUserMemory, saveUserMemory, saveConversation } from "@/lib/memory";

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const ip = forwarded.split(",")[0].trim();

    let userId: string | undefined;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
      } catch {}
    }

    const rateLimitKey = getRateLimitKey(ip, userId);
    const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.CHAT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rateCheck.resetIn) } }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = validateMessageBody(body);
    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { message, language: lang } = validation.sanitized;
    const language = lang || "en";

    // Inject bot knowledge + user memory into context
    let contextKnowledge = "";
    try {
      const botKnowledge = await getBotKnowledge(language);
      if (botKnowledge.length > 0) {
        contextKnowledge = botKnowledge
          .map((entry) => {
            const source = entry.sourceUrl ? ` [Source: ${entry.sourceUrl}]` : "";
            return `- ${entry.content}${source}`;
          })
          .join("\n");
      }

      if (userId) {
        const userMemory = await getUserMemory(userId);
        if (userMemory.length > 0) {
          contextKnowledge += "\n\nUser info:\n" + userMemory.join("\n");
        }

        // Learn from this message
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("my name is") || lowerMsg.includes("i am ") || lowerMsg.includes("i'm ")) {
          const nameMatch = message.match(/(?:my name is|i am|i'm)\s+(\w+)/i);
          if (nameMatch) {
            await saveUserMemory(userId, `User's name is ${nameMatch[1]}`, 0.9);
          }
        }
        if (lowerMsg.includes("i like") || lowerMsg.includes("i love") || lowerMsg.includes("i prefer")) {
          const prefMatch = message.match(/(?:i like|i love|i prefer)\s+(.+)/i);
          if (prefMatch) {
            await saveUserMemory(userId, `User likes ${prefMatch[1]}`, 0.6);
          }
        }
        if (lowerMsg.includes("i don't like") || lowerMsg.includes("i hate")) {
          const dislikeMatch = message.match(/(?:i don't like|i hate)\s+(.+)/i);
          if (dislikeMatch) {
            await saveUserMemory(userId, `User dislikes ${dislikeMatch[1]}`, 0.6);
          }
        }
      }
    } catch {}

    const messages = [{ role: "user" as const, content: message }];
    const response = await generateChatResponse(messages, contextKnowledge);

    // Save conversation for authenticated users
    if (userId) {
      try {
        await saveConversation(userId, [
          { role: "user", content: message },
          { role: "assistant", content: response },
        ], language);
      } catch {}
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
