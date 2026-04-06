"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import SkeletonPost from "@/components/SkeletonPost";
import { CATEGORIES } from "@/lib/data";
import { useAuth } from "@/lib/hooks/useAuth";

interface PostAuthor {
  id: string; name: string; username: string; role: string | null;
  is_verified: boolean; admin_verified: boolean; github_verified: boolean; orcid_verified: boolean; avatar_url?: string;
}
interface Reply {
  id: string; content: string; created_at: string; user_id: string;
  profiles: { name: string; username: string; is_verified: boolean };
}
interface Poll {
  id: string; options: string[]; counts: Record<number, number>; myVote: number | null;
}
interface Post {
  id: string; user_id: string; content: string; category: string; tags: string[];
  pinned: boolean; created_at: string; scheduled_at: string | null;
  author: PostAuthor; likeCount: number; liked: boolean; replyCount: number;
  bookmarked: boolean; poll: Poll | null;
}
interface Suggestion {
  id: string; name: string; username: string; is_verified: boolean;
  avatar_url?: string; role: string | null; overlap: number;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function PollWidget({ poll, postId, onVote }: { poll: Poll; postId: string; onVote: (pollId: string, optIdx: number, newCounts: Record<number, number>, newVote: number | null) => void }) {
  const total = Object.values(poll.counts).reduce((a, b) => a + b, 0);
  const [loading, setLoading] = useState(false);

  const vote = async (idx: number) => {
    if (loading) return;
    setLoading(true);
    const res = await fetch(`/api/polls/${poll.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option_index: idx }) });
    const data = await res.json();
    if (res.ok) {
      const newCounts = { ...poll.counts };
      if (poll.myVote !== null && poll.myVote !== undefined) {
        newCounts[poll.myVote] = Math.max(0, (newCounts[poll.myVote] || 1) - 1);
      }
      if (data.voted) newCounts[idx] = (newCounts[idx] || 0) + 1;
      onVote(poll.id, idx, newCounts, data.voted ? idx : null);
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: "10px 0 12px", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      {poll.options.map((opt, i) => {
        const count = poll.counts[i] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isMyVote = poll.myVote === i;
        return (
          <button key={i} onClick={() => vote(i)} disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", borderBottom: i < poll.options.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: isMyVote ? "#e6f7f8" : "#f9fafb", transition: "width 0.3s" }} />
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <span style={{ fontSize: 13.5, color: isMyVote ? "#0d7377" : "#374151", fontWeight: isMyVote ? 600 : 400 }}>{opt}</span>
              <span style={{ fontSize: 12.5, color: "#9ca3af", minWidth: 40, textAlign: "right" }}>{pct}%</span>
            </div>
          </button>
        );
      })}
      <div style={{ padding: "7px 14px", background: "#fafafa", borderTop: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{total} vote{total !== 1 ? "s" : ""}{poll.myVote !== null ? " · you voted" : ""}</span>
      </div>
    </div>
  );
}

function PostCard({ post, onLike, onBookmark, onPin, onReport, currentUserId, isAdmin, onPollVote }: {
  post: Post; onLike: (id: string) => void; onBookmark: (id: string) => void;
  onPin: (id: string) => void; onReport: (id: string) => void;
  currentUserId?: string; isAdmin?: boolean; onPollVote: (postId: string, pollId: string, optIdx: number, newCounts: Record<number, number>, newVote: number | null) => void;
}) {
  const cat = CATEGORIES.find(c => c.id === post.category);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyCount, setReplyCount] = useState(post.replyCount);
  const [showMenu, setShowMenu] = useState(false);

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
    const res = await fetch(`/api/posts/${post.id}/replies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: replyText }) });
    const data = await res.json();
    if (res.ok) { setReplies(prev => [...prev, data.reply]); setReplyCount(c => c + 1); setReplyText(""); }
    setPosting(false);
  };

  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid #f3f4f6" }}>
      {post.pinned && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 500 }}>Pinned post</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <Link href={`/profile/${post.author?.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
          <Avatar name={post.author?.name || "U"} url={post.author?.avatar_url} size={34} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
              <Link href={`/profile/${post.author?.username}`} style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", textDecoration: "none" }}>{post.author?.name}</Link>
              {post.author?.admin_verified && (
                <span title="Verified by IMS" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", background: "#1d4ed8", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              )}
              {post.author?.github_verified && <span className="badge badge-github" style={{ fontSize: 10.5 }}>GitHub</span>}
              {post.author?.orcid_verified && <span className="badge badge-orcid" style={{ fontSize: 10.5 }}>ORCID</span>}
              <span style={{ color: "#e5e7eb" }}>·</span>
              <span suppressHydrationWarning style={{ fontSize: 12.5, color: "#9ca3af" }}>{timeAgo(post.created_at)}</span>
              {cat && <><span style={{ color: "#e5e7eb" }}>·</span><span style={{ fontSize: 12.5, color: "#9ca3af" }}>{cat.label}</span></>}
            </div>
            {/* Post menu */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button onClick={() => setShowMenu(m => !m)} className="icon-btn" style={{ width: 26, height: 26 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
              {showMenu && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, zIndex: 40, minWidth: 140, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                  {isAdmin && (
                    <button onClick={() => { onPin(post.id); setShowMenu(false); }}
                      style={{ width: "100%", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", textAlign: "left", color: "#374151" }}>
                      {post.pinned ? "Unpin" : "Pin post"}
                    </button>
                  )}
                  {currentUserId && (
                    <button onClick={() => { onReport(post.id); setShowMenu(false); }}
                      style={{ width: "100%", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", textAlign: "left", color: "#dc2626" }}>
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, marginBottom: 10 }}>{post.content}</p>

          {/* Poll */}
          {post.poll && (
            <PollWidget poll={post.poll} postId={post.id}
              onVote={(pollId, optIdx, newCounts, newVote) => onPollVote(post.id, pollId, optIdx, newCounts, newVote)} />
          )}

          {/* Tags — clickable */}
          {post.tags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {post.tags.map(t => (
                <Link key={t} href={`/hashtags/${encodeURIComponent(t)}`} className="tag" style={{ textDecoration: "none" }}>#{t}</Link>
              ))}
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
                  <div className="avatar avatar-emerald" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>{r.profiles?.name?.[0] || "U"}</div>
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
                  <input placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                    style={{ fontSize: 13, padding: "7px 10px" }} />
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [tags, setTags] = useState("");
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([]);

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const fetchPosts = useCallback(async (category: string) => {
    setLoading(true);
    setFetchError("");
    try {
      const params = category !== "all" ? `?category=${category}` : "";
      const res = await fetch(`/api/posts${params}`);
      const data = await res.json();
      if (!res.ok) { setFetchError(data.error || "Failed."); return; }
      setPosts(data.posts || []);
    } catch { setFetchError("Failed to load posts."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(activeCategory); }, [activeCategory, fetchPosts]);

  useEffect(() => {
    fetch("/api/people/suggestions").then(r => r.json()).then(d => setSuggestions(d.suggestions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/trending/hashtags").then(r => r.json()).then(d => setTrendingHashtags(d.hashtags || [])).catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      const tagsArr = tags.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
      const validPollOptions = pollOptions.filter(o => o.trim());
      const res = await fetch("/api/posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postText, category: selectedCat, tags: tagsArr, poll_options: showPoll && validPollOptions.length >= 2 ? validPollOptions : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { fire(data.error || "Failed to post."); return; }
      setPosts(prev => [data.post, ...prev]);
      fire("Post published.");
      setPostText(""); setShowCompose(false); setShowPoll(false); setPollOptions(["", ""]); setTags("");
    } catch { fire("Failed to post."); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p));
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  };

  const handleBookmark = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p));
    await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: postId }) });
  };

  const handlePin = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/pin`, { method: "POST" });
    const data = await res.json();
    if (res.ok) { setPosts(prev => prev.map(p => p.id === postId ? { ...p, pinned: data.pinned } : p)); fire(data.pinned ? "Post pinned." : "Post unpinned."); }
  };

  const handlePollVote = (postId: string, pollId: string, _optIdx: number, newCounts: Record<number, number>, newVote: number | null) => {
    setPosts(prev => prev.map(p => p.id === postId && p.poll ? { ...p, poll: { ...p.poll, counts: newCounts, myVote: newVote } } : p));
  };

  const handleFollow = async (userId: string, username: string) => {
    setFollowedIds(prev => { const s = new Set(prev); s.add(userId); return s; });
    await fetch(`/api/profiles/${username}/follow`, { method: "POST" });
    fire(`Following ${username}.`);
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportPostId) return;
    setReportSubmitting(true);
    await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: reportPostId, reason: reportReason }) });
    setReportPostId(null); setReportReason("");
    fire("Reported. Our team will review it.");
    setReportSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

        {/* Mobile: horizontal category pills */}
        <div className="category-pills" style={{ gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 8, WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 999, border: `1px solid ${activeCategory === cat.id ? "#0d7377" : "#e5e7eb"}`, background: activeCategory === cat.id ? "#e6f7f8" : "#fff", color: activeCategory === cat.id ? "#0d7377" : "#6b7280", fontSize: 13, fontWeight: activeCategory === cat.id ? 600 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="feed-layout">

          {/* Left sidebar — desktop only */}
          <aside className="sidebar-desktop" style={{ position: "sticky", top: 72 }}>
            <p className="section-label" style={{ marginBottom: 10, padding: "0 10px" }}>Categories</p>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`sidebar-link ${activeCategory === cat.id ? "active" : ""}`}>{cat.label}</button>
            ))}
            <div style={{ height: 1, background: "#f3f4f6", margin: "16px 0" }} />
            {[
              ["People", "/people"], ["Ideas", "/ideas"], ["Startups", "/startups"], ["Groups", "/groups"], ["Mentorship", "/mentorship"],
              ...(profile ? [["Bookmarks", "/bookmarks"], ["My Profile", `/profile/${profile.username}`]] : []),
              ...(profile?.is_admin ? [["Admin", "/admin"]] : []),
            ].map(([l, h]) => <a key={h} href={h} className="sidebar-link">{l}</a>)}
          </aside>

          {/* Feed */}
          <main>
            {/* Compose */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
              {!showCompose ? (
                <button onClick={() => setShowCompose(true)} style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff", border: "none", textAlign: "left" }}>
                  <Avatar name={profile?.name || "U"} url={(profile as unknown as { avatar_url?: string })?.avatar_url} size={32} />
                  <span style={{ color: "#d1d5db", fontSize: 14 }}>Share something with the Ummah...</span>
                </button>
              ) : (
                <div style={{ padding: "14px 16px" }}>
                  <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="What's on your mind?" autoFocus
                    style={{ width: "100%", background: "transparent", border: "none", color: "#111827", fontSize: 14, resize: "none", outline: "none", minHeight: 88, boxShadow: "none" }} />

                  {/* Poll builder */}
                  {showPoll && (
                    <div style={{ marginBottom: 12, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                      {pollOptions.map((opt, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", borderBottom: i < pollOptions.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <input value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                            placeholder={`Option ${i + 1}`} style={{ flex: 1, border: "none", borderRadius: 0, fontSize: 13 }} />
                          {pollOptions.length > 2 && (
                            <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>×</button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 4 && (
                        <button onClick={() => setPollOptions(prev => [...prev, ""])} style={{ width: "100%", padding: "8px", fontSize: 13, color: "#0d7377", background: "#f5fbfb", border: "none", cursor: "pointer" }}>+ Add option</button>
                      )}
                    </div>
                  )}

                  {/* Desktop compose controls */}
                  <div className="compose-extras" style={{ flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {CATEGORIES.filter(c => c.id !== "all").slice(0, 5).map(cat => (
                          <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`pill ${selectedCat === cat.id ? "pill-active" : ""}`} style={{ fontSize: 11.5, padding: "3px 9px" }}>{cat.label}</button>
                        ))}
                        <button onClick={() => setShowPoll(v => !v)} style={{ fontSize: 11.5, padding: "3px 9px", border: `1px solid ${showPoll ? "#0d7377" : "#e5e7eb"}`, borderRadius: 20, background: showPoll ? "#e6f7f8" : "transparent", color: showPoll ? "#0d7377" : "#9ca3af", cursor: "pointer" }}>Poll</button>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setShowCompose(false); setShowPoll(false); setPollOptions(["", ""]); setTags(""); }} className="btn btn-ghost btn-sm">Cancel</button>
                        <button onClick={handlePost} disabled={posting} className="btn btn-primary btn-sm">{posting ? "Posting..." : "Post"}</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input placeholder="#tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={{ flex: 1, fontSize: 12.5, padding: "5px 10px" }} />
                    </div>
                  </div>

                  {/* Mobile compose controls — simple */}
                  <div className="compose-mobile-bar">
                    <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ fontSize: 13, padding: "6px 10px", flex: 1, maxWidth: 140 }}>
                      {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                      <button onClick={() => { setShowCompose(false); setShowPoll(false); setPollOptions(["", ""]); setTags(""); }} className="btn btn-ghost btn-sm">Cancel</button>
                      <button onClick={handlePost} disabled={posting} className="btn btn-primary btn-sm">{posting ? "..." : "Post"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{activeCategory === "all" ? "All posts" : CATEGORIES.find(c => c.id === activeCategory)?.label} · {posts.length}</span>
            </div>

            {loading ? (
              <div>{[1,2,3].map(i => <SkeletonPost key={i} />)}</div>
            ) : fetchError ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ color: "#dc2626", fontSize: 13.5 }}>{fetchError}</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 24px", border: "1px solid #f3f4f6", borderRadius: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e6f7f8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d7377" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
                  {activeCategory === "all" ? "The feed is quiet" : `No posts in ${CATEGORIES.find(c => c.id === activeCategory)?.label} yet`}
                </p>
                <p style={{ fontSize: 13.5, color: "#9ca3af", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
                  {activeCategory === "all"
                    ? "Be the first Muslim to post something today."
                    : `Be the first to share something in this category.`}
                </p>
                <button onClick={() => setShowCompose(true)} className="btn btn-primary btn-sm">Share something</button>
              </div>
            ) : posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} onBookmark={handleBookmark}
                  onPin={handlePin} onReport={id => setReportPostId(id)}
                  currentUserId={profile?.id} isAdmin={profile?.is_admin}
                  onPollVote={handlePollVote} />
              ))}
          </main>

          {/* Right sidebar — hidden on mobile */}
          <aside className="right-sidebar" style={{ position: "sticky", top: 72, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Follow suggestions */}
            {suggestions.length > 0 && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Who to follow</p>
                </div>
                {suggestions.slice(0, 4).map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: i < 3 ? "1px solid #f9fafb" : "none" }}>
                    <Link href={`/profile/${s.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                      <Avatar name={s.name} url={s.avatar_url} size={30} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/profile/${s.username}`} style={{ fontSize: 13, fontWeight: 600, color: "#111827", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</Link>
                      {s.role && <p style={{ fontSize: 11.5, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.role}</p>}
                    </div>
                    {!followedIds.has(s.id) ? (
                      <button onClick={() => handleFollow(s.id, s.username)} className="btn btn-primary btn-sm" style={{ fontSize: 11.5, flexShrink: 0 }}>Follow</button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: "#0d7377" }}>Following</span>
                    )}
                  </div>
                ))}
                <Link href="/people" style={{ display: "block", padding: "9px 14px", fontSize: 12.5, color: "#0d7377", textDecoration: "none", textAlign: "center", background: "#fafafa", borderTop: "1px solid #f3f4f6" }}>See all people</Link>
              </div>
            )}

            {trendingHashtags.length > 0 && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trending</p>
                  <span style={{ fontSize: 11, color: "#d1d5db" }}>7 days</span>
                </div>
                {trendingHashtags.slice(0, 7).map((h, i) => (
                  <Link key={h.tag} href={`/hashtags/${encodeURIComponent(h.tag)}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", textDecoration: "none", borderBottom: i < 6 ? "1px solid #f9fafb" : "none", transition: "background 0.1s" }}
                    className="hashtag-row">
                    <span style={{ fontSize: 13.5, color: "#111827", fontWeight: 500 }}>#{h.tag}</span>
                    <span style={{ fontSize: 11.5, color: "#9ca3af" }}>{h.count} post{h.count !== 1 ? "s" : ""}</span>
                  </Link>
                ))}
              </div>
            )}

            <div>
              <p className="section-label" style={{ marginBottom: 10 }}>Explore</p>
              {[["Events", "/events"], ["Jobs", "/jobs"], ["Research", "/papers"], ["Trending", "/trending"], ["Leaderboard", "/leaderboard"]].map(([l, h]) => (
                <Link key={h} href={h} className="sidebar-link" style={{ textDecoration: "none" }}>
                  {l}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* Report modal */}
      {reportPostId && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setReportPostId(null); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Report post</h2>
              <button onClick={() => setReportPostId(null)} className="icon-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "#6b7280" }}>Why are you reporting this post?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Spam or misleading", "Inappropriate content", "Harassment", "False information", "Other"].map(r => (
                  <button key={r} onClick={() => setReportReason(r)}
                    style={{ padding: "9px 12px", border: `1px solid ${reportReason === r ? "#0d7377" : "#e5e7eb"}`, borderRadius: 7, background: reportReason === r ? "#e6f7f8" : "#fff", cursor: "pointer", fontSize: 13.5, color: reportReason === r ? "#0d7377" : "#374151", textAlign: "left" }}>
                    {r}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setReportPostId(null)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button onClick={submitReport} disabled={!reportReason || reportSubmitting} className="btn btn-primary" style={{ flex: 2, justifyContent: "center", background: "#dc2626", borderColor: "#dc2626" }}>
                  {reportSubmitting ? "Reporting..." : "Submit report"}
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
