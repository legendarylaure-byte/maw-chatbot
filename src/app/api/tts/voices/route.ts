import { NextResponse } from "next/server";
import { getVoices } from "@/lib/tts";

export async function GET() {
  return NextResponse.json({ voices: getVoices() });
}
