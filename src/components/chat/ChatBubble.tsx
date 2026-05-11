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

function extractSources(content: string): { text: string; sources: string[] } {
  const sourceRegex = /\[Source:\s*(https?:\/\/[^\]]+)\]/g;
  const sources: string[] = [];
  let match;
  let cleaned = content;
  while ((match = sourceRegex.exec(content)) !== null) {
    sources.push(match[1]);
    cleaned = cleaned.replace(match[0], "");
  }
  return { text: cleaned.trim(), sources };
}

export function ChatBubble({ message, language, voiceId, messageIndex }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const { playAudio } = useVoice();
  const { text, sources } = extractSources(message.content);

  const handlePlay = () => {
    if (voiceId) {
      playAudio(text, voiceId);
    }
  };

  const renderContent = (content: string) => {
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--color-maw-magenta)]">$1</strong>')
      .replace(/\* (.*?)(\n|$)/g, '<span class="block text-[var(--color-maw-blue)]">• $1</span>')
      .replace(/### (.*?)(\n|$)/g, '<div class="text-[var(--color-maw-purple)] font-semibold mt-2 mb-1">$1</div>')
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
      {isUser ? (
        /* User bubble */
        <div className="max-w-[85%] md:max-w-[70%] ml-12">
          <div className="bg-[var(--gradient-user)] text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-[var(--color-maw-indigo)]/20">
            <div
              className={`text-sm leading-relaxed ${language === "np" ? "lang-np" : ""} text-white/95`}
              dangerouslySetInnerHTML={{ __html: renderContent(text) }}
            />
          </div>
        </div>
      ) : (
        /* Bot bubble */
        <div className="max-w-[85%] md:max-w-[70%] mr-12">
          <div className="flex">
            <div className="w-[3px] rounded-l-2xl bg-gradient-to-b from-[var(--color-maw-blue)] to-[var(--color-maw-magenta)] shrink-0" />
            <div className="flex-1 glass rounded-r-2xl rounded-bl-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-maw-blue)] to-[var(--color-maw-magenta)] flex items-center justify-center text-[10px] font-bold text-white">
                  M
                </div>
                <span className="text-[var(--color-maw-magenta)] text-xs font-semibold font-heading">
                  MAWbot
                </span>
              </div>
              <div
                className={`text-sm leading-relaxed ${language === "np" ? "lang-np" : ""} text-[var(--text-primary)]`}
                dangerouslySetInnerHTML={{ __html: renderContent(text) }}
              />
              {/* Source badges */}
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sources.map((url, i) => {
                    const domain = url.replace(/https?:\/\//, "").split("/")[0];
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-maw-blue)]/10 text-[var(--color-maw-blue)] hover:bg-[var(--color-maw-blue)]/20 transition border border-[var(--color-maw-blue)]/20"
                      >
                        {domain}
                      </a>
                    );
                  })}
                </div>
              )}
              {/* Feedback + Play */}
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handlePlay}
                  className="text-[var(--text-muted)] hover:text-[var(--color-maw-magenta)] transition p-0.5 text-xs"
                  title="Listen"
                >
                  🔊
                </button>
                {messageIndex !== undefined && <FeedbackButtons messageId={`msg-${messageIndex}`} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
