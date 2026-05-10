import { summarizeText } from "@/lib/gemini";

export async function summarizePageContent(content: string, title: string): Promise<string> {
  try {
    const summary = await summarizeText(`${title}\n\n${content.slice(0, 15000)}`);
    return summary;
  } catch {
    return content.slice(0, 500);
  }
}
