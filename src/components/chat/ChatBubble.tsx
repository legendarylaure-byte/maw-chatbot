"use client";

import { motion } from "framer-motion";
import { Volume2, StopCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FeedbackButtons } from "./FeedbackButtons";
import { extractCards, RichCards } from "./RichCards";

interface ChatBubbleProps {
  message: { role: "user" | "assistant"; content: string };
  language: string;
  voiceId?: string;
  messageIndex?: number;
  playAudio: (text: string, voiceId?: string, lang?: string, speed?: number) => Promise<void>;
  isPlaying: boolean;
  stopAudio: () => void;
  playbackSpeed: number;
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

export function ChatBubble({ message, language, voiceId, messageIndex, playAudio, isPlaying, stopAudio, playbackSpeed }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const { text, sources } = extractSources(message.content);

  const { cards, text: displayText } = isUser
    ? { cards: [] as ReturnType<typeof extractCards>["cards"], text }
    : extractCards(text);

  const handlePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      const lang = language === "np" ? "ne-NP" : "en-US";
      playAudio(displayText, voiceId || undefined, lang, playbackSpeed);
    }
  };

  const MarkdownComponents = {
    strong: ({ children, ...props }: React.ComponentPropsWithoutRef<"strong">) => (
      <strong {...props} className="text-[var(--color-maw-magenta)]">{children}</strong>
    ),
    h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
      <h3 {...props} className="text-[var(--color-maw-purple)] font-semibold mt-2 mb-1">{children}</h3>
    ),
    li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
      <li {...props} className="block text-[var(--color-maw-blue)]">• {children}</li>
    ),
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
      <p {...props} className="block leading-relaxed">{children}</p>
    ),
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
          <div className="bg-[var(--gradient-user)] text-[var(--text-on-user)] rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-[var(--color-maw-indigo)]/20 border border-[var(--border-glass)]">
            <div className={`text-sm ${language === "np" ? "lang-np" : ""} text-[var(--text-on-user)]`}>
              <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
                {text}
              </ReactMarkdown>
            </div>
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
              <div className={`text-sm ${language === "np" ? "lang-np" : ""} text-[var(--text-primary)]`}>
                <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
                  {displayText}
                </ReactMarkdown>
              </div>
              <RichCards cards={cards} />
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
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handlePlay}
                  className={`transition p-1 rounded-lg ${
                    isPlaying
                      ? "text-[var(--color-maw-magenta)] bg-[var(--color-maw-magenta)]/10"
                      : "text-[var(--text-muted)] hover:text-[var(--color-maw-magenta)] hover:bg-[var(--color-maw-magenta)]/5"
                  }`}
                  title={isPlaying ? "Stop" : "Listen"}
                >
                  {isPlaying ? <StopCircle size={14} /> : <Volume2 size={14} />}
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
