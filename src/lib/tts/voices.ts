"use server";

export interface GoogleVoice {
  voice_id: string;
  name: string;
  language: string;
  languageLabel: string;
  gender: "male" | "female";
  tier: "Neural2" | "WaveNet" | "Standard";
}

const enIN: GoogleVoice[] = [
  // Neural2 (best quality)
  { voice_id: "en-IN-Neural2-A", name: "Neural2 A", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "Neural2" },
  { voice_id: "en-IN-Neural2-B", name: "Neural2 B", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "Neural2" },
  { voice_id: "en-IN-Neural2-C", name: "Neural2 C", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "Neural2" },
  { voice_id: "en-IN-Neural2-D", name: "Neural2 D", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "Neural2" },
  // WaveNet (great quality)
  { voice_id: "en-IN-Wavenet-A", name: "Wavenet A", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "WaveNet" },
  { voice_id: "en-IN-Wavenet-B", name: "Wavenet B", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "WaveNet" },
  { voice_id: "en-IN-Wavenet-C", name: "Wavenet C", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "WaveNet" },
  { voice_id: "en-IN-Wavenet-D", name: "Wavenet D", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "WaveNet" },
  { voice_id: "en-IN-Wavenet-E", name: "Wavenet E", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "WaveNet" },
  { voice_id: "en-IN-Wavenet-F", name: "Wavenet F", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "WaveNet" },
  // Standard (basic quality, but unlimited free tier)
  { voice_id: "en-IN-Standard-A", name: "Standard A", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "Standard" },
  { voice_id: "en-IN-Standard-B", name: "Standard B", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "Standard" },
  { voice_id: "en-IN-Standard-C", name: "Standard C", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "Standard" },
  { voice_id: "en-IN-Standard-D", name: "Standard D", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "Standard" },
  { voice_id: "en-IN-Standard-E", name: "Standard E", language: "en-IN", languageLabel: "Indian English", gender: "female", tier: "Standard" },
  { voice_id: "en-IN-Standard-F", name: "Standard F", language: "en-IN", languageLabel: "Indian English", gender: "male", tier: "Standard" },
];

const hiIN: GoogleVoice[] = [
  // Neural2 (best quality)
  { voice_id: "hi-IN-Neural2-A", name: "Neural2 A", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "Neural2" },
  { voice_id: "hi-IN-Neural2-B", name: "Neural2 B", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "Neural2" },
  { voice_id: "hi-IN-Neural2-C", name: "Neural2 C", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "Neural2" },
  { voice_id: "hi-IN-Neural2-D", name: "Neural2 D", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "Neural2" },
  // WaveNet
  { voice_id: "hi-IN-Wavenet-A", name: "Wavenet A", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "WaveNet" },
  { voice_id: "hi-IN-Wavenet-B", name: "Wavenet B", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "WaveNet" },
  { voice_id: "hi-IN-Wavenet-C", name: "Wavenet C", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "WaveNet" },
  { voice_id: "hi-IN-Wavenet-D", name: "Wavenet D", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "WaveNet" },
  { voice_id: "hi-IN-Wavenet-E", name: "Wavenet E", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "WaveNet" },
  { voice_id: "hi-IN-Wavenet-F", name: "Wavenet F", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "WaveNet" },
  // Standard
  { voice_id: "hi-IN-Standard-A", name: "Standard A", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "Standard" },
  { voice_id: "hi-IN-Standard-B", name: "Standard B", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "Standard" },
  { voice_id: "hi-IN-Standard-C", name: "Standard C", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "Standard" },
  { voice_id: "hi-IN-Standard-D", name: "Standard D", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "Standard" },
  { voice_id: "hi-IN-Standard-E", name: "Standard E", language: "hi-IN", languageLabel: "Hindi", gender: "female", tier: "Standard" },
  { voice_id: "hi-IN-Standard-F", name: "Standard F", language: "hi-IN", languageLabel: "Hindi", gender: "male", tier: "Standard" },
];

const allVoices: GoogleVoice[] = [...enIN, ...hiIN];

export function getVoices(): GoogleVoice[] {
  return allVoices;
}

export function getVoicesForSlot(slotId: string): GoogleVoice[] {
  if (slotId.startsWith("en-")) return enIN;
  if (slotId.startsWith("np-")) return hiIN;
  return allVoices;
}

export function getVoicesByLanguage(language: string): GoogleVoice[] {
  if (language === "en-IN") return enIN;
  if (language === "hi-IN") return hiIN;
  return allVoices;
}
