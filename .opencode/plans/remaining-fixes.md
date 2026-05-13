# Remaining Fixes & Enhancements

## Q1: Auto-play + themeColor

### 1a: Fix auto-play firing on empty streaming message
**File**: `src/app/page.tsx`

Change the auto-play `useEffect` to wait for actual content:
```typescript
useEffect(() => {
  if (isLoading || showWelcome) return;
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== "assistant") return;
  // Skip empty messages (streaming hasn't delivered content yet)
  if (!lastMsg.content) return;
  const msgIndex = messages.length - 1;
  if (msgIndex <= lastAutoPlayedRef.current) return;
  lastAutoPlayedRef.current = msgIndex;
  const lang = language === "np" ? "ne-NP" : "en-US";
  playAudio(lastMsg.content, selectedVoice || undefined, lang, playbackSpeed);
}, [messages, isLoading, showWelcome, language, selectedVoice, playAudio, playbackSpeed]);
```

**File**: `src/hooks/useChat.ts`

Fix the stale closure with `messages.length` — use a ref for the message index:
```typescript
const msgIndexRef = useRef(0);

// Inside sendMessage, before the streaming loop:
const msgIndex = msgIndexRef.current;
msgIndexRef.current += 1;
```

### 1b: Dynamic themeColor for dark mode
**File**: `src/app/layout.tsx`

Export a dynamic viewport or use a `<meta>` tag update via JS.

**Option A** (simpler): Remove the static `themeColor` from `layout.tsx` and manage it in `page.tsx` alongside the dark mode toggle:
```tsx
useEffect(() => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", darkMode ? "#0A0A1A" : "#F5F2FF");
  }
}, [darkMode]);
```

**Option B**: Add a `<meta name="theme-color">` tag dynamically.

## Q2: UX Polish Pack

### 2a: Auto-play toggle
**File**: `src/app/page.tsx`

Add `autoPlayEnabled` state (default `true`), pass to Navbar and auto-play effect:
```typescript
const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
```

Update auto-play effect to check: `if (!autoPlayEnabled) return;`

**File**: `src/components/shared/Navbar.tsx`

Add auto-play toggle button (Volume2 with a slash/check):
```tsx
interface NavbarProps {
  autoPlayEnabled?: boolean;
  onAutoPlayToggle?: () => void;
}
```

Add button near speed controls:
```tsx
<button
  onClick={onAutoPlayToggle}
  className={`p-1.5 rounded text-[10px] transition ${
    autoPlayEnabled ? "text-[var(--color-maw-magenta)]" : "text-[var(--text-muted)]"
  }`}
  title={autoPlayEnabled ? "Auto-play on" : "Auto-play off"}
>
  <Volume2 size={12} />
</button>
```

### 2b: TTS loading indicator
**File**: `src/hooks/useVoice.ts`

Add `isLoading` state for TTS:
```typescript
const [ttsLoading, setTtsLoading] = useState(false);

// In playAudio before ElevenLabs fetch:
setTtsLoading(true);

// On success/error:
setTtsLoading(false);
```

Return `ttsLoading`:
```typescript
return { isListening, isPlaying, ttsLoading, transcript, startListening, stopListening, playAudio, stopAudio };
```

**File**: `src/components/shared/Navbar.tsx`

Show a subtle loading spinner when `ttsLoading` is true (next to stop button).

**File**: `src/app/page.tsx`
Pass `ttsLoading` to Navbar.

### 2c: Filter voices by language in VoiceSelector
**File**: `src/components/chat/VoiceSelector.tsx`

ElevenLabs voices have labels like `{ accent: "indian", language: "hi" }`. Filter based on current language:
```typescript
const filteredVoices = currentLanguage === "np"
  ? voices.filter(v => 
      v.labels?.accent === "indian" || 
      v.name.toLowerCase().includes("nepali") ||
      v.name.toLowerCase().includes("hindi") ||
      v.name.toLowerCase().includes("indian")
    )
  : voices;

// If filtered is empty, show all voices as fallback
const displayVoices = filteredVoices.length > 0 ? filteredVoices : voices;
```

### 2d: Speed icon tooltips
**File**: `src/components/shared/Navbar.tsx`

Already has `title` attribute on each speed button. Add a small label below icons showing the speed value:
```tsx
<button title={`Speed: ${speed}x`}>
  <SpeedIcon speed={speed} current={playbackSpeed} />
  <span className="text-[8px] opacity-60">{speed}x</span>
</button>
```

## Q3: Performance Pack

### 3a: TTS caching
**File**: `src/hooks/useVoice.ts`

Add a simple LRU cache:
```typescript
const ttsCacheRef = useRef<Map<string, string>>(new Map());
const CACHE_MAX = 20;

// Before ElevenLabs fetch:
const cacheKey = `${voiceId}:${cleanText.slice(0, 100)}`;
const cached = ttsCacheRef.current.get(cacheKey);
if (cached) {
  const audio = new Audio(cached);
  audio.playbackRate = speed;
  audioRef.current = audio;
  setIsPlaying(true);
  audio.play();
  return;
}

// After getting blob URL, cache it:
if (ttsCacheRef.current.size >= CACHE_MAX) {
  const firstKey = ttsCacheRef.current.keys().next().value;
  if (firstKey) ttsCacheRef.current.delete(firstKey);
}
ttsCacheRef.current.set(cacheKey, url);
```

### 3b: Timeout on streaming fetch
**File**: `src/hooks/useChat.ts`

Add AbortController with 30s timeout:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const res = await fetch("/api/chat", {
    signal: controller.signal,
    // ... existing options
  });
  // ... streaming loop
} catch (err) {
  if (err.name === "AbortError") {
    // Handle timeout
  }
} finally {
  clearTimeout(timeout);
}
```

### 3c: Firestore vector search
**File**: `src/lib/memory.ts`

Replace in-memory cosine similarity with Firestore `FindNearest`:
```typescript
import { FieldValue } from "firebase-admin/firestore";

export async function searchKnowledge(query: string, language: string = "en", limit: number = 3): Promise<KnowledgeEntry[]> {
  try {
    const { getEmbedding } = await import("@/lib/gemini");
    const queryEmbedding = await getEmbedding(query);

    // Firestore FindNearest vector search (available in firebase-admin v13+)
    const snapshot = await adminDb.collection("memory")
      .findNearest("embedding", queryEmbedding, {
        limit,
        distanceMeasure: "COSINE",
      })
      .where("active", "==", true)
      .get();

    const entries: KnowledgeEntry[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const content = data.content?.[language] || data.content?.en;
      if (content) {
        entries.push({ content, sourceUrl: data.sourceUrl || undefined });
      }
    });
    return entries;
  } catch {
    // Fallback to in-memory search
    return fallbackSearch(query, language, limit);
  }
}
```

## File Change Summary

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Auto-play skip empty content, autoPlayEnabled state, ttsLoading passthrough, themeColor meta tag |
| `src/app/layout.tsx` | Remove static themeColor from viewport export |
| `src/hooks/useChat.ts` | msgIndexRef for streaming, AbortController with 30s timeout |
| `src/hooks/useVoice.ts` | ttsLoading state, TTS LRU cache (20 entries), expose ttsLoading in return |
| `src/components/shared/Navbar.tsx` | Auto-play toggle button, TTS loading spinner, speed value labels |
| `src/components/chat/VoiceSelector.tsx` | Filter voices by language (Nepali vs English) |
| `src/lib/memory.ts` | Firestore FindNearest vector search with fallback |
