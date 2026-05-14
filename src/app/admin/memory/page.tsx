"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Plus, Trash2, Edit3, ExternalLink } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminInput from "@/components/admin/AdminInput";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminButton from "@/components/admin/AdminButton";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminBadge from "@/components/admin/AdminBadge";

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

const categoryVariants: Record<string, "brand" | "success" | "info" | "default" | "warning"> = {
  company: "brand",
  product: "success",
  general: "info",
  joke: "warning",
  quiz: "default",
};

export default function AdminMemory() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MemoryItem | null>(null);
  const [formData, setFormData] = useState({
    contentEn: "", contentNp: "", category: "general", keywords: "", sourceUrl: "",
  });
  const [token, setToken] = useState("");

  const fetchItems = async (t: string) => {
    try {
      const res = await fetch("/api/admin/memory?type=memory", {
        headers: { Authorization: `Bearer ${t}` },
      });
      setItems((await res.json()).items || []);
    } catch (e) { console.error("Failed to fetch memory items", e); }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const action = editItem ? "update" : "create";
    const payload: Record<string, unknown> = {
      action, collection: "memory",
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
      setShowForm(false); setEditItem(null);
      setFormData({ contentEn: "", contentNp: "", category: "general", keywords: "", sourceUrl: "" });
      fetchItems(token);
    } catch (e) { console.error("Failed to save", e); }
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
    } catch (e) { console.error("Failed to delete", e); }
  };

  const filtered = items.filter((item) =>
    item.content?.en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AdminPageHeader
        title="Memory Manager"
        subtitle="Manage bot knowledge in English & Nepali"
        actions={
          <AdminButton
            onClick={() => {
              setEditItem(null);
              setFormData({ contentEn: "", contentNp: "", category: "general", keywords: "", sourceUrl: "" });
              setShowForm(!showForm);
            }}
            icon={<Plus size={15} />}
          >
            {showForm ? "Cancel" : "Add Memory"}
          </AdminButton>
        }
      />

      {showForm && (
        <AdminCard delay={0.05} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <AdminTextarea
              label="English Content *"
              value={formData.contentEn}
              onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
              rows={3}
              required
            />
            <AdminTextarea
              label="Nepali Content"
              value={formData.contentNp}
              onChange={(e) => setFormData({ ...formData, contentNp: e.target.value })}
              className="lang-np"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <AdminSelect label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="general">General</option>
                <option value="company">Company</option>
                <option value="product">Product</option>
                <option value="joke">Joke</option>
                <option value="quiz">Quiz</option>
              </AdminSelect>
              <AdminInput
                label="Keywords (comma separated)"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
            </div>
            <AdminInput
              label="Source URL"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              placeholder="https://mawnepal.com/about/"
            />
            <div className="flex gap-2 pt-2">
              <AdminButton type="submit">{editItem ? "Update" : "Save"}</AdminButton>
              <AdminButton variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search memory..." />

      {loading ? (
        <p className="text-sm text-white/50">Loading...</p>
      ) : filtered.length === 0 ? (
        <AdminCard delay={0.1} hover={false}>
          <p className="text-sm text-white/50 text-center">No memory entries found.</p>
        </AdminCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <AdminCard key={item.id} delay={0.05 + i * 0.03}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AdminBadge variant={categoryVariants[item.category] || "default"}>
                      {item.category}
                    </AdminBadge>
                    {item.keywords && item.keywords.length > 0 && (
                      <span className="text-[10px] text-white/30">{item.keywords.join(", ")}</span>
                    )}
                  </div>
                  <p className="text-sm text-white leading-relaxed">{item.content?.en}</p>
                  {item.content?.np && (
                    <p className="text-sm text-white/60 mt-1.5 lang-np">{item.content.np}</p>
                  )}
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-maw-blue hover:text-maw-magenta transition mt-2">
                      <ExternalLink size={10} />
                      {item.sourceUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                    </a>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <AdminButton variant="secondary" onClick={() => {
                    setEditItem(item);
                    setFormData({
                      contentEn: item.content?.en || "", contentNp: item.content?.np || "",
                      category: item.category, keywords: item.keywords?.join(", ") || "",
                      sourceUrl: item.sourceUrl || "",
                    });
                    setShowForm(true);
                  }}>
                    <Edit3 size={14} />
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={14} />
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
