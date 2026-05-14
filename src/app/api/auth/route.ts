import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const ip = forwarded.split(",")[0].trim();
    const rateCheck = await checkRateLimit(getRateLimitKey(ip), RATE_LIMITS.AUTH);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const { idToken } = body || {};

    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const isAdmin = decoded.role === "admin";

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      isAdmin,
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
