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

STRUCTURED DATA:
- When providing information about jobs, locations, products, or services, include a JSON code block with structured data
- Job listings: \`\`\`json {"type":"job","title":"...","description":"...","meta":{"department":"...","location":"..."}}\`\`\`
- Office locations: \`\`\`json {"type":"location","title":"...","description":"...","meta":{"phone":"...","hours":"..."}}\`\`\`
- Products: \`\`\`json {"type":"product","title":"...","description":"...","meta":{"brand":"...","price":"..."}}\`\`\`
- You can include multiple items as an array: \`\`\`json [{"type":"job","title":"..."},...]\`\`\`

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
    model: "gemini-2.5-flash",
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

export function isErrorMessage(text: string): boolean {
  const errorPatterns = [
    /api.key/i, /quota/i, /rate.limit/i, /not.found/i, /unavailable/i,
    /resting/i, /shut.down/i, /denied/i, /forbidden/i, /blocked/i,
    /overloaded/i, /capacity/i, /maintenance/i, /cannot/i,
  ];
  return errorPatterns.some((p) => p.test(text)) && text.length < 120;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  contextKnowledge?: string
): Promise<string> {
  const m = getModel();
  const trimmed = messages.length > 20 ? messages.slice(-20) : messages;
  const history = trimmed.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = trimmed[trimmed.length - 1];

  let knowledgeContext = "";
  if (contextKnowledge) {
    knowledgeContext = `\n\nRelevant context:\n${contextKnowledge}`;
  }

  const chat = m.startChat({ history });

  const result = await chat.sendMessage(
    `${lastMessage.content}${knowledgeContext}\n\nRemember: Be positive, humble, and professional!`
  );

  const text = result.response.text();

  if (isErrorMessage(text)) {
    console.error("Gemini returned an error-like response:", text);
    throw new Error("Gemini API returned an unexpected response");
  }

  return text;
}

export async function generateChatResponseStream(
  messages: ChatMessage[],
  contextKnowledge?: string
): Promise<ReadableStream<string>> {
  const m = getModel();
  const trimmed = messages.length > 20 ? messages.slice(-20) : messages;
  const history = trimmed.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = trimmed[trimmed.length - 1];

  let knowledgeContext = "";
  if (contextKnowledge) {
    knowledgeContext = `\n\nRelevant context:\n${contextKnowledge}`;
  }

  const chat = m.startChat({ history });

  const result = await chat.sendMessageStream(
    `${lastMessage.content}${knowledgeContext}\n\nRemember: Be positive, humble, and professional!`
  );

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(text);
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text.slice(0, 3000));
  return result.embedding.values;
}

export async function summarizeText(text: string): Promise<string> {
  const m = getModel();
  const result = await m.generateContent(
    `Summarize the following content in 3-5 concise bullet points. Capture key facts only:\n\n${text.slice(0, 15000)}`
  );
  return result.response.text();
}
