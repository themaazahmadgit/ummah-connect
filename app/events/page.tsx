"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Event {
  id: string; user_id: string; title: string; description: string; category: string;
  type: string; location: string | null; url: string | null; starts_at: string; ends_at: string | null;
  rsvpCount: number; rsvped: boolean;
  organiser: { name: string; username: string; is_verified: boolean };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TYPE_COLORS: Record<string, string> = { online: "#0d7377", "in-person": "#d97706", hybrid: "#7c3aed" };

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "islam", type: "online", location: "", url: "", starts_at: "", ends_at: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const fetchEvents = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const params = cat !== "all" ? `?category=${cat}` : "";
      const res = await fetch(`/api/events${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(activeCategory); }, [activeCategory, fetchEvents]);

  const handleRSVP = async (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, rsvped: !e.rsvped, rsvpCount: e.rsvped ? e.rsvpCount - 1 : e.rsvpCount + 1 } : e));
    await fetch(`/api/events/${id}/rsvp`, { method: "POST" });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.title || !form.description || !form.starts_at) { setFormError("Title, description and start date required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed."); return; }
      setEvents(prev => [data.event, ...prev]);
      setShowModal(false);
      setForm({ title: "", description: "", category: "islam", type: "online", location: "", url: "", starts_at: "", ends_at: "" });
      setToast("Event posted."); setTimeout(() => setToast(""), 2500);
    } catch { setFormError("Failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Events</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Halaqas, conferences, hackathons, meetups — by and for Muslims.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Post event</button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`pill ${activeCategory === cat.id ? "pill-active" : ""}`}>{cat.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="card-grid" style={{ gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ border: "1px solid #f3f4f6", borderRadius: 16, padding: "18px 20px" }}>
                <span className="skeleton" style={{ display: "block", width: "65%", height: 16, marginBottom: 10 }} />
                <span className="skeleton" style={{ display: "block", width: "100%", height: 13, marginBottom: 6 }} />
                <span className="skeleton" style={{ display: "block", width: "50%", height: 13, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="skeleton" style={{ width: 60, height: 24, borderRadius: 8 }} />
                  <span className="skeleton" style={{ width: 80, height: 24, borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 24px", border: "1px solid #f3f4f6", borderRadius: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fdf2f8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.8"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 8 }}>No events yet</p>
            <p style={{ fontSize: 13.5, color: "#9ca3af", marginBottom: 20 }}>Post a Muslim conference, hackathon, or meetup.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">Post first event</button>
          </div>
        ) : (
          <div className="card-grid" style={{ gap: 12 }}>
              {events.map(e => (
                <div key={e.id} className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.35 }}>{e.title}</h3>
                    <span style={{ fontSize: 11, color: TYPE_COLORS[e.type] || "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>{e.type}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>{e.description}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span style={{ fontSize: 12.5, color: "#6b7280" }}>{formatDate(e.starts_at)}</span>
                    </div>
                    {e.location && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span style={{ fontSize: 12.5, color: "#6b7280" }}>{e.location}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f9fafb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 10 }}>{e.organiser?.name?.[0]}</div>
                      <span style={{ fontSize: 12.5, color: "#6b7280" }}>{e.organiser?.name}</span>
                      <span style={{ fontSize: 12, color: "#d1d5db" }}>· {e.rsvpCount} going</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>Info</a>}
                      <button onClick={() => handleRSVP(e.id)} className={`btn ${e.rsvped ? "btn-primary" : "btn-secondary"} btn-sm`} style={{ fontSize: 11.5 }}>
                        {e.rsvped ? "Going" : "RSVP"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Post an event</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, maxHeight: "65vh", overflowY: "auto" }}>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Title</label><input placeholder="Event name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Description</label><textarea placeholder="What, why, who should attend..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "none", minHeight: 80 }} /></div>
              <div className="two-col">
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {["online", "in-person", "hybrid"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Start date & time</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>End date & time (optional)</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Location (optional)</label><input placeholder="City, venue or 'Zoom'" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Event URL (optional)</label><input placeholder="https://" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
              {formError && <p style={{ fontSize: 13, color: "#dc2626" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>{submitting ? "Posting..." : "Post event"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
