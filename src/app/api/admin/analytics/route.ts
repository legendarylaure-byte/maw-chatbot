import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role === "admin") return decoded;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [memorySnap, convSnap, feedbackSnap, gamesSnap] = await Promise.all([
      adminDb.collection("memory").count().get(),
      adminDb.collection("conversations").count().get(),
      adminDb.collection("feedback").count().get(),
      adminDb.collection("game_scores").count().get(),
    ]);

    return NextResponse.json({
      memoryEntries: memorySnap.data().count,
      conversations: convSnap.data().count,
      feedbackCount: feedbackSnap.data().count,
      gamesPlayed: gamesSnap.data().count,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
