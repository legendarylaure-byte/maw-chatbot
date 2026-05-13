# Voice & Chatbot Enhancement Plan

## Phase 1a: Switch to `eleven_multilingual_v3` + Optimize Settings

**File**: `src/lib/elevenlabs.ts`

Replace `generateSpeech`:

```typescript
export async function generateSpeech(
  text: string,
  voiceId: string,
  options?: { stability?: number; similarityBoost?: number; style?: number; useSpeakerBoost?: boolean; streaming?: boolean }
): Promise<ArrayBuffer | ReadableStream | null> {
  if (!API_KEY || !voiceId) return null;

  const body: Record<string, unknown> = {
    text,
    model_id: "eleven_multilingual_v3",
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
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  if (options?.streaming && res.body) return res.body;
  return res.arrayBuffer();
}
```

**File**: `src/app/api/tts/route.ts`

Update the route to accept `style`, `useSpeakerBoost`, `streaming` from the request body and pass them to `generateSpeech`. When `streaming` is true, return `new Response(audioStream, { headers: { "Content-Type": "audio/mpeg" } })` instead of `new NextResponse(audio, ...)`.

---

## Phase 1b: Streaming TTS Playback

**File**: `src/hooks/useVoice.ts`

Replace the ElevenLabs audio playback section with MediaSource-based streaming:

```typescript
// In playAudio, when voiceId is set and streaming:
if (voiceId) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId, streaming: true, style: 0.3, useSpeakerBoost: true }),
    });
    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const mediaSource = new MediaSource();
      const audioUrl = URL.createObjectURL(mediaSource);
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audioRef.current = audio;

      mediaSource.addEventListener("sourceopen", async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        setIsPlaying(true);
        audio.play();

        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            mediaSource.endOfStream();
            return;
          }
          await new Promise(resolve => {
            sourceBuffer.addEventListener('updateend', resolve, { once: true });
            sourceBuffer.appendBuffer(value);
          });
          pump();
        };
        pump();
      });

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      return;
    }
  } catch {}
}
```

---

## Phase 4a: Strip Emojis from TTS + Auto-Detect Language

**File**: `src/hooks/useVoice.ts`

In `playAudio`, strip emojis before sending to TTS:

```typescript
const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
```

**File**: `src/hooks/useChat.ts` (or `page.tsx`)

Auto-detect language from user input:

```typescript
const detectLanguage = (text: string): "en" | "np" => {
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text) ? "np" : "en";
};
```

Call this in `sendMessage` before sending to the API.

---

## Phase 3d: Rich Cards for Structured Data

**File**: `src/components/chat/ChatBubble.tsx`

Add card rendering for structured data patterns:

```tsx
interface RichCard {
  type: "job" | "location" | "product" | "service";
  title: string;
  description: string;
  image?: string;
  link?: string;
  meta?: Record<string, string>;
}

function extractCards(content: string): { cards: RichCard[]; text: string } {
  // Look for JSON blocks in markdown:
  const jsonRegex = /```json\n([\s\S]*?)```/g;
  const cards: RichCard[] = [];
  let cleaned = content;
  let match;
  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) cards.push(...data);
      else cards.push(data);
      cleaned = cleaned.replace(match[0], "");
    } catch {}
  }
  return { cards, text: cleaned.trim() };
}
```

Render cards below the bot message text using the existing glassmorphism card style.

---

## Phase 3a: Streaming Gemini Responses

**File**: `src/app/api/chat/route.ts`

Replace `model.generateContent()` with `model.generateContentStream()`:

```typescript
const result = await model.generateContentStream({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
});

const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ text }) + "\n"));
      }
    }
    controller.close();
  },
});

return new Response(stream, {
  headers: { "Content-Type": "text/event-stream" },
});
```

**File**: `src/hooks/useChat.ts`

Update `sendMessage` to use streaming fetch:

```typescript
const sendMessage = async (text: string) => {
  // Add user message
  addMessage({ role: "user", content: text });

  // Add placeholder bot message
  const botIndex = messages.length + 1;
  setMessages(prev => [...prev, { role: "assistant", content: "" }]);

  const res = await fetch("/api/chat", { ... });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let botText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const { text } = JSON.parse(line);
        botText += text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: botText };
          return updated;
        });
      } catch {}
    }
  }
};
```

---

## Phase 3b: Conversation Memory

**File**: `src/app/api/memory/route.ts`

Add GET endpoint returning recent conversation history for the authenticated user.
Add POST endpoint saving conversation pairs.

**File**: `src/hooks/useChat.ts`

On mount, fetch recent conversations from `/api/memory?type=conversations`.
Include previous messages as context in each API call (within token limits).

**File**: `src/lib/memory.ts`

Add `getConversations(userId)` and `saveConversation(userId, messages)` using Firestore.

---

## Phase 3c: RAG Semantic Search

**File**: `src/lib/gemini.ts`

Add embedding function:
```typescript
export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
```

**File**: `src/lib/memory.ts`

Store embeddings alongside crawled content in Firestore.
Add `searchSimilar(query: string, limit: number)` function:
1. Compute embedding of query
2. Use Firestore `FindNearest` vector search
3. Return top-N matching documents

**File**: `src/app/api/chat/route.ts`

Before calling Gemini, search for relevant context:
```typescript
const relevantDocs = await searchSimilar(userMessage, 3);
const context = relevantDocs.map(d => d.content).join("\n\n");
const prompt = `Context:\n${context}\n\nUser: ${userMessage}`;
```

---

## Summary of All File Changes

| File | Change |
|------|--------|
| `src/lib/elevenlabs.ts` | Switch to `eleven_multilingual_v3`, add style/speakerBoost/streaming params |
| `src/app/api/tts/route.ts` | Accept new params, return streaming response when requested |
| `src/hooks/useVoice.ts` | MediaSource streaming playback, emoji stripping |
| `src/hooks/useChat.ts` | Streaming Gemini fetch, conversation memory, auto-detect language |
| `src/app/api/chat/route.ts` | Gemini `generateContentStream`, RAG context injection |
| `src/app/api/memory/route.ts` | GET/POST for conversation history |
| `src/lib/memory.ts` | Vector search, conversation CRUD |
| `src/lib/gemini.ts` | Embedding API client |
| `src/components/chat/ChatBubble.tsx` | Rich card rendering |
| `src/app/page.tsx` | Wire new hooks/props |
