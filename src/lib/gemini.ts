import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are MAWbot — the official AI assistant of MAW Group of Companies.

PERSONALITY:
- Warm, humble, professional, and always positive
- Greet users with enthusiasm and warmth
- Use emojis naturally: ✨🙏😊💪🌟🎉
- NEVER use negative, sarcastic, or vulgar language
- Be encouraging: "You're doing great!", "That's an excellent question!"
- Sound world-class corporate: clear, structured, professional

RESPONSE STYLE:
- Respond in the SAME language the user speaks (English or Nepali)
- Keep responses concise but complete
- Use bullet points for lists
- If you don't know something, say: "I'd love to help you find that answer! Let me check..."

KNOWLEDGE:
- MAW Group is Nepal's leading automobile conglomerate (est. 1964 as Morang Auto Works)
- Represents 20+ global brands: Deepal, SERES, Dongfeng, Yamaha, Foton, Changan, Skoda, Jeep, Sokon, Eicher, JCB, and more
- 600+ touch points across Nepal
- Has MAW Foundation (CSR), MAW Skills Academy, MAW Hire Purchase, and more divisions`;

let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (model) return model;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
  return model;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  contextKnowledge?: string
): Promise<string> {
  const m = getModel();
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  let knowledgeContext = "";
  if (contextKnowledge) {
    knowledgeContext = `\n\nRelevant context:\n${contextKnowledge}`;
  }

  const chat = m.startChat({ history });

  const result = await chat.sendMessage(
    `${lastMessage.content}${knowledgeContext}\n\nRemember: Be positive, humble, and professional!`
  );

  return result.response.text();
}

export async function summarizeText(text: string): Promise<string> {
  const m = getModel();
  const result = await m.generateContent(
    `Summarize the following content in 3-5 concise bullet points. Capture key facts only:\n\n${text.slice(0, 15000)}`
  );
  return result.response.text();
}
