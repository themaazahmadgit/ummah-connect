"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";

interface MentorshipEntry {
  id: string; type: string; skills: string[]; bio: string | null; created_at: string;
  profile: { id: string; name: string; username: string; is_verified: boolean; avatar_url?: string; role: string | null; location: string | null };
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  mentor: { label: "Mentor", color: "#0d7377", bg: "#e6f7f8" },
  mentee: { label: "Mentee", color: "#7c3aed", bg: "#f5f3ff" },
  both:   { label: "Mentor & Mentee", color: "#d97706", bg: "#fffbeb" },
};

export default function MentorshipPage() {
  const [entries, setEntries] = useState<MentorshipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "mentor", skills: "", bio: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [myEntry, setMyEntry] = useState<MentorshipEntry | null>(null);

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeType !== "all") params.set("type", activeType);
    if (skillFilter) params.set("skill", skillFilter);
    const res = await fetch(`/api/mentorship?${params}`);
    const data = await res.json();
    setEntries(data.mentorship || []);
    setLoading(false);
  }, [activeType, skillFilter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async () => {
    setFormError("");
    const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    if (!skills.length) { setFormError("At least one skill required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/mentorship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, skills }) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed."); return; }
      setMyEntry(data.mentorship);
      setShowModal(false);
      fire("Listed on mentorship board.");
      fetchEntries();
    } catch { setFormError("Failed."); }
    finally { setSubmitting(false); }
  };

  const handleRemove = async () => {
    await fetch("/api/mentorship", { method: "DELETE" });
    setMyEntry(null);
    fire("Removed from mentorship board.");
    fetchEntries();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Mentorship</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Connect with mentors and mentees in the Muslim professional community.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {myEntry ? (
              <button onClick={handleRemove} className="btn btn-secondary">Remove my listing</button>
            ) : (
              <button onClick={() => setShowModal(true)} className="btn btn-primary">List yourself</button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "mentor", "mentee", "both"].map(t => (
              <button key={t} onClick={() => setActiveType(t)} className={`pill ${activeType === t ? "pill-active" : ""}`} style={{ textTransform: "capitalize" }}>{t === "all" ? "All" : TYPE_LABELS[t]?.label || t}</button>
            ))}
          </div>
          <input placeholder="Filter by skill..." value={skillFilter} onChange={e => setSkillFilter(e.target.value)} style={{ maxWidth: 200, fontSize: 13 }} />
        </div>

        {loading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "60px 0" }}>Loading...</p>
          : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 12 }}>No listings yet. Be the first.</p>
              <button onClick={() => setShowModal(true)} className="btn btn-secondary">List yourself</button>
            </div>
          ) : (
            <div className="card-grid" style={{ gap: 12 }}>
              {entries.map(e => {
                const t = TYPE_LABELS[e.type] || { label: e.type, color: "#6b7280", bg: "#f9fafb" };
                return (
                  <div key={e.id} className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Avatar name={e.profile?.name} url={e.profile?.avatar_url} size={36} />
                        <div>
                          <Link href={`/profile/${e.profile?.username}`} style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", textDecoration: "none" }}>{e.profile?.name}</Link>
                          {e.profile?.role && <p style={{ fontSize: 12, color: "#9ca3af" }}>{e.profile.role}</p>}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: t.color, background: t.bg, borderRadius: 5, padding: "2px 8px", flexShrink: 0 }}>{t.label}</span>
                    </div>
                    {e.bio && <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 10 }}>{e.bio}</p>}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                      {e.skills.map(s => (
                        <span key={s} style={{ fontSize: 11.5, color: "#0d7377", background: "#e6f7f8", borderRadius: 4, padding: "2px 7px" }}>{s}</span>
                      ))}
                    </div>
                    {e.profile?.location && <p style={{ fontSize: 12, color: "#9ca3af" }}>{e.profile.location}</p>}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>List yourself</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>I am a</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["mentor", "mentee", "both"].map(t => (
                    <button key={t} onClick={() => setForm({ ...form, type: t })}
                      style={{ flex: 1, padding: "9px 0", border: `1px solid ${form.type === t ? "#0d7377" : "#e5e7eb"}`, borderRadius: 7, background: form.type === t ? "#e6f7f8" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: form.type === t ? 600 : 400, color: form.type === t ? "#0d7377" : "#6b7280", textTransform: "capitalize" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Skills (comma separated)</label>
                <input placeholder="e.g. Python, Fiqh, Product Management" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Short bio (optional)</label>
                <textarea placeholder="What can you offer, or what are you looking for?" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: "none", minHeight: 70 }} />
              </div>
              {formError && <p style={{ fontSize: 13, color: "#dc2626" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>{submitting ? "Saving..." : "List me"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
