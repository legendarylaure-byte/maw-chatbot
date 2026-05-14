"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Globe, ExternalLink, Plus, RefreshCw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminModal from "@/components/admin/AdminModal";

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

  const fetchPages = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/memory?type=crawled", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) setPages((await res.json()).items || []);
    } catch (e) { console.error("Failed to fetch crawled pages:", e); }
    setLoading(false);
  };

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

  const promoteToMemory = async (page: CrawledPage) => {
    if (!token || !page.summary) return;
    setPromoting(true);
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create", collection: "memory",
          data: {
            content: { en: page.summary }, category: "general",
            keywords: page.title?.split(" ").slice(0, 5).map((w) => w.toLowerCase()) || [],
            sourceUrl: page.url, active: true,
          },
        }),
      });
      setSelected(null);
    } catch (e) { console.error("Failed to promote to memory:", e); }
    setPromoting(false);
  };

  const filtered = pages.filter((p) =>
    `${p.title} ${p.url} ${p.summary || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AdminPageHeader
        title="Crawled Data"
        subtitle="Review crawled website content and promote to bot knowledge"
        actions={
          <AdminButton onClick={() => fetchPages(token)} variant="secondary" icon={<RefreshCw size={14} />}>
            Refresh
          </AdminButton>
        }
      />

      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search crawled pages..." />

      {loading ? (
        <p className="text-sm text-white/50">Loading crawled data...</p>
      ) : filtered.length === 0 ? (
        <AdminCard delay={0.1} hover={false}>
          <p className="text-sm text-white/50 text-center">
            {pages.length === 0
              ? "No crawled data yet. Run the crawler first: npm run crawl"
              : "No pages match your search."}
          </p>
        </AdminCard>
      ) : (
        <div className="grid gap-3">
          {filtered.map((page, i) => (
            <AdminCard key={page.id} delay={0.05 + i * 0.03} onClick={() => setSelected(page)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={14} className="text-white/40 shrink-0" />
                    <span className="text-[10px] text-white/40 truncate">{page.domain}</span>
                    <span className="text-[10px] text-white/30">{page.wordCount} words</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{page.title || "Untitled"}</p>
                  {page.summary && <p className="text-xs text-white/50 mt-1 line-clamp-2">{page.summary}</p>}
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <AdminButton variant="secondary" onClick={() => promoteToMemory(page)}
                    disabled={promoting || !page.summary}
                    title="Promote to bot knowledge">
                    <Plus size={14} />
                  </AdminButton>
                  <a href={page.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || "Untitled"}
        subtitle={selected?.url}
        actions={
          <>
            <AdminButton onClick={() => selected && promoteToMemory(selected)}
              disabled={promoting || !selected?.summary} loading={promoting} icon={<Plus size={14} />}>
              Promote to Bot Knowledge
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setSelected(null)}>Close</AdminButton>
          </>
        }
      >
        {selected?.summary && (
          <div>
            <h3 className="text-xs text-white/50 uppercase tracking-wider mb-1">Summary</h3>
            <p className="text-sm text-white/80">{selected.summary}</p>
          </div>
        )}
        <div>
          <h3 className="text-xs text-white/50 uppercase tracking-wider mb-1">Content Preview</h3>
          <p className="text-sm text-white/60 line-clamp-6">{selected?.content?.slice(0, 2000)}</p>
        </div>
      </AdminModal>
    </div>
  );
}
