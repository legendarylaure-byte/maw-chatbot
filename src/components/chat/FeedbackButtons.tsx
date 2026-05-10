"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackButtonsProps {
  messageId: string;
}

export function FeedbackButtons({ messageId }: FeedbackButtonsProps) {
  const [sent, setSent] = useState<"up" | "down" | null>(null);

  const sendFeedback = async (rating: "up" | "down") => {
    if (sent) return;
    setSent(rating);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch {}
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => sendFeedback("up")}
        className={`p-1 rounded transition ${
          sent === "up" ? "text-green-400" : "text-white/30 hover:text-green-400"
        }`}
      >
        <ThumbsUp size={12} />
      </button>
      <button
        onClick={() => sendFeedback("down")}
        className={`p-1 rounded transition ${
          sent === "down" ? "text-red-400" : "text-white/30 hover:text-red-400"
        }`}
      >
        <ThumbsDown size={12} />
      </button>
    </div>
  );
}
