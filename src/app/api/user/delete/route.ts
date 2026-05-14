import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Delete user's conversations
    const conversations = await adminDb.collection("conversations").where("userId", "==", userId).get();
    const batch = adminDb.batch();
    conversations.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete user's memories
    const memories = await adminDb.collection("user_memory").where("userId", "==", userId).get();
    memories.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete user's feedback
    const feedback = await adminDb.collection("feedback").where("userId", "==", userId).get();
    feedback.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete user's game scores
    const scores = await adminDb.collection("game_scores").where("userId", "==", userId).get();
    scores.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete user's streaks
    const streaks = await adminDb.collection("streaks").where("userId", "==", userId).get();
    streaks.docs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    // Delete the user document itself
    await adminDb.collection("users").doc(userId).delete();

    return NextResponse.json({ success: true, message: "All user data deleted." });
  } catch {
    return NextResponse.json({ error: "Invalid token or deletion failed" }, { status: 401 });
  }
}
