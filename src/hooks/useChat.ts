"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

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

export function useChat() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "np">("en");
  const messagesRef = useRef(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const authRef = useRef(getAuth(app));

  // Keep ref in sync after render (not during render)
  useEffect(() => {
    messagesRef.current = messages;
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
      const user = authRef.current.currentUser;
      const token = user ? await user.getIdToken() : null;
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
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Process any remaining data in the buffer
            if (buffer.trim()) {
              const remainingLines = buffer.split("\n").filter((l) => l.startsWith("data: "));
              for (const line of remainingLines) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.done || data.error) break;
                  if (data.text) {
                    botText += data.text;
                    updateAssistantMessage(botText);
                  }
                } catch { /* ignore partial */ }
              }
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines from the buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                botText += data.text;
                updateAssistantMessage(botText);
              }
            } catch (e) {
              console.error("SSE parse error:", e);
            }
          }
        }

        function updateAssistantMessage(text: string) {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
              updated[lastIdx] = { role: "assistant", content: text };
            }
            return updated;
          });
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
