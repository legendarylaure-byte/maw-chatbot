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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "memory";

  try {
    switch (type) {
      case "memory": {
        const snapshot = await adminDb.collection("memory").orderBy("createdAt", "desc").limit(100).get();
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ items });
      }
      case "crawled": {
        const snapshot = await adminDb.collection("crawled_pages").orderBy("crawledAt", "desc").limit(100).get();
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ items });
      }
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, collection, data, id } = body;

    if (!action || !collection) {
      return NextResponse.json({ error: "action and collection required" }, { status: 400 });
    }

    const colRef = adminDb.collection(collection);

    switch (action) {
      case "create": {
        const doc = await colRef.add({
          ...data,
          createdBy: admin.uid,
          createdAt: new Date().toISOString(),
        });
        return NextResponse.json({ id: doc.id });
      }
      case "update": {
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await colRef.doc(id).update({
          ...data,
          updatedAt: new Date().toISOString(),
        });
        return NextResponse.json({ success: true });
      }
      case "delete": {
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await colRef.doc(id).delete();
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
