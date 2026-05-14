export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/sanitizer";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const ip = forwarded.split(",")[0].trim();
  const rateLimitKey = getRateLimitKey(ip, "feedback");
  const rateCheck = await checkRateLimit(rateLimitKey, { maxRequests: 60, windowMinutes: 1 });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateCheck.resetIn) } }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body?.messageId || !body?.rating) {
      return NextResponse.json({ error: "messageId and rating required" }, { status: 400 });
    }

    const rating = body.rating;
    if (rating !== "up" && rating !== "down") {
      return NextResponse.json({ error: "rating must be 'up' or 'down'" }, { status: 400 });
    }

    await adminDb.collection("feedback").add({
      messageId: sanitizeInput(body.messageId),
      rating,
      comment: body.comment ? sanitizeInput(body.comment, 500) : "",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
