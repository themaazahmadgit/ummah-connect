"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface BookmarkItem {
  id: string;
  created_at: string;
  post_id: string | null;
  idea_id: string | null;
  startup_id: string | null;
  posts: { id: string; content: string; category: string; created_at: string; profiles: { name: string; username: string } } | null;
  ideas: { id: string; title: string; description: string; category: string; created_at: string; profiles: { name: string; username: string } } | null;
  startups: { id: string; name: string; tagline: string; category: string; created_at: string; profiles: { name: string; username: string } } | null;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "posts" | "ideas" | "startups">("all");

  useEffect(() => {
    fetch("/api/bookmarks")
      .then(r => r.json())
      .then(data => setBookmarks(data.bookmarks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookmarks.filter(b => {
    if (tab === "posts") return !!b.posts;
    if (tab === "ideas") return !!b.ideas;
    if (tab === "startups") return !!b.startups;
    return true;
  });

  const removeBookmark = async (b: BookmarkItem) => {
    setBookmarks(prev => prev.filter(x => x.id !== b.id));
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: b.post_id, idea_id: b.idea_id, startup_id: b.startup_id }),
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Bookmarks</h1>
        <p style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24 }}>Your saved posts, ideas, and startups.</p>

        <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6", marginBottom: 24 }}>
          {(["all", "posts", "ideas", "startups"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "9px 16px", fontSize: 13.5, fontWeight: tab === t ? 600 : 400,
                cursor: "pointer", border: "none", background: "transparent",
                color: tab === t ? "#0d7377" : "#6b7280",
                borderBottom: tab === t ? "2px solid #0d7377" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.1s", fontFamily: "inherit", textTransform: "capitalize",
              }}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af", fontSize: 13.5, textAlign: "center", padding: "48px 0" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Nothing saved yet.</p>
          </div>
        ) : (
          <div>
            {filtered.map(b => (
              <div key={b.id} style={{ padding: "16px 0", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {b.posts && (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#0d7377", background: "#e6f7f8", border: "1px solid #b2e4e6", borderRadius: 4, padding: "1px 6px" }}>Post</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{b.posts.profiles.name} · @{b.posts.profiles.username}</span>
                        <span style={{ fontSize: 12, color: "#d1d5db" }}>{CATEGORIES.find(c => c.id === b.posts!.category)?.label}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{b.posts.content}</p>
                    </>
                  )}
                  {b.ideas && (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "1px 6px" }}>Idea</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{b.ideas.profiles.name}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{b.ideas.title}</p>
                      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55 }}>{b.ideas.description}</p>
                    </>
                  )}
                  {b.startups && (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 4, padding: "1px 6px" }}>Startup</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{b.startups.profiles.name}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{b.startups.name}</p>
                      <p style={{ fontSize: 13, color: "#6b7280" }}>{b.startups.tagline}</p>
                    </>
                  )}
                </div>
                <button onClick={() => removeBookmark(b)} title="Remove bookmark"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4, borderRadius: 6, flexShrink: 0, transition: "color 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#d1d5db"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
