"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Paper {
  id: string;
  doi: string;
  title: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  abstract: string | null;
  url: string;
  category: string;
  relevance_note: string | null;
  created_at: string;
  upvoteCount: number;
  upvoted: boolean;
  author: { name: string; username: string; is_verified: boolean; orcid_verified: boolean };
}

interface DOIPreview {
  title: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  abstract: string | null;
  url: string;
  doi: string;
}

function PaperCard({ paper, onUpvote }: { paper: Paper; onUpvote: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      {/* Fixed metadata header — non-changeable */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <a href={paper.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", lineHeight: 1.45, marginBottom: 6 }}>
              {paper.title}
            </h3>
          </a>
          <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 4 }}>
            {paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ` +${paper.authors.length - 4} more` : ""}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {paper.journal && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>{paper.journal}</span>}
            {paper.year && <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>}
            {paper.year && <span style={{ fontSize: 12, color: "#9ca3af" }}>{paper.year}</span>}
            <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11.5, color: "#0d7377", textDecoration: "none", fontFamily: "monospace" }}>
              DOI:{paper.doi}
            </a>
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>
          {CATEGORIES.find(c => c.id === paper.category)?.label || paper.category}
        </span>
      </div>

      {/* Abstract collapsible */}
      {paper.abstract && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: expanded ? 999 : 3, WebkitBoxOrient: "vertical" }}>
            {paper.abstract}
          </p>
          <button onClick={() => setExpanded(!expanded)}
            style={{ fontSize: 12, color: "#0d7377", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}>
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>
      )}

      {/* Relevance note from submitter */}
      {paper.relevance_note && (
        <div style={{ padding: "10px 12px", background: "#f5fbfb", border: "1px solid #b2e4e6", borderRadius: 7, marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: "#0a5f63", fontWeight: 600, marginBottom: 3 }}>Why this matters</p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{paper.relevance_note}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 10 }}>{paper.author?.name?.[0]}</div>
          <a href={`/profile/${paper.author?.username}`} style={{ fontSize: 12.5, color: "#6b7280", textDecoration: "none" }}>{paper.author?.name}</a>
          {paper.author?.orcid_verified && <span className="badge badge-orcid" style={{ fontSize: 10 }}>ORCID</span>}
          {paper.author?.is_verified && <span className="badge badge-emerald" style={{ fontSize: 10 }}>verified</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>
            View paper
          </a>
          <button onClick={() => onUpvote(paper.id)}
            className={`btn ${paper.upvoted ? "btn-primary" : "btn-secondary"} btn-sm`}
            style={{ fontSize: 11.5 }}>
            ▲ {paper.upvoteCount}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [doi, setDoi] = useState("");
  const [preview, setPreview] = useState<DOIPreview | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [relevanceNote, setRelevanceNote] = useState("");
  const [category, setCategory] = useState("science");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toast, setToast] = useState("");

  const fetchPapers = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const params = cat !== "all" ? `?category=${cat}` : "";
      const res = await fetch(`/api/papers${params}`);
      const data = await res.json();
      setPapers(data.papers || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPapers(activeCategory); }, [activeCategory, fetchPapers]);

  const handleLookup = async () => {
    if (!doi.trim()) return;
    setLookupError(""); setPreview(null); setLookingUp(true);
    try {
      const res = await fetch(`/api/papers/lookup?doi=${encodeURIComponent(doi.trim())}`);
      const data = await res.json();
      if (!res.ok) { setLookupError(data.error || "DOI not found."); return; }
      setPreview(data);
    } catch { setLookupError("Failed to fetch. Check the DOI."); }
    finally { setLookingUp(false); }
  };

  const handleSubmit = async () => {
    setSubmitError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: doi.trim(), category, relevance_note: relevanceNote }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Failed to submit."); return; }
      setPapers(prev => [data.paper, ...prev]);
      setToast("Paper submitted.");
      setShowModal(false);
      setDoi(""); setPreview(null); setRelevanceNote(""); setCategory("science");
      setTimeout(() => setToast(""), 2500);
    } catch { setSubmitError("Failed to submit."); }
    finally { setSubmitting(false); }
  };

  const handleUpvote = async (paperId: string) => {
    setPapers(prev => prev.map(p => p.id === paperId
      ? { ...p, upvoted: !p.upvoted, upvoteCount: p.upvoted ? p.upvoteCount - 1 : p.upvoteCount + 1 }
      : p
    ));
    await fetch(`/api/papers/${paperId}/upvote`, { method: "POST" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Research Papers</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Verified academic research. Paste a DOI — metadata auto-fetched from CrossRef.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Submit paper</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f5fbfb", border: "1px solid #b2e4e6", borderRadius: 8, marginBottom: 28 }}>
          <span style={{ width: 5, height: 5, background: "#0d7377", borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#0a5f63" }}>Every paper is verified via DOI against the CrossRef database. No PDFs. No fake papers.</span>
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
        ) : papers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 12 }}>No papers yet. Be the first.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-secondary">Submit the first paper</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {papers.map(p => <PaperCard key={p.id} paper={p} onUpvote={handleUpvote} />)}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setPreview(null); setDoi(""); setLookupError(""); } }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Submit a research paper</h2>
              <button onClick={() => { setShowModal(false); setPreview(null); setDoi(""); setLookupError(""); }} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto" }}>
              {/* Step 1: DOI */}
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>DOI</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="e.g. 10.1038/nature12345 or paste full DOI URL"
                    value={doi}
                    onChange={e => { setDoi(e.target.value); setPreview(null); setLookupError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") handleLookup(); }}
                  />
                  <button onClick={handleLookup} disabled={lookingUp || !doi.trim()} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    {lookingUp ? "..." : "Lookup"}
                  </button>
                </div>
                {lookupError && <p style={{ fontSize: 12.5, color: "#dc2626", marginTop: 6 }}>{lookupError}</p>}
              </div>

              {/* Preview — fixed, non-editable */}
              {preview && (
                <div style={{ border: "1px solid #b2e4e6", borderRadius: 10, overflow: "hidden", background: "#f5fbfb" }}>
                  <div style={{ padding: "10px 14px", background: "#e6f7f8", borderBottom: "1px solid #b2e4e6", display: "flex", gap: 6, alignItems: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d7377" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 12.5, color: "#0a5f63", fontWeight: 600 }}>Paper found — metadata auto-filled</span>
                  </div>
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>{preview.title}</p>
                    <p style={{ fontSize: 12.5, color: "#6b7280" }}>{preview.authors.slice(0, 5).join(", ")}{preview.authors.length > 5 ? ` +${preview.authors.length - 5} more` : ""}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {preview.journal && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>{preview.journal}</span>}
                      {preview.year && <span style={{ fontSize: 12, color: "#9ca3af" }}>{preview.year}</span>}
                    </div>
                    {preview.abstract && (
                      <p style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {preview.abstract}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>DOI: {preview.doi}</p>
                  </div>
                </div>
              )}

              {preview && (
                <>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>
                      Why does this matter to the Ummah? <span style={{ color: "#d1d5db" }}>(optional)</span>
                    </label>
                    <textarea
                      placeholder="Share why this research is relevant to the Muslim community..."
                      value={relevanceNote}
                      onChange={e => setRelevanceNote(e.target.value)}
                      style={{ resize: "none", minHeight: 80 }}
                    />
                  </div>
                  {submitError && <p style={{ fontSize: 13, color: "#dc2626" }}>{submitError}</p>}
                  <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ justifyContent: "center", padding: "11px" }}>
                    {submitting ? "Submitting..." : "Submit paper"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
