"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useInView } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, MessageCircle, ChevronRight, Building2, Globe2, MapPin, ExternalLink } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-3xl md:text-4xl font-bold font-heading"
      >
        <span className="text-gradient">
          {prefix}{count.toLocaleString()}{suffix}
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
  darkMode: boolean;
  onDarkModeChange: () => void;
}

export function WelcomeScreen({ language, onStart, darkMode, onDarkModeChange }: WelcomeScreenProps) {
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutInView = useInView(aboutRef, { once: true, margin: "-80px" });
  const logoRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const confettiFired = useRef(false);

  // Confetti on first visit
  useEffect(() => {
    if (confettiFired.current) return;
    const fired = sessionStorage.getItem("mawbot-confetti");
    if (fired) return;
    confettiFired.current = true;
    sessionStorage.setItem("mawbot-confetti", "true");

    const defaults = {
      spread: 60,
      ticks: 100,
      gravity: 0.6,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#3B6EF8", "#5B5BD6", "#E91E8C", "#F5A623", "#FF6B8A"],
    };

    const shoot = () => {
      confetti({ ...defaults, particleCount: 40, origin: { x: 0.3, y: 0.6 } });
      confetti({ ...defaults, particleCount: 40, origin: { x: 0.7, y: 0.6 } });
    };

    const timer = setTimeout(shoot, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoMouseMove = useCallback((e: React.MouseEvent) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 20, y: x * 20 });
  }, []);

  const handleLogoMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleBrandClick = useCallback((brandName: string) => {
    const msg = language === "np"
      ? `${brandName} बारे बताउनुहोस्`
      : `Tell me about ${brandName}`;
    onStart(msg);
  }, [language, onStart]);

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${e.clientX - rect.left - size / 2}px`;
    circle.style.top = `${e.clientY - rect.top - size / 2}px`;
    circle.classList.add("ripple-effect");
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }, []);

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-y-auto bg-[var(--bg-primary)]">
      {/* Theme toggle */}
      <ThemeToggle darkMode={darkMode} onToggle={onDarkModeChange} variant="floating" />

      {/* Fluid mesh background — 5 animated blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#3B6EF8]/10 dark:bg-[#3B6EF8]/15 animate-blob-1" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#E91E8C]/10 dark:bg-[#E91E8C]/15 animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#F5A623]/8 dark:bg-[#F5A623]/10 animate-blob-3" />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-[#5B5BD6]/10 dark:bg-[#5B5BD6]/15 animate-blob-4" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 rounded-full bg-[#FF6B8A]/8 dark:bg-[#FF6B8A]/10 animate-blob-5" />
      </div>

      {/* Glowing orb mascot */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
          className="relative group cursor-default"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--gradient-orb)] animate-float shadow-xl shadow-[var(--color-maw-indigo)]/30 flex items-center justify-center orb-wave">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-white rounded-full orb-blink" />
              <div className="w-2 h-2 bg-white rounded-full orb-blink" style={{ animationDelay: "0.1s" }} />
            </div>
          </div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--bg-card)] text-[var(--text-primary)] text-[10px] font-medium px-2 py-1 rounded-lg shadow-lg whitespace-nowrap border border-[var(--border-color)]">
            👋 Hey there!
          </div>
        </motion.div>
      </div>

      {/* Hero Section */}
      <div ref={heroRef} className="relative z-10 flex flex-col items-center px-6 pt-20 pb-8 text-center w-full max-w-4xl">
        {/* 3D Floating logo with tilt */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
          ref={logoRef}
          onMouseMove={handleLogoMouseMove}
          onMouseLeave={handleLogoMouseLeave}
          style={{
            perspective: "600px",
          }}
        >
          <motion.div
            className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#3B6EF8] via-[#5B5BD6] to-[#E91E8C] p-[3px] shadow-2xl shadow-[#5B5BD6]/30"
            animate={{
              rotateX: tilt.x,
              rotateY: tilt.y,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ transformStyle: "preserve-3d" }}
          >
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
          </motion.div>
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

        {/* CTA Buttons with liquid ripple */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <button
            onClick={(e) => { handleRipple(e); onStart(); }}
            className="group relative px-8 py-3.5 rounded-xl font-semibold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3B6EF8] via-[#5B5BD6] to-[#E91E8C] animate-gradient-bg" style={{ backgroundSize: "200% 100%" }} />
            <div className="absolute inset-0 shimmer-sweep" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-white/10" />
            <span className="relative flex items-center gap-2">
              <MessageCircle size={18} />
              {language === "np" ? "कुराकानी सुरु गर्नुहोस्" : "Start Chatting"}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition" />
            </span>
          </button>

          <button
            onClick={(e) => {
              handleRipple(e);
              onStart(
                language === "np"
                  ? "MAW Group को बारेमा बताउनुहोस्"
                  : "Tell me about MAW Group"
              );
            }}
            className="relative px-8 py-3.5 rounded-xl font-medium text-sm border border-[var(--border-color)] hover:border-[var(--color-maw-indigo)] transition-all duration-300 bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 overflow-hidden"
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-12"
      >
        <div className="glass rounded-2xl p-6 md:p-8 border border-[var(--border-color)] card-hover">
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

      {/* Brand Showcase Strip — Interactive, bigger logos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 mb-10"
      >
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-4 text-center font-medium">
          {language === "np" ? "ब्रान्डमा क्लिक गर्नुहोस्" : "Click a brand to learn more"}
        </p>
        <div className="overflow-hidden relative">
          <div className="flex gap-4 animate-brand-scroll">
            {[...brands, ...brands].map((brand, i) => (
              <button
                key={`${brand.name}-${i}`}
                onClick={() => handleBrandClick(brand.name)}
                className="shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] card-hover cursor-pointer transition-all duration-300 hover:border-[var(--color-maw-indigo)]/50 hover:shadow-lg hover:shadow-[var(--color-maw-indigo)]/10"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const parent = el.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-sm font-bold text-[var(--color-maw-indigo)]">${brand.name.charAt(0)}</span>`;
                      }
                    }}
                  />
                </div>
                <span className="text-sm font-semibold tracking-wider text-[var(--text-secondary)]">
                  {brand.name}
                </span>
              </button>
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
        <div className="flex card-hover">
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
