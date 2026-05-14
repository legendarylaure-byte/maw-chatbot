import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const setupDoc = await adminDb.collection("config").doc("admin-setup").get();
    const completed = setupDoc.exists && setupDoc.data()?.completed === true;
    return NextResponse.json({ completed });
  } catch {
    return NextResponse.json({ error: "Failed to check setup status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { idToken } = body || {};

    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    const setupDoc = await adminDb.collection("config").doc("admin-setup").get();
    if (setupDoc.exists && setupDoc.data()?.completed) {
      return NextResponse.json({ error: "Admin setup already completed" }, { status: 403 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);

    await adminAuth.setCustomUserClaims(decoded.uid, { role: "admin" });

    await adminDb.collection("config").doc("admin-setup").set({
      completed: true,
      setupBy: decoded.uid,
      setupAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid: decoded.uid });
  } catch {
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
