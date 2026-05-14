"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  Brain, LayoutDashboard, Globe, MessageSquare, Gamepad2,
  Languages, Mic, BarChart3, Settings, LogOut, Menu, X, Sparkles,
} from "lucide-react";

const auth = getAuth(app);

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/memory", label: "Memory Manager", icon: Brain },
  { href: "/admin/crawled-data", label: "Crawled Data", icon: Globe },
  { href: "/admin/jokes", label: "Jokes", icon: MessageSquare },
  { href: "/admin/quizzes", label: "Quizzes", icon: Gamepad2 },
  { href: "/admin/languages", label: "Languages", icon: Languages },
  { href: "/admin/voices", label: "Voices", icon: Mic },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.05 + i * 0.03, type: "spring", stiffness: 120 },
  }),
};

function Sidebar({
  pathname,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}: {
  pathname: string;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  handleLogout: () => void;
}) {
  return (
    <aside
      className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 glass border-r border-white/10 transform transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-glow flex items-center justify-center text-sm font-bold">
            M
          </div>
          <span className="font-heading font-semibold text-sm">MAWbot Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-white/40 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
        {adminLinks.map((link, i) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <motion.div
              key={link.href}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <a
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 overflow-hidden ${
                  active
                    ? "text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-maw-magenta/20 to-maw-purple/20 border border-maw-magenta/20"
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  />
                )}
                <Icon
                  size={16}
                  className={`relative z-10 transition-colors ${
                    active ? "text-maw-magenta" : "text-white/40 group-hover:text-maw-magenta/70"
                  }`}
                />
                <span className="relative z-10">{link.label}</span>
                {active && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-maw-magenta"
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  />
                )}
              </a>
            </motion.div>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0A0A1A]/80">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (cancelled) return;
          await u.getIdToken(true);
          const tokenResult = await u.getIdTokenResult();
          if (tokenResult.claims.role === "admin") {
            setIsAdmin(true);
            setLoading(false);
            return;
          }
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
        }
        setIsAdmin(false);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-glow flex items-center justify-center text-sm font-bold animate-pulse">
            M
          </div>
          <div className="w-6 h-6 border-2 border-maw-magenta border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if ((!user || !isAdmin) && pathname !== "/admin/login") {
    router.push("/admin/login?reason=unauthorized");
    return null;
  }

  if (pathname === "/admin/login") {
    return <div className="dark">{children}</div>;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] dark flex">
      <Sidebar
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 min-h-screen flex flex-col">
        <header className="glass border-b border-white/10 px-4 py-3 flex items-center gap-3 md:hidden sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-white/40 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-heading font-semibold text-sm">MAWbot Admin</span>
        </header>

        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.03"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <main className="relative z-10 flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="relative z-10 border-t border-white/5 px-6 py-3">
          <p className="text-[10px] text-white/20 text-center flex items-center justify-center gap-1">
            <Sparkles size={10} /> MAWbot Admin v1.0
          </p>
        </footer>
      </div>
    </div>
  );
}
