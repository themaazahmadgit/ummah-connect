"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import { CATEGORIES } from "@/lib/data";

interface IdeaAuthor {
  id: string;
  name: string;
  username: string;
  location: string | null;
}

interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  tags: string[];
  created_at: string;
  author: IdeaAuthor;
  upvoteCount: number;
  contributorCount: number;
  upvoted: boolean;
  joined: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const STATUS_COLORS: Record<string, string> = {
  "open": "#059669",
  "in-progress": "#2563eb",
  "seeking-contributors": "#d97706",
  "completed": "#6b7280",
};

interface IdeaComment { id: string; content: string; created_at: string; author: { name: string; username: string } }

function IdeaCard({ idea, onUpvote, onJoin }: { idea: Idea; onUpvote: (id: string) => void; onJoin: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  const loadComments = async () => {
    if (commentsLoaded) { setShowComments(v => !v); return; }
    const res = await fetch(`/api/ideas/${idea.id}/comments`);
    const data = await res.json();
    setComments(data.comments || []);
    setCommentsLoaded(true);
    setShowComments(true);
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/ideas/${idea.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: commentText }) });
    const data = await res.json();
    if (res.ok) { setComments(prev => [...prev, data.comment]); setCommentText(""); }
    setPosting(false);
  };

  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{idea.title}</h3>
        <span style={{ fontSize: 11, color: STATUS_COLORS[idea.status] || "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>
          {idea.status}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>{idea.description}</p>
      {idea.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {idea.tags.map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f9fafb", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}>{idea.author?.name?.[0] || "U"}</div>
          <span style={{ fontSize: 12.5, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idea.author?.name}</span>
          <span suppressHydrationWarning style={{ fontSize: 12, color: "#d1d5db", flexShrink: 0 }}>{timeAgo(idea.created_at)}</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={loadComments} className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>
            {showComments ? "Hide" : "Comments"} {commentsLoaded ? `(${comments.length})` : ""}
          </button>
          <button onClick={() => onUpvote(idea.id)} className={`btn ${idea.upvoted ? "btn-primary" : "btn-secondary"} btn-sm`} style={{ fontSize: 11.5 }}>
            ▲ {idea.upvoteCount}
          </button>
          <button onClick={() => onJoin(idea.id)} className={`btn ${idea.joined ? "btn-primary" : "btn-secondary"} btn-sm`} style={{ fontSize: 11.5 }}>
            {idea.joined ? "Joined" : "Join"} · {idea.contributorCount}
          </button>
        </div>
      </div>

      {showComments && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
          {comments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: "flex", gap: 8 }}>
                  <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 9, flexShrink: 0 }}>{c.author?.name?.[0]}</div>
                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 10px", flex: 1 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{c.author?.name}</span>
                    <span suppressHydrationWarning style={{ fontSize: 11.5, color: "#d1d5db", marginLeft: 6 }}>{timeAgo(c.created_at)}</span>
                    <p style={{ fontSize: 13, color: "#374151", marginTop: 3, lineHeight: 1.55 }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
              style={{ flex: 1, fontSize: 13 }} />
            <button onClick={postComment} disabled={posting || !commentText.trim()} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IdeasPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "tech", tags: "" });
  const [toast, setToast] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");

  const fetchIdeas = useCallback(async (category: string) => {
    setLoading(true);
    setFetchError("");
    try {
      const params = category !== "all" ? `?category=${category}` : "";
      const res = await fetch(`/api/ideas${params}`);
      const data = await res.json();
      if (!res.ok) { setFetchError(data.error || "Failed to load ideas."); return; }
      setIdeas(data.ideas || []);
    } catch {
      setFetchError("Failed to load ideas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas(activeCategory);
  }, [activeCategory, fetchIdeas]);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.title || !form.description) { setFormError("Title and description are required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to publish idea."); return; }
      setIdeas(prev => [data.idea, ...prev]);
      setToast("Idea published.");
      setShowModal(false);
      setForm({ title: "", description: "", category: "tech", tags: "" });
      setTimeout(() => setToast(""), 2500);
    } catch {
      setFormError("Failed to publish idea.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (ideaId: string) => {
    setIdeas(prev =>
      prev.map(i =>
        i.id === ideaId
          ? { ...i, upvoted: !i.upvoted, upvoteCount: i.upvoted ? i.upvoteCount - 1 : i.upvoteCount + 1 }
          : i
      )
    );
    try {
      await fetch(`/api/ideas/${ideaId}/upvote`, { method: "POST" });
    } catch {
      setIdeas(prev =>
        prev.map(i =>
          i.id === ideaId
            ? { ...i, upvoted: !i.upvoted, upvoteCount: i.upvoted ? i.upvoteCount - 1 : i.upvoteCount + 1 }
            : i
        )
      );
    }
  };

  const handleJoin = async (ideaId: string) => {
    setIdeas(prev =>
      prev.map(i =>
        i.id === ideaId
          ? { ...i, joined: !i.joined, contributorCount: i.joined ? i.contributorCount - 1 : i.contributorCount + 1 }
          : i
      )
    );
    try {
      await fetch(`/api/ideas/${ideaId}/join`, { method: "POST" });
    } catch {
      setIdeas(prev =>
        prev.map(i =>
          i.id === ideaId
            ? { ...i, joined: !i.joined, contributorCount: i.joined ? i.contributorCount - 1 : i.contributorCount + 1 }
            : i
        )
      );
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Ideas</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>Post an idea publicly. Find contributors. Make it real.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">New idea</button>
        </div>

        <div className="scroll-row" style={{ marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`pill ${activeCategory === cat.id ? "pill-active" : ""}`}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card-grid">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ border: "1px solid #f3f4f6", borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="skeleton" style={{ width: "55%", height: 16 }} />
                  <span className="skeleton" style={{ width: 56, height: 20, borderRadius: 6 }} />
                </div>
                <span className="skeleton" style={{ display: "block", width: "100%", height: 13, marginBottom: 6 }} />
                <span className="skeleton" style={{ display: "block", width: "80%", height: 13, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                  <span className="skeleton" style={{ width: 80, height: 14, marginTop: 7 }} />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#dc2626", fontSize: 13.5 }}>{fetchError}</p>
          </div>
        ) : ideas.length === 0 ? (
          <EmptyState
            icon="idea"
            title={activeCategory === "all" ? "No ideas yet" : `No ideas in ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
            body="Be the first to share an idea with the ummah. Find contributors and make it real."
            action={<button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">Post the first idea</button>}
          />
        ) : (
          <div className="card-grid">
            {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} onJoin={handleJoin} />)}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>New idea</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Title</label>
                <input placeholder="What's the idea?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Description</label>
                <textarea placeholder="Describe the problem, solution, and how people can contribute..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "none", minHeight: 100 }} />
              </div>
              <div className="two-col" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Tags</label>
                  <input placeholder="comma, separated" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              {formError && <p style={{ fontSize: 13, color: "#dc2626" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>
                  {submitting ? "Publishing..." : "Publish idea"}
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
