"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Job {
  id: string; user_id: string; title: string; company: string; description: string;
  category: string; type: string; location_type: string; location: string | null;
  salary: string | null; apply_url: string | null; apply_email: string | null;
  active: boolean; created_at: string;
  poster: { name: string; username: string; is_verified: boolean };
}

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance", "internship"];
const LOCATION_TYPES = ["remote", "hybrid", "on-site"];

const TYPE_COLORS: Record<string, string> = {
  "full-time": "#0d7377", "part-time": "#7c3aed", "contract": "#d97706",
  "freelance": "#db2777", "internship": "#0891b2"
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function expiresIn(d: string) {
  const msLeft = 86400000 - (Date.now() - new Date(d).getTime());
  if (msLeft <= 0) return "expired";
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h === 0) return `${m}m left`;
  return `${h}h ${m}m left`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "", company: "", description: "", category: "tech",
    type: "full-time", location_type: "remote", location: "",
    salary: "", apply_url: "", apply_email: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (activeType) params.set("type", activeType);
      if (activeLocation) params.set("location_type", activeLocation);
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } finally { setLoading(false); }
  }, [activeCategory, activeType, activeLocation]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.title || !form.company || !form.description) { setFormError("Title, company, and description required."); return; }
    if (!form.apply_url && !form.apply_email) { setFormError("Provide an apply URL or email."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed."); return; }
      setJobs(prev => [data.job, ...prev]);
      setShowModal(false);
      setForm({ title: "", company: "", description: "", category: "tech", type: "full-time", location_type: "remote", location: "", salary: "", apply_url: "", apply_email: "" });
      setToast("Job posted."); setTimeout(() => setToast(""), 2500);
    } catch { setFormError("Failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Jobs</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Halal opportunities posted by Muslim-led teams and allies.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Post a job</button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`pill ${activeCategory === cat.id ? "pill-active" : ""}`}>{cat.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setActiveType("")} className={`pill ${activeType === "" ? "pill-active" : ""}`}>All types</button>
            {JOB_TYPES.map(t => (
              <button key={t} onClick={() => setActiveType(t === activeType ? "" : t)} className={`pill ${activeType === t ? "pill-active" : ""}`}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setActiveLocation("")} className={`pill ${activeLocation === "" ? "pill-active" : ""}`}>All locations</button>
            {LOCATION_TYPES.map(l => (
              <button key={l} onClick={() => setActiveLocation(l === activeLocation ? "" : l)} className={`pill ${activeLocation === l ? "pill-active" : ""}`}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "60px 0" }}>Loading...</p>
          : jobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 12 }}>No jobs found. Be the first to post.</p>
              <button onClick={() => setShowModal(true)} className="btn btn-secondary">Post a job</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {jobs.map(job => (
                <div key={job.id} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>{job.title}</h3>
                        <span style={{ fontSize: 11, color: "#fff", background: TYPE_COLORS[job.type] || "#6b7280", borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>{job.type}</span>
                        <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>{job.location_type}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{job.company}</div>
                      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 10 }}>{job.description.substring(0, 200)}{job.description.length > 200 ? "..." : ""}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        {job.location && <span style={{ fontSize: 12, color: "#9ca3af" }}>{job.location}</span>}
                        {job.salary && <span style={{ fontSize: 12, color: "#9ca3af" }}>{job.salary}</span>}
                        <span suppressHydrationWarning style={{ fontSize: 11.5, color: "#dc2626", fontWeight: 500, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "1px 6px" }}>{expiresIn(job.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                      {job.apply_url && (
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>Apply</a>
                      )}
                      {job.apply_email && (
                        <a href={`mailto:${job.apply_email}`} className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>Email</a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, paddingTop: 10, borderTop: "1px solid #f9fafb" }}>
                    <div className="avatar avatar-emerald" style={{ width: 20, height: 20, fontSize: 9 }}>{job.poster?.name?.[0]}</div>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>posted by {job.poster?.name}</span>
                    {job.poster?.is_verified && <span style={{ fontSize: 11, color: "#0d7377" }}>verified</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Post a job</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>
              <div className="two-col">
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Job title</label><input placeholder="e.g. Backend Engineer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Company</label><input placeholder="Company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Description</label><textarea placeholder="Role, responsibilities, requirements..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "none", minHeight: 90 }} /></div>
              <div className="three-col">
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Location</label>
                  <select value={form.location_type} onChange={e => setForm({ ...form, location_type: e.target.value })}>
                    {LOCATION_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="two-col">
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>City / location (optional)</label><input placeholder="e.g. London, UK" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Salary range (optional)</label><input placeholder="e.g. £60k–£80k" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Apply URL (optional)</label><input placeholder="https://..." value={form.apply_url} onChange={e => setForm({ ...form, apply_url: e.target.value })} /></div>
              <div><label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Apply email (optional)</label><input placeholder="jobs@company.com" value={form.apply_email} onChange={e => setForm({ ...form, apply_email: e.target.value })} /></div>
              {formError && <p style={{ fontSize: 13, color: "#dc2626" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>{submitting ? "Posting..." : "Post job"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
