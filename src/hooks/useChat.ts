"use client";

import { useState, useRef, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I'm **MAWbot**, your official AI assistant for MAW Group of Companies. How can I brighten your day today? ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "np">("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    addMessage({ role: "user", content: text.trim() });
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("mawbot-token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text.trim(), language }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      addMessage({ role: "assistant", content: data.response });
    } catch {
      addMessage({
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, isLoading, language]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    language,
    setLanguage,
    sendMessage,
    messagesEndRef,
  };
}
