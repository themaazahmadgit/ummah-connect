"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface StartupFounder {
  id: string;
  name: string;
  username: string;
  location: string | null;
  is_verified: boolean;
}

interface Startup {
  id: string;
  user_id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  stage: string;
  perks: string[];
  verified: boolean;
  created_at: string;
  founder: StartupFounder;
  backerCount: number;
  updateCount: number;
  backed: boolean;
}

function StartupCard({ startup, onBack }: { startup: Startup; onBack: (id: string) => void }) {
  const pct = Math.min(100, Math.round((startup.raised / startup.goal) * 100));

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{startup.name}</h3>
            {startup.verified && <span className="badge badge-emerald">verified</span>}
          </div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>{startup.tagline}</p>
        </div>
        <span style={{ fontSize: 11.5, color: "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>
          {startup.stage}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, marginBottom: 14 }}>{startup.description}</p>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 12.5, color: "#111827", fontWeight: 600 }}>${startup.raised.toLocaleString()} raised</span>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>of ${startup.goal.toLocaleString()} goal</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{startup.backerCount} backers</span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{pct}% funded</span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{startup.updateCount} updates</span>
        </div>
      </div>

      {startup.perks.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {startup.perks.map(p => <span key={p} style={{ fontSize: 11.5, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 8px" }}>{p}</span>)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 10 }}>{startup.founder?.name?.[0] || "F"}</div>
          <span style={{ fontSize: 12.5, color: "#6b7280" }}>{startup.founder?.name}</span>
          {startup.founder?.is_verified && <span className="badge badge-emerald" style={{ fontSize: 10 }}>verified</span>}
        </div>
        <button onClick={() => onBack(startup.id)}
          className={`btn ${startup.backed ? "btn-primary" : "btn-secondary"} btn-sm`}>
          {startup.backed ? "Backed" : "Back this"}
        </button>
      </div>
    </div>
  );
}

export default function StartupsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", tagline: "", description: "", category: "tech", goal: "", stage: "Pre-seed", email: "" });
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");

  const fetchStartups = useCallback(async (category: string) => {
    setLoading(true);
    setFetchError("");
    try {
      const params = category !== "all" ? `?category=${category}` : "";
      const res = await fetch(`/api/startups${params}`);
      const data = await res.json();
      if (!res.ok) { setFetchError(data.error || "Failed to load startups."); return; }
      setStartups(data.startups || []);
    } catch {
      setFetchError("Failed to load startups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStartups(activeCategory);
  }, [activeCategory, fetchStartups]);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.name || !form.description || !form.goal || !form.tagline) { setFormError("All required fields must be filled."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          category: form.category,
          goal: form.goal,
          stage: form.stage,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to list startup."); return; }
      setStartups(prev => [data.startup, ...prev]);
      setToast("Startup listed.");
      setShowModal(false);
      setForm({ name: "", tagline: "", description: "", category: "tech", goal: "", stage: "Pre-seed", email: "" });
      setTimeout(() => setToast(""), 2500);
    } catch {
      setFormError("Failed to list startup.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = async (startupId: string) => {
    setStartups(prev =>
      prev.map(s =>
        s.id === startupId
          ? { ...s, backed: !s.backed, backerCount: s.backed ? s.backerCount - 1 : s.backerCount + 1 }
          : s
      )
    );
    try {
      await fetch(`/api/startups/${startupId}/back`, { method: "POST" });
    } catch {
      setStartups(prev =>
        prev.map(s =>
          s.id === startupId
            ? { ...s, backed: !s.backed, backerCount: s.backed ? s.backerCount - 1 : s.backerCount + 1 }
            : s
        )
      );
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Startups</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Fund Muslim-led startups. Every dollar tracked in public.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">List startup</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 28 }}>
          <span style={{ width: 5, height: 5, background: "#059669", borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#6b7280" }}>All fundraising numbers are public. Founders post weekly updates.</span>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`pill ${activeCategory === cat.id ? "pill-active" : ""}`}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#dc2626", fontSize: 13.5 }}>{fetchError}</p>
          </div>
        ) : startups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 12 }}>Nothing yet. Be the first.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-secondary">List yours</button>
          </div>
        ) : (
          <div className="card-grid" style={{ gap: 14 }}>
            {startups.map(s => <StartupCard key={s.id} startup={s} onBack={handleBack} />)}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>List your startup</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "12px 20px", background: "#ecfdf5", borderBottom: "1px solid #d1fae5" }}>
              <p style={{ fontSize: 12.5, color: "#047857" }}>You agree to post weekly updates and maintain full fundraising transparency.</p>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, maxHeight: "55vh", overflowY: "auto" }}>
              {[["Startup name", "name", "NoorAI"], ["Tagline", "tagline", "AI-powered Islamic guidance"], ["Founder email", "email", "you@startup.io"], ["Goal (USD)", "goal", "150000"]].map(([label, key, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type={key === "goal" ? "number" : "text"} placeholder={ph} value={(form as Record<string, string>)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Description</label>
                <textarea placeholder="What are you building, why it matters, how funds will be used..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "none", minHeight: 90 }} />
              </div>
              <div className="two-col">
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Stage</label>
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                    {["Idea", "Pre-seed", "Seed", "Series A"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p style={{ fontSize: 13, color: "#dc2626" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>
                  {submitting ? "Listing..." : "List startup"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
