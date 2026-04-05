"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";
import { useAuth } from "@/lib/hooks/useAuth";

interface PostAuthor {
  id: string;
  name: string;
  username: string;
  role: string | null;
  is_verified: boolean;
  github_verified: boolean;
  orcid_verified: boolean;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { name: string; username: string; is_verified: boolean };
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  category: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  author: PostAuthor;
  likeCount: number;
  liked: boolean;
  replyCount: number;
  bookmarked: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const TRENDING = [
  { tag: "#IslamicAI", count: 847 },
  { tag: "#HalalFinance", count: 623 },
  { tag: "#MuslimDev", count: 412 },
  { tag: "#UmmahBuilds", count: 389 },
  { tag: "#HifzTech", count: 201 },
];

function PostCard({ post, onLike, onBookmark, currentUserId }: {
  post: Post;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  currentUserId?: string;
}) {
  const cat = CATEGORIES.find(c => c.id === post.category);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyCount, setReplyCount] = useState(post.replyCount);

  const loadReplies = async () => {
    if (repliesLoaded) { setShowReplies(v => !v); return; }
    const res = await fetch(`/api/posts/${post.id}/replies`);
    const data = await res.json();
    setReplies(data.replies || []);
    setRepliesLoaded(true);
    setShowReplies(true);
  };

  const submitReply = async () => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplies(prev => [...prev, data.reply]);
        setReplyCount(c => c + 1);
        setReplyText("");
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid #f3f4f6" }}>
      {post.pinned && <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 10 }}>Pinned</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <a href={`/profile/${post.author?.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
          <div className="avatar avatar-emerald" style={{ width: 34, height: 34 }}>
            {post.author?.name?.[0] || "U"}
          </div>
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
            <a href={`/profile/${post.author?.username}`} style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", textDecoration: "none" }}>{post.author?.name}</a>
            {post.author?.is_verified && <span className="badge badge-emerald">verified</span>}
            {post.author?.github_verified && <span className="badge badge-github">GitHub</span>}
            {post.author?.orcid_verified && <span className="badge badge-orcid">ORCID</span>}
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>@{post.author?.username}</span>
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span suppressHydrationWarning style={{ fontSize: 12.5, color: "#9ca3af" }}>{timeAgo(post.created_at)}</span>
            {cat && (
              <>
                <span style={{ color: "#e5e7eb" }}>·</span>
                <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{cat.label}</span>
              </>
            )}
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, marginBottom: 10 }}>{post.content}</p>
          {post.tags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <button onClick={() => onLike(post.id)} className={`feed-action ${post.liked ? "liked" : ""}`}>
              {post.likeCount > 0 ? post.likeCount.toLocaleString() : ""} {post.liked ? "liked" : "like"}
            </button>
            <button onClick={loadReplies} className="feed-action">
              {replyCount > 0 ? `${replyCount} ` : ""}reply
            </button>
            <button onClick={() => onBookmark(post.id)} className="feed-action" style={{ marginLeft: "auto", color: post.bookmarked ? "#0d7377" : undefined }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={post.bookmarked ? "#0d7377" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {post.bookmarked ? "saved" : "save"}
            </button>
          </div>

          {showReplies && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f9fafb" }}>
              {replies.map(r => (
                <div key={r.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div className="avatar avatar-emerald" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>
                    {r.profiles?.name?.[0] || "U"}
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{r.profiles?.name}</span>
                      <span suppressHydrationWarning style={{ fontSize: 11.5, color: "#d1d5db" }}>{timeAgo(r.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>{r.content}</p>
                  </div>
                </div>
              ))}
              {currentUserId && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                    style={{ fontSize: 13, padding: "7px 10px" }}
                  />
                  <button onClick={submitReply} disabled={posting || !replyText.trim()} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    {posting ? "..." : "Reply"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [postText, setPostText] = useState("");
  const [selectedCat, setSelectedCat] = useState("tech");
  const [toast, setToast] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const fetchPosts = useCallback(async (category: string) => {
    setLoading(true);
    setFetchError("");
    try {
      const params = category !== "all" ? `?category=${category}` : "";
      const res = await fetch(`/api/posts${params}`);
      const data = await res.json();
      if (!res.ok) { setFetchError(data.error || "Failed to load posts."); return; }
      setPosts(data.posts || []);
    } catch {
      setFetchError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(activeCategory); }, [activeCategory, fetchPosts]);

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postText, category: selectedCat }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Failed to post.");
      } else {
        setPosts(prev => [data.post, ...prev]);
        setToast("Post published.");
        setPostText("");
        setShowCompose(false);
      }
    } catch {
      setToast("Failed to post.");
    } finally {
      setPosting(false);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
      : p
    ));
    try { await fetch(`/api/posts/${postId}/like`, { method: "POST" }); } catch { /* silent */ }
  };

  const handleBookmark = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p));
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
    } catch { /* silent */ }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "192px 1fr 224px", gap: 40, alignItems: "start" }}>

          {/* Left sidebar */}
          <aside style={{ position: "sticky", top: 72 }}>
            <p className="section-label" style={{ marginBottom: 10, padding: "0 10px" }}>Categories</p>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`sidebar-link ${activeCategory === cat.id ? "active" : ""}`}>
                {cat.label}
              </button>
            ))}
            <div style={{ height: 1, background: "#f3f4f6", margin: "16px 0" }} />
            {[
              ["People", "/people"],
              ["Ideas", "/ideas"],
              ["Startups", "/startups"],
              ...(profile ? [["Bookmarks", "/bookmarks"], ["My Profile", `/profile/${profile.username}`]] : []),
              ...(profile?.is_admin ? [["Admin", "/admin"]] : []),
            ].map(([l, h]) => (
              <a key={h} href={h} className="sidebar-link">{l}</a>
            ))}
          </aside>

          {/* Feed */}
          <main>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
              {!showCompose ? (
                <button onClick={() => setShowCompose(true)}
                  style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff", border: "none", textAlign: "left" }}>
                  <div className="avatar avatar-emerald" style={{ width: 32, height: 32, flexShrink: 0 }}>
                    {profile?.name?.[0] || "U"}
                  </div>
                  <span style={{ color: "#d1d5db", fontSize: 14 }}>Share something with the Ummah...</span>
                </button>
              ) : (
                <div style={{ padding: "14px 16px" }}>
                  <textarea value={postText} onChange={e => setPostText(e.target.value)}
                    placeholder="What's on your mind?" autoFocus
                    style={{ width: "100%", background: "transparent", border: "none", color: "#111827", fontSize: 14, resize: "none", outline: "none", minHeight: 88, boxShadow: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {CATEGORIES.filter(c => c.id !== "all").slice(0, 5).map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                          className={`pill ${selectedCat === cat.id ? "pill-active" : ""}`}
                          style={{ fontSize: 11.5, padding: "3px 9px" }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setShowCompose(false)} className="btn btn-ghost btn-sm">Cancel</button>
                      <button onClick={handlePost} disabled={posting} className="btn btn-primary btn-sm">
                        {posting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>
                {activeCategory === "all" ? "All posts" : CATEGORIES.find(c => c.id === activeCategory)?.label}
                {" "}· {posts.length}
              </span>
              <select style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 12.5, cursor: "pointer", outline: "none", width: "auto" }}>
                <option>Latest</option>
                <option>Top</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
              </div>
            ) : fetchError ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ color: "#dc2626", fontSize: 13.5 }}>{fetchError}</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Nothing yet. Be the first.</p>
                <button onClick={() => setShowCompose(true)} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>Share something</button>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} onBookmark={handleBookmark} currentUserId={profile?.id} />
              ))
            )}
          </main>

          {/* Right sidebar */}
          <aside style={{ position: "sticky", top: 72 }}>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 5, height: 5, background: "#0d7377", borderRadius: "50%" }} />
                <span className="section-label">Notice</span>
              </div>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.55, marginBottom: 10 }}>
                Global Muslim Tech Summit 2025 — registration open. Dubai, Ramadan.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>Register</button>
            </div>

            <p className="section-label" style={{ marginBottom: 10 }}>Trending</p>
            {TRENDING.map(({ tag, count }, i) => (
              <div key={tag} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 4 ? "1px solid #f9fafb" : "none" }}>
                <span className="tag" style={{ fontSize: 13 }}>{tag}</span>
                <span style={{ fontSize: 11.5, color: "#d1d5db" }}>{count}</span>
              </div>
            ))}
          </aside>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
