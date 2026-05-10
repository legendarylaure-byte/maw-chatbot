const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

export async function getVoices() {
  if (!API_KEY) return [];
  const res = await fetch(`${BASE_URL}/voices`, {
    headers: { "xi-api-key": API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.voices || [];
}

export async function generateSpeech(
  text: string,
  voiceId: string,
  options?: { stability?: number; similarityBoost?: number }
): Promise<ArrayBuffer | null> {
  if (!API_KEY || !voiceId) return null;

  const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_v3",
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
      },
    }),
  });

  if (!res.ok) return null;
  return res.arrayBuffer();
}
