"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Plus, Search, Trash2, Edit3, ExternalLink } from "lucide-react";

const auth = getAuth(app);

interface MemoryItem {
  id: string;
  content: { en: string; np?: string };
  category: string;
  active: boolean;
  createdAt: string;
  keywords?: string[];
  sourceUrl?: string;
}

export default function AdminMemory() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MemoryItem | null>(null);
  const [formData, setFormData] = useState({
    contentEn: "",
    contentNp: "",
    category: "general",
    keywords: "",
    sourceUrl: "",
  });
  const [token, setToken] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        fetchItems(t);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchItems = async (t: string) => {
    try {
      const res = await fetch("/api/admin/memory?type=memory", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to fetch memory items", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const action = editItem ? "update" : "create";
    const payload: Record<string, unknown> = {
      action,
      collection: "memory",
      data: {
        content: { en: formData.contentEn, np: formData.contentNp },
        category: formData.category,
        keywords: formData.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        sourceUrl: formData.sourceUrl || null,
        active: true,
      },
    };

    if (editItem) payload.id = editItem.id;

    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setShowForm(false);
      setEditItem(null);
      setFormData({ contentEn: "", contentNp: "", category: "general", keywords: "", sourceUrl: "" });
      fetchItems(token);
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this memory entry?")) return;
    try {
      await fetch("/api/admin/memory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", collection: "memory", id }),
      });
      fetchItems(token);
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const filtered = items.filter((item) =>
    item.content?.en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-semibold text-xl text-gradient">Memory Manager</h1>
          <p className="text-sm text-white/50 mt-1">Manage bot knowledge in English & Nepali</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setFormData({ contentEn: "", contentNp: "", category: "general", keywords: "", sourceUrl: "" });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-glow text-sm font-medium"
        >
          <Plus size={16} />
          Add Memory
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-xl p-4 border border-white/10 mb-6 space-y-3">
          <div>
            <label className="text-xs text-white/50 block mb-1">English Content *</label>
            <textarea
              value={formData.contentEn}
              onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Nepali Content</label>
            <textarea
              value={formData.contentNp}
              onChange={(e) => setFormData({ ...formData, contentNp: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50 lang-np"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="general">General</option>
                <option value="company">Company</option>
                <option value="product">Product</option>
                <option value="joke">Joke</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Keywords (comma separated)</label>
              <input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Source URL (from crawled data)</label>
            <input
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              placeholder="https://mawnepal.com/about/"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg gradient-glow text-sm">
              {editItem ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memory..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-maw-magenta/50"
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-white/50">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-white/50">No memory entries found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="glass rounded-lg p-3 border border-white/10 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase">
                    {item.category}
                  </span>
                  {item.keywords && item.keywords.length > 0 && (
                    <span className="text-[10px] text-white/40">
                      {item.keywords.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-sm">{item.content?.en}</p>
                {item.content?.np && (
                  <p className="text-sm text-white/60 mt-1 lang-np">{item.content.np}</p>
                )}
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#1457ee] hover:text-[#cf107a] transition mt-1"
                  >
                    <ExternalLink size={10} />
                    {item.sourceUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditItem(item);
                    setFormData({
                      contentEn: item.content?.en || "",
                      contentNp: item.content?.np || "",
                      category: item.category,
                      keywords: item.keywords?.join(", ") || "",
                      sourceUrl: item.sourceUrl || "",
                    });
                    setShowForm(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
