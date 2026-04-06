"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";

interface Post {
  id: string; content: string; category: string; created_at: string; tags: string[];
  likeCount: number; replyCount: number; liked: boolean; pinned: boolean;
  author: { id: string; name: string; username: string; is_verified: boolean; avatar_url?: string };
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function HashtagPage() {
  const { tag } = useParams() as { tag: string };
  const decoded = decodeURIComponent(tag);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decoded) return;
    fetch(`/api/posts?tag=${encodeURIComponent(decoded)}&limit=40`)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, [decoded]);

  const handleLike = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p));
    await fetch(`/api/posts/${id}/like`, { method: "POST" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 680 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>#{decoded}</h1>
          <p style={{ fontSize: 13.5, color: "#6b7280" }}>{loading ? "Loading..." : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}</p>
        </div>

        {loading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Loading...</p>
          : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 12 }}>No posts with #{decoded} yet.</p>
              <Link href="/feed" className="btn btn-primary btn-sm">Go to feed</Link>
            </div>
          ) : (
            <div>
              {posts.map((post, i) => (
                <div key={post.id} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: i < posts.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <Avatar name={post.author?.name} url={post.author?.avatar_url} size={32} />
                    <div>
                      <Link href={`/profile/${post.author?.username}`} style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", textDecoration: "none" }}>{post.author?.name}</Link>
                      <span suppressHydrationWarning style={{ fontSize: 12, color: "#d1d5db", marginLeft: 8 }}>{timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 10 }}>{post.content}</p>
                  {post.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {post.tags.map(t => (
                        <Link key={t} href={`/hashtags/${encodeURIComponent(t)}`} style={{ fontSize: 12.5, color: "#0d7377", textDecoration: "none" }}>#{t}</Link>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 14 }}>
                    <button onClick={() => handleLike(post.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: post.liked ? "#0d7377" : "#9ca3af", fontWeight: post.liked ? 600 : 400, padding: 0 }}>
                      {post.liked ? "♥" : "♡"} {post.likeCount}
                    </button>
                    <span style={{ fontSize: 12.5, color: "#9ca3af" }}>↩ {post.replyCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
