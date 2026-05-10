"use client";

import { motion } from "framer-motion";
import { useVoice } from "@/hooks/useVoice";
import { FeedbackButtons } from "./FeedbackButtons";

interface ChatBubbleProps {
  message: { role: "user" | "assistant"; content: string };
  language: string;
  voiceId?: string;
  messageIndex?: number;
}

export function ChatBubble({ message, language, voiceId, messageIndex }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const { playAudio } = useVoice();

  const handlePlay = () => {
    if (voiceId) {
      playAudio(message.content, voiceId);
    }
  };

  const renderContent = (text: string) => {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#cf107a]">$1</strong>')
      .replace(/\* (.*?)(\n|$)/g, '<span class="block text-[#1457ee]">• $1</span>')
      .replace(/### (.*?)(\n|$)/g, '<div class="text-[#9227a0] font-semibold mt-2 mb-1">$1</div>')
      .replace(/\n/g, "<br/>");
    return formatted;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 group`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#1457ee] text-white ml-12 rounded-br-md"
            : "glass text-white mr-12 rounded-bl-md"
        }`}
      >
        {!isUser && (
          <span className="text-[#cf107a] text-xs font-semibold block mb-1.5 font-heading">
            MAWbot 🤖
          </span>
        )}
        <div
          className={`text-sm leading-relaxed ${language === "np" ? "lang-np" : ""} ${
            isUser ? "text-white/95" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
        />
        {!isUser && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={handlePlay}
              className="text-white/40 hover:text-[#cf107a] transition p-0.5 text-xs"
              title="Listen"
            >
              🔊
            </button>
            {messageIndex !== undefined && <FeedbackButtons messageId={`msg-${messageIndex}`} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
