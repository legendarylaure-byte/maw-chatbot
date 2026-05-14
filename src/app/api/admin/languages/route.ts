import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAdmin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doc = await adminDb.collection("admin_settings").doc("languages").get();
    const languages = doc.exists ? doc.data()?.languages : null;
    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Languages API error:", error);
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { languages } = body;
    if (!languages) {
      return NextResponse.json({ error: "languages required" }, { status: 400 });
    }

    await adminDb.collection("admin_settings").doc("languages").set({ languages }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Languages API error:", error);
    return NextResponse.json({ error: "Failed to save languages" }, { status: 500 });
  }
}
