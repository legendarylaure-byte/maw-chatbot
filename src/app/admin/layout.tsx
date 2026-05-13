"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  Brain, MessageSquare, Gamepad2, Languages, Mic, BarChart3,
  Settings, LogOut, Menu, X, Globe,
} from "lucide-react";

const auth = getAuth(app);

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const tokenResult = await u.getIdTokenResult();
        setIsAdmin(tokenResult.claims.role === "admin");
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-maw-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-maw-magenta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if ((!user || !isAdmin) && pathname !== "/admin/login") {
    router.push("/admin/login");
    return null;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-maw-bg flex">
      {/* Sidebar */}
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
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
            <X size={18} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-maw-magenta/20 text-maw-magenta"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </a>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-h-screen">
        {/* Top bar */}
        <header className="glass border-b border-white/10 px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu size={20} />
          </button>
          <span className="font-heading font-semibold text-sm">MAWbot Admin</span>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
