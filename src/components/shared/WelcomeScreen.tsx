"use client";

import { motion } from "framer-motion";
import { Sparkles, MessageCircle, ChevronRight } from "lucide-react";

const brands = [
  "DEEPAL", "SERES", "YAMAHA", "DONGFENG", "FOTON",
  "CHANGAN", "SKODA", "JEEP", "SOKON", "EICHER",
  "JCB", "BAIC", "HYOSUNG", "BENELLI", "KEEWAY",
];

interface WelcomeScreenProps {
  language: "en" | "np";
  onStart: (message?: string) => void;
}

export function WelcomeScreen({ language, onStart }: WelcomeScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3B6EF8]/10 via-[#5B5BD6]/5 to-[#E91E8C]/10 dark:from-[#1457ee]/20 dark:via-[#513fc7]/10 dark:to-[#cf107a]/20 animate-gradient-bg" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#3B6EF8]/10 blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#E91E8C]/10 blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-[#5B5BD6]/10 blur-3xl animate-glow-pulse" style={{ animationDelay: "3s" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Floating logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#3B6EF8] via-[#5B5BD6] to-[#E91E8C] p-[3px] shadow-2xl shadow-[#5B5BD6]/30 animate-logo-float">
            <div className="w-full h-full rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center">
              <img
                src="/logo.png"
                alt="MAW Group"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const parent = (e.currentTarget as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<span style="font-size:2rem;font-weight:700;background:linear-gradient(135deg,#3B6EF8,#E91E8C);-webkit-background-clip:text;-webkit-text-fill-color:transparent">M</span>`;
                  }
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl md:text-5xl font-heading font-bold mb-3"
        >
          <span className="text-gradient">MAWbot</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg md:text-xl text-[var(--text-secondary)] max-w-lg mb-2"
        >
          {language === "np"
            ? "MAW Group को आधिकारिक AI सहायक"
            : "Your Official AI Assistant for MAW Group of Companies"
          }
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-sm text-[var(--text-muted)] max-w-md mb-10"
        >
          {language === "np"
            ? "नेपालको अग्रणी अटोमोबाइल समूह — २० भन्दा बढी विश्वव्यापी ब्रान्डहरू, ६००+ सेवा केन्द्रहरू"
            : "Nepal's leading automobile conglomerate — 20+ global brands, 600+ touch points"
          }
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <button
            onClick={() => onStart()}
            className="group relative px-8 py-3.5 rounded-xl font-semibold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3B6EF8] via-[#5B5BD6] to-[#E91E8C] bg-size-200 animate-gradient-bg" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-white/10" />
            <span className="relative flex items-center gap-2">
              <MessageCircle size={18} />
              {language === "np" ? "कुराकानी सुरु गर्नुहोस्" : "Start Chatting"}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition" />
            </span>
          </button>

          <button
            onClick={() => onStart(
              language === "np"
                ? "MAW Group को बारेमा बताउनुहोस्"
                : "Tell me about MAW Group"
            )}
            className="px-8 py-3.5 rounded-xl font-medium text-sm border border-[var(--border-color)] hover:border-[var(--text-secondary)] transition bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              {language === "np" ? "MAW Group बारे जान्नुहोस्" : "Learn About MAW Group"}
            </span>
          </button>
        </motion.div>

        {/* Brand showcase strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="w-full max-w-3xl"
        >
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-4 font-medium">
            {language === "np" ? "हाम्रा ब्रान्डहरू" : "Our Brands"}
          </p>
          <div className="overflow-hidden relative">
            <div className="flex gap-8 animate-brand-scroll">
              {[...brands, ...brands].map((brand, i) => (
                <div
                  key={`${brand}-${i}`}
                  className="shrink-0 px-5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-xs font-semibold tracking-wider text-[var(--text-secondary)]"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
