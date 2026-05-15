"use server";

import { getVoices } from "./voices";

const API_KEY = process.env.GOOGLE_CLOUD_TTS_API_KEY;
const BASE = "https://texttospeech.googleapis.com/v1/text:synthesize";

function getLangForVoice(voiceId: string): string {
  const v = getVoices().find((x) => x.voice_id === voiceId);
  return v?.language || "en-IN";
}

function getGenderForVoice(voiceId: string): "MALE" | "FEMALE" {
  const v = getVoices().find((x) => x.voice_id === voiceId);
  return v?.gender === "female" ? "FEMALE" : "MALE";
}

export async function generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  if (!API_KEY) {
    console.error("GOOGLE_CLOUD_TTS_API_KEY not configured");
    return null;
  }

  try {
    const res = await fetch(`${BASE}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: getLangForVoice(voiceId),
          name: voiceId,
          ssmlGender: getGenderForVoice(voiceId),
        },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`Google TTS failed (${res.status}): ${err.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    if (!data.audioContent) return null;

    const buf = Buffer.from(data.audioContent, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch (e) {
    console.error("Google TTS error:", e);
    return null;
  }
}
