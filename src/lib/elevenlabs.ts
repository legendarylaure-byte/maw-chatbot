const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

export async function getVoices() {
  if (!API_KEY) {
    console.error("ElevenLabs API key is not configured");
    return [];
  }
  const res = await fetch(`${BASE_URL}/voices`, {
    headers: { "xi-api-key": API_KEY },
  });
  if (!res.ok) {
    console.error(`ElevenLabs getVoices failed: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return data.voices || [];
}

export async function generateSpeech(
  text: string,
  voiceId: string,
  options?: { stability?: number; similarityBoost?: number; style?: number; useSpeakerBoost?: boolean; streaming?: boolean }
): Promise<ArrayBuffer | ReadableStream | null> {
  if (!API_KEY || !voiceId) return null;

  const body: Record<string, unknown> = {
    text,
    model_id: "eleven_v3",
    voice_settings: {
      stability: options?.stability ?? 0.35,
      similarity_boost: options?.similarityBoost ?? 0.7,
      style: options?.style ?? 0.3,
      use_speaker_boost: options?.useSpeakerBoost ?? true,
    },
  };

  if (options?.streaming) {
    body.streaming = true;
    body.optimize_streaming_latency = 0;
  }

  const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`ElevenLabs TTS failed: ${res.status} ${res.statusText} — ${errBody.slice(0, 200)}`);
    return null;
  }

  if (options?.streaming && res.body) {
    return res.body;
  }

  return res.arrayBuffer();
}
