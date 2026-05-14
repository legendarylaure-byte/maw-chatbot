import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  const accent = request.nextUrl.searchParams.get("accent") || "indian";
  const pageSize = request.nextUrl.searchParams.get("pageSize") || "10";

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/shared-voices?accent=${encodeURIComponent(accent)}&page_size=${pageSize}`,
      { headers: { "xi-api-key": API_KEY } }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`ElevenLabs shared-voices failed: ${res.status} ${err.slice(0, 200)}`);
      return NextResponse.json({ voices: [], error: "Failed to fetch shared voices" }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json({ voices: data.voices || [] });
  } catch (e) {
    console.error("Shared voices fetch error:", e);
    return NextResponse.json({ voices: [], error: "Internal error" }, { status: 500 });
  }
}
