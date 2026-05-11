"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, MessageCircle, ChevronRight, Building2, Globe2, MapPin, ExternalLink } from "lucide-react";

const brands = [
  { name: "DEEPAL", logo: "/brand-logos/deepal.png" },
  { name: "SERES", logo: "/brand-logos/seres.png" },
  { name: "YAMAHA", logo: "/brand-logos/yamaha.png" },
  { name: "DONGFENG", logo: "/brand-logos/dongfeng.png" },
  { name: "FOTON", logo: "/brand-logos/foton.png" },
  { name: "CHANGAN", logo: "/brand-logos/changan.png" },
  { name: "SKODA", logo: "/brand-logos/skoda.png" },
  { name: "JEEP", logo: "/brand-logos/jeep.png" },
  { name: "SOKON", logo: "/brand-logos/sokon.png" },
  { name: "EICHER", logo: "/brand-logos/eicher.png" },
  { name: "JCB", logo: "/brand-logos/jcb.png" },
  { name: "KONE", logo: "/brand-logos/kone.png" },
];

const stats = [
  { value: 1964, suffix: "", label: "Established", prefix: "" },
  { value: 20, suffix: "+", label: "Global Brands", prefix: "" },
  { value: 600, suffix: "+", label: "Touch Points", prefix: "" },
];

interface StatCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

function StatCounter({ target, suffix = "", prefix = "", label }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const displayValue = isInView ? target : 0;

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-3xl md:text-4xl font-bold font-heading"
      >
        <span className="text-gradient">
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </span>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-xs md:text-sm text-[var(--text-muted)] mt-1 font-medium uppercase tracking-wider"
      >
        {label}
      </motion.p>
    </div>
  );
}

interface WelcomeScreenProps {
  language: "en" | "np";
  onStart: (message?: string) => void;
}

export function WelcomeScreen({ language, onStart }: WelcomeScreenProps) {
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutInView = useInView(aboutRef, { once: true, margin: "-80px" });

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-y-auto bg-[var(--bg-primary)]">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#3B6EF8]/8 via-[#5B5BD6]/4 to-[#E91E8C]/8 dark:from-[#1457ee]/15 dark:via-[#513fc7]/8 dark:to-[#cf107a]/15 animate-gradient-bg pointer-events-none" />

      {/* Floating orbs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#3B6EF8]/8 blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#E91E8C]/8 blur-3xl animate-glow-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />
      <div className="fixed top-1/3 right-1/3 w-48 h-48 rounded-full bg-[#5B5BD6]/8 blur-3xl animate-glow-pulse pointer-events-none" style={{ animationDelay: "3s" }} />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-20 pb-8 text-center w-full max-w-4xl">
        {/* Floating logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#3B6EF8] via-[#5B5BD6] to-[#E91E8C] p-[3px] shadow-2xl shadow-[#5B5BD6]/30 animate-logo-float">
            <div className="w-full h-full rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center">
              <img
                src="/brand-logos/maw-light.svg"
                alt="MAW Group"
                className="w-20 h-20 object-contain hidden dark:block"
              />
              <img
                src="/brand-logos/maw-dark.svg"
                alt="MAW Group"
                className="w-20 h-20 object-contain block dark:hidden"
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
          className="text-sm text-[var(--text-muted)] max-w-md mb-8"
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
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <button
            onClick={() => onStart()}
            className="group relative px-8 py-3.5 rounded-xl font-semibold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3B6EF8] via-[#5B5BD6] to-[#E91E8C] animate-gradient-bg" style={{ backgroundSize: "200% 100%" }} />
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
            className="px-8 py-3.5 rounded-xl font-medium text-sm border border-[var(--border-color)] hover:border-[var(--text-secondary)] transition-all duration-300 bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              {language === "np" ? "MAW Group बारे जान्नुहोस्" : "Learn About MAW Group"}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Stats Counter Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-12"
      >
        <div className="glass rounded-2xl p-6 md:p-8 border border-[var(--border-color)]">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {stats.map((stat) => (
              <StatCounter
                key={stat.label}
                target={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Brand Showcase Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 mb-10"
      >
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-4 text-center font-medium">
          {language === "np" ? "हाम्रा ब्रान्डहरू" : "Our Brands"}
        </p>
        <div className="overflow-hidden relative">
          <div className="flex gap-4 animate-brand-scroll">
            {[...brands, ...brands].map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] card-hover"
              >
                <div className="w-6 h-6 rounded-full bg-white dark:bg-white/10 flex items-center justify-center p-0.5 shrink-0">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs font-semibold tracking-wider text-[var(--text-secondary)]">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* About MAW Card Section */}
      <motion.div
        ref={aboutRef}
        initial={{ opacity: 0, y: 40 }}
        animate={aboutInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-16"
      >
        <div className="flex">
          <div className="w-[4px] rounded-l-xl bg-gradient-to-b from-[#3B6EF8] to-[#E91E8C] shrink-0" />
          <div className="flex-1 glass rounded-r-xl rounded-bl-xl p-6 md:p-8 border border-[var(--border-color)] border-l-0">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={18} className="text-[var(--color-maw-blue)]" />
              <h2 className="font-heading font-semibold text-lg text-[var(--text-primary)]">
                {language === "np" ? "MAW Group को बारेमा" : "About MAW Group"}
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              {language === "np"
                ? "MAW Group नेपालको अग्रणी अटोमोबाइल समूह हो, जसले १९६४ देखि मोरङ अटो वर्क्सको रूपमा सेवा प्रदान गर्दै आएको छ। २० भन्दा बढी विश्वव्यापी ब्रान्डहरूको प्रतिनिधित्व गर्दै, ६०० भन्दा बढी सेवा केन्द्रहरू मार्फत नेपालभर गुणस्तरीय सेवा प्रदान गरिरहेको छ।"
                : "MAW Group is Nepal's leading automobile conglomerate, serving since 1964 as Morang Auto Works. Representing 20+ global brands including Deepal, SERES, Yamaha, Dongfeng, Foton, Changan, Skoda, Jeep, and more, with 600+ touch points across Nepal. Beyond automotive, the group operates in engineering, lifts, lubricants, music, and CSR through the MAW Foundation."
              }
            </p>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Globe2 size={14} />
                600+ {language === "np" ? "सेवा केन्द्र" : "Touch Points"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <MapPin size={14} />
                {language === "np" ? "नेपालभर" : "Nationwide"}
              </span>
            </div>
            <a
              href="https://mawnepal.com/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-[var(--color-maw-blue)] hover:text-[var(--color-maw-indigo)] transition"
            >
              {language === "np" ? "थप जानकारी" : "Learn more about MAW Group"}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Bottom spacing */}
      <div className="h-12" />
    </div>
  );
}
