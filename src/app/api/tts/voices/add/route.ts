import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  let body: { voice_id?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.voice_id) {
    return NextResponse.json({ error: "voice_id required" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add-from-library", {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_user_id: body.voice_id,
        voice_id: body.voice_id,
        new_name: body.name || body.voice_id,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`ElevenLabs add-voice failed: ${res.status} ${err.slice(0, 200)}`);
      return NextResponse.json(
        { error: `Failed to add voice (${res.status})` },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ voice_id: data.voice_id, name: data.name || body.name });
  } catch (e) {
    console.error("Add voice error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
