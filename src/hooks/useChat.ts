"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function detectLanguage(text: string): "en" | "np" {
  const devanagari = /[\u0900-\u097F]/;
  return devanagari.test(text) ? "np" : "en";
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Namaste! 🙏 I'm **MAWbot**, your official AI assistant for MAW Group of Companies. How can I brighten your day today? ✨",
};

const STORAGE_KEY = "mawbot-messages";

export function useChat() {
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch (e) { console.error("Failed to read welcome state from localStorage:", e); }
    return true;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      } catch (e) { console.error("Failed to restore messages from localStorage:", e); }
    return [WELCOME_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "np">("en");
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) { console.error("Failed to persist messages to localStorage:", e); }
  }, [messages]);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Auto-detect language from input
    const detected = detectLanguage(text);
    if (detected !== language) {
      setLanguage(detected);
    }

    addMessage({ role: "user", content: text.trim() });
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("mawbot-token");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text.trim(),
          language: detected,
          stream: true,
          history: messagesRef.current.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error("Failed");

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // Streaming response
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let botText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.error) {
                console.error("Stream error:", data.error);
                throw new Error(data.error);
              }
              if (data.text) {
                botText += data.text;
                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                      updated[lastIdx] = { role: "assistant", content: botText };
                    }
                    return updated;
                  });
              }
            } catch (e) {
              console.error("SSE parse error:", e);
            }
          }
        }
        setIsLoading(false);
      } else {
        // Non-streaming fallback
        const data = await res.json();
        addMessage({ role: "assistant", content: data.response });
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && err.name === "AbortError"
        ? "The response took too long (over 60 seconds). Please try again! 🙏"
        : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏";
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === "assistant" && updated[lastIdx].content === "") {
          updated[lastIdx] = { role: "assistant", content: errorMsg };
        } else {
          updated.push({ role: "assistant", content: errorMsg });
        }
        return updated;
      });
      setIsLoading(false);
    }
  }, [addMessage, isLoading, language]);

  const resetChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.error("Failed to clear localStorage:", e); }
    setShowWelcome(true);
  }, []);

  const startChat = useCallback((initialMessage?: string) => {
    setShowWelcome(false);
    if (initialMessage) {
      setTimeout(() => sendMessage(initialMessage), 100);
    }
  }, [sendMessage]);

  return {
    showWelcome,
    setShowWelcome,
    startChat,
    messages,
    input,
    setInput,
    isLoading,
    language,
    setLanguage,
    sendMessage,
    messagesEndRef,
    resetChat,
  };
}
