"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";
import LoginScene from "@/components/admin/LoginScene";
import confetti from "canvas-confetti";
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from "lucide-react";

const auth = getAuth(app);

const formVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", duration: 1, bounce: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.6 + i * 0.1, type: "spring", stiffness: 100 },
  }),
};

const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const router = useRouter();

  const fireConfetti = useCallback(() => {
    const defaults = {
      particleCount: 60,
      spread: 80,
      colors: ["#3B6EF8", "#5B5BD6", "#9227a0", "#E91E8C", "#F5A623"],
    };
    confetti({ ...defaults, origin: { y: 0.7 } });
    confetti({ ...defaults, angle: 60, origin: { x: 0, y: 0.7 } });
    confetti({ ...defaults, angle: 120, origin: { x: 1, y: 0.7 } });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      fireConfetti();
      setTimeout(() => router.push("/admin"), 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Login failed. Please try again.";
      setError(msg);
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4 overflow-hidden relative">
      {/* 3D Scene */}
      <LoginScene focused={focused} submitting={loading} />

      {/* Vignette overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_35%,_#0A0A1A_100%)]" />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="login-card"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-sm"
          >
            <motion.div
              key={shakeKey}
              variants={shakeVariants}
              animate="shake"
              className="glass rounded-2xl p-8 border border-white/10 shadow-2xl shadow-maw-magenta/5 backdrop-blur-xl"
            >
              {/* Logo area */}
              <motion.div
                className="text-center mb-6"
                variants={itemVariants}
                custom={0}
                initial="hidden"
                animate="visible"
              >
                <div className="w-16 h-16 rounded-full gradient-glow flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg shadow-maw-magenta/20">
                  M
                </div>
                <h1 className="font-heading font-semibold text-lg bg-gradient-to-r from-maw-blue via-maw-purple to-maw-magenta bg-clip-text text-transparent">
                  MAWbot Admin
                </h1>
                <p className="text-xs text-white/40 mt-1">
                  Sign in to the dashboard
                </p>
              </motion.div>

              <form onSubmit={handleLogin} className="space-y-4">
                <motion.div variants={itemVariants} custom={1} initial="hidden" animate="visible">
                  <label className="text-xs text-white/50 block mb-1.5 font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none transition-all duration-300 focus:border-maw-magenta/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(233,30,140,0.1)]"
                      placeholder="mesaykar@gmail.com"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} custom={2} initial="hidden" animate="visible">
                  <label className="text-xs text-white/50 block mb-1.5 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none transition-all duration-300 focus:border-maw-magenta/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(233,30,140,0.1)]"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2"
                    >
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={itemVariants} custom={3} initial="hidden" animate="visible">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full gradient-glow rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Authenticating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <LogIn size={15} />
                        Sign In
                      </span>
                    )}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                  </button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.p
                className="text-center text-[10px] text-white/20 mt-6"
                variants={itemVariants}
                custom={4}
                initial="hidden"
                animate="visible"
              >
                <Sparkles size={10} className="inline mr-1" />
                MAWbot v1.0
              </motion.p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
            className="relative z-10 text-center"
          >
            <div className="w-20 h-20 rounded-full gradient-glow flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-2xl shadow-maw-magenta/30 animate-float">
              M
            </div>
            <h2 className="font-heading text-xl font-semibold text-gradient mb-1">
              Welcome Back!
            </h2>
            <p className="text-sm text-white/50">Redirecting to dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
