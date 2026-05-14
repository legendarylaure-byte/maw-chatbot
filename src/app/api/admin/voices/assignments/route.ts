import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const doc = await adminDb.collection("admin_settings").doc("voices").get();
    if (!doc.exists) {
      return NextResponse.json({ assignments: {} });
    }
    return NextResponse.json({ assignments: doc.data()?.assignments || {} });
  } catch (e) {
    console.error("Failed to fetch voice assignments:", e);
    return NextResponse.json({ assignments: {} });
  }
}
