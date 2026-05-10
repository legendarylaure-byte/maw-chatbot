"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Globe, Search, ExternalLink, Plus, RefreshCw } from "lucide-react";

const auth = getAuth(app);

interface CrawledPage {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  summary?: string;
  content: string;
  wordCount: number;
  crawledAt: string;
}

export default function AdminCrawledData() {
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CrawledPage | null>(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        fetchPages(t);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchPages = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/memory?type=crawled", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data.items || []);
      }
    } catch {}
    setLoading(false);
  };

  const promoteToMemory = async (page: CrawledPage) => {
    if (!token || !page.summary) return;
    setPromoting(true);
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          collection: "memory",
          data: {
            content: { en: page.summary },
            category: "general",
            keywords: page.title?.split(" ").slice(0, 5).map((w) => w.toLowerCase()) || [],
            sourceUrl: page.url,
            active: true,
          },
        }),
      });
      setSelected(null);
    } catch {}
    setPromoting(false);
  };

  const filtered = pages.filter((p) =>
    `${p.title} ${p.url} ${p.summary || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-semibold text-xl text-gradient">Crawled Data</h1>
          <p className="text-sm text-white/50 mt-1">Review crawled website content and promote to bot knowledge</p>
        </div>
        <button
          onClick={() => fetchPages(token)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm hover:bg-white/10 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crawled pages..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
        />
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading crawled data...</p>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-6 border border-white/10 text-center text-white/50 text-sm">
          {pages.length === 0
            ? "No crawled data yet. Run the crawler first: npm run crawl"
            : "No pages match your search."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((page) => (
            <div
              key={page.id}
              className="glass rounded-lg p-3 border border-white/10 hover:border-white/20 transition cursor-pointer"
              onClick={() => setSelected(page)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={14} className="text-white/40 shrink-0" />
                    <span className="text-[10px] text-white/40 truncate">{page.domain}</span>
                    <span className="text-[10px] text-white/30">{page.wordCount} words</span>
                  </div>
                  <p className="text-sm font-medium truncate">{page.title || "Untitled"}</p>
                  {page.summary && (
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{page.summary}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); promoteToMemory(page); }}
                    disabled={promoting || !page.summary}
                    className="p-1.5 rounded-lg hover:bg-[#cf107a]/20 hover:text-[#cf107a] transition disabled:opacity-30"
                    title="Promote to bot knowledge"
                  >
                    <Plus size={14} />
                  </button>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelected(null)}>
          <div className="glass rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">{selected.title || "Untitled"}</h2>
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1457ee] hover:text-[#cf107a] transition flex items-center gap-1 mt-1">
                  <ExternalLink size={12} /> {selected.url}
                </a>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white">✕</button>
            </div>

            {selected.summary && (
              <div className="mb-4">
                <h3 className="text-xs text-white/50 uppercase tracking-wider mb-1">Summary</h3>
                <p className="text-sm text-white/80">{selected.summary}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xs text-white/50 uppercase tracking-wider mb-1">Content Preview</h3>
              <p className="text-sm text-white/60 line-clamp-6">{selected.content?.slice(0, 2000)}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => promoteToMemory(selected)}
                disabled={promoting || !selected.summary}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm disabled:opacity-50"
              >
                {promoting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Promote to Bot Knowledge
              </button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg glass text-sm hover:bg-white/10 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
