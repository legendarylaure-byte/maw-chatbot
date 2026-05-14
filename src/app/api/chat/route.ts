import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse, generateChatResponseStream } from "@/lib/gemini";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { validateMessageBody } from "@/lib/sanitizer";
import { RATE_LIMITS } from "@/lib/constants";
import { adminAuth } from "@/lib/firebase-admin";
import { getBotKnowledge, getUserMemory, saveUserMemory, saveConversation, searchKnowledge } from "@/lib/memory";

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
      } catch (e) { console.error("🔑 auth token verification failed:", e); }
    }

    const rateLimitKey = getRateLimitKey(ip, userId);
    const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.CHAT);
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
    const stream = body.stream === true;
    const history = body.history || [];
    const firstUserIdx = (history as { role: string }[]).findIndex((m) => m.role === "user");
    const chatHistory = firstUserIdx >= 0 ? history.slice(firstUserIdx) : [];

    // Inject bot knowledge + RAG search + user memory into context
    let contextKnowledge = "";
    try {
      const [botKnowledge, ragResults] = await Promise.all([
        getBotKnowledge(language),
        searchKnowledge(message, language, 3),
      ]);

      const knowledgeMap = new Map<string, boolean>();
      const allKnowledge = [...ragResults, ...botKnowledge];

      if (allKnowledge.length > 0) {
        contextKnowledge = allKnowledge
          .filter((entry) => {
            if (knowledgeMap.has(entry.content)) return false;
            knowledgeMap.set(entry.content, true);
            return true;
          })
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
    } catch (e) { console.error("📚 bot knowledge/memory fetch failed:", e); }

    const chatMessages = [
      ...(chatHistory as { role: "user" | "assistant"; content: string }[]),
      { role: "user" as const, content: message },
    ];

    // Streaming response
    if (stream) {
      const stream = await generateChatResponseStream(chatMessages, contextKnowledge);
      const encoder = new TextEncoder();

      const responseStream = new ReadableStream({
        async start(controller) {
          const chunks: string[] = [];
          const reader = stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`));
            }
            const fullResponse = chunks.join("");

            if (fullResponse) {
              const errPatterns = [/api.key/i, /quota/i, /rate.limit/i, /not.found/i, /unavailable/i,
                /resting/i, /shut.down/i, /denied/i, /forbidden/i, /blocked/i,
                /overloaded/i, /capacity/i, /maintenance/i, /cannot/i];
              const looksLikeError = errPatterns.some((p) => p.test(fullResponse)) && fullResponse.length < 120;
              if (looksLikeError) {
                console.error("⚠️ Gemini returned error-like streaming response:", fullResponse);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "I'm having trouble generating a response right now. Please try again." })}\n\n`));
                controller.close();
                return;
              }
            }

            // Save conversation for authenticated users
            if (userId) {
              try {
                await saveConversation(userId, [
                  { role: "user", content: message },
                  { role: "assistant", content: fullResponse },
                ], language);
              } catch (e) { console.error("💾 conversation save failed:", e); }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
            } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(responseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const response = await generateChatResponse(chatMessages, contextKnowledge);

    // Save conversation for authenticated users
    if (userId) {
      try {
        await saveConversation(userId, [
          { role: "user", content: message },
          { role: "assistant", content: response },
        ], language);
      } catch (e) { console.error("💾 conversation save failed:", e); }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
