import { NextRequest, NextResponse } from "next/server";
import { generateSpeech } from "@/lib/elevenlabs";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const ip = forwarded.split(",")[0].trim();
  const rateLimitKey = getRateLimitKey(ip, "tts");
  const rateCheck = await checkRateLimit(rateLimitKey, { maxRequests: 20, windowMinutes: 1 });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateCheck.resetIn) } }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body?.text || !body?.voiceId) {
      return NextResponse.json({ error: "text and voiceId required" }, { status: 400 });
    }

    const audio = await generateSpeech(body.text, body.voiceId, {
      stability: body.stability,
      similarityBoost: body.similarityBoost,
      style: body.style,
      useSpeakerBoost: body.useSpeakerBoost,
      streaming: body.streaming,
    });

    if (!audio) {
      return NextResponse.json(
        { error: "Voice generation failed. Check ElevenLabs configuration." },
        { status: 500 }
      );
    }

    if (audio instanceof ReadableStream) {
      return new NextResponse(audio, {
        headers: { "Content-Type": "audio/mpeg" },
      });
    }

    const arrayBuffer = audio as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(arrayBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
