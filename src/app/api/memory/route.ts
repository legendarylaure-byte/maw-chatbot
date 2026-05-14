import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const ip = forwarded.split(",")[0].trim();
  const rateLimitKey = getRateLimitKey(ip, "memory");
  const rateCheck = await checkRateLimit(rateLimitKey, { maxRequests: 30, windowMinutes: 1 });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateCheck.resetIn) } }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const snapshot = await adminDb
      .collection("user_memory")
      .where("userId", "==", userId)
      .orderBy("confidence", "desc")
      .limit(20)
      .get();

    const facts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ facts });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
