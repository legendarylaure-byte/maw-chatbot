"use client";

import { MapPin, Briefcase, ShoppingBag, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface RichCard {
  type: "job" | "location" | "product" | "service";
  title: string;
  description: string;
  image?: string;
  link?: string;
  meta?: Record<string, string>;
}

const cardConfig = {
  job: { icon: Briefcase, gradient: "from-[var(--color-maw-blue)] to-[var(--color-maw-indigo)]" },
  location: { icon: MapPin, gradient: "from-[var(--color-maw-magenta)] to-[var(--color-maw-purple)]" },
  product: { icon: ShoppingBag, gradient: "from-[var(--color-maw-gold)] to-[var(--color-maw-coral)]" },
  service: { icon: Briefcase, gradient: "from-[var(--color-maw-indigo)] to-[var(--color-maw-purple)]" },
};

function SingleCard({ card }: { card: RichCard }) {
  const config = cardConfig[card.type] || cardConfig.service;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-[var(--border-glass)] overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}>
            <Icon size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{card.title}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{card.description}</p>
            {card.meta && Object.keys(card.meta).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(card.meta).map(([key, val]) => (
                  <span key={key} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-maw-blue)]/10 text-[var(--color-maw-blue)]">
                    {val}
                  </span>
                ))}
              </div>
            )}
          </div>
          {card.link && (
            <a
              href={card.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--border-color)] transition text-[var(--text-muted)] hover:text-[var(--color-maw-magenta)]"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function extractCards(content: string): { cards: RichCard[]; text: string } {
  const jsonRegex = /```json\s*\n([\s\S]*?)```/g;
  const cards: RichCard[] = [];
  let cleaned = content;
  let match;

  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item.title && item.type) {
          cards.push({
            type: item.type,
            title: item.title,
            description: item.description || "",
            image: item.image,
            link: item.link,
            meta: item.meta || undefined,
          });
        }
      }
      cleaned = cleaned.replace(match[0], "");
    } catch (e) { console.error("Failed to parse cards from text:", e); }
  }

  return { cards, text: cleaned.trim() };
}

export function RichCards({ cards }: { cards: RichCard[] }) {
  if (!cards.length) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {cards.map((card, i) => (
        <SingleCard key={i} card={card} />
      ))}
    </div>
  );
}
