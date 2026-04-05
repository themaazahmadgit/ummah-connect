"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Group {
  id: string; name: string; description: string; category: string; type: string;
  member_count: number; created_at: string; isMember: boolean;
  creator: { name: string; username: string; is_verified: boolean };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "islam", type: "public" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [joining, setJoining] = useState<string | null>(null);

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/groups?${params}`);
      const data = await res.json();
      setGroups(data.groups || []);
    } finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleJoin = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setJoining(id);
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setGroups(prev => prev.map(g => g.id === id ? { ...g, isMember: data.joined, member_count: data.joined ? g.member_count + 1 : g.member_count - 1 } : g));
      fire(data.joined ? "Joined group." : "Left group.");
    }
    setJoining(null);
  };

  const handleCreate = async () => {
    setFormError("");
    if (!form.name || !form.description) { setFormError("Name and description required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed."); return; }
      setGroups(prev => [data.group, ...prev]);
      setShowModal(false);
      setForm({ name: "", description: "", category: "islam", type: "public" });
      fire("Group created.");
    } catch { setFormError("Failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Groups</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Join topic-focused public or private communities.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Create group</button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`pill ${activeCategory === cat.id ? "pill-active" : ""}`}>{cat.label}</button>
          ))}
        </div>

        {loading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "60px 0" }}>Loading...</p>
          : groups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 12 }}>No groups yet. Start the first one.</p>
              <button onClick={() => setShowModal(true)} className="btn btn-secondary">Create group</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {groups.map(g => (
                <Link key={g.id} href={`/groups/${g.id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "18px 20px", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{g.name}</h3>
                      <span style={{ fontSize: 11, color: g.type === "private" ? "#7c3aed" : "#0d7377", background: g.type === "private" ? "#f5f3ff" : "#e6f7f8", border: `1px solid ${g.type === "private" ? "#ddd6fe" : "#b2e4e6"}`, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>{g.type}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 14, flex: 1 }}>{g.description.substring(0, 120)}{g.description.length > 120 ? "..." : ""}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f9fafb" }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{g.member_count} member{g.member_count !== 1 ? "s" : ""}</span>
                      <button
                        onClick={e => handleJoin(g.id, e)}
                        disabled={joining === g.id}
                        className={`btn ${g.isMember ? "btn-secondary" : "btn-primary"} btn-sm`}
                        style={{ fontSize: 12 }}>
                        {g.isMember ? "Joined" : "Join"}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Create a group</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Name</label><input placeholder="Group name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Description</label><textarea placeholder="What's this group about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "none", minHeight: 80 }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Visibility</label>
                  <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
                    {["public", "private"].map(t => (
                      <button key={t} onClick={() => setForm({ ...form, type: t })}
                        style={{ flex: 1, padding: "7px 0", border: `1px solid ${form.type === t ? "#0d7377" : "#e5e7eb"}`, borderRadius: 7, background: form.type === t ? "#e6f7f8" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: form.type === t ? 600 : 400, color: form.type === t ? "#0d7377" : "#6b7280" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {form.type === "private" && (
                <div style={{ padding: "10px 12px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 7 }}>
                  <p style={{ fontSize: 12.5, color: "#6d28d9" }}>Private groups are invite-only. Only members can see posts.</p>
                </div>
              )}
              {formError && <p style={{ fontSize: 13, color: "#dc2626" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>{submitting ? "Creating..." : "Create group"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
