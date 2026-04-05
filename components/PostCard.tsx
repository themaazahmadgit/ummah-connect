"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";

interface Post {
  id: string;
  author: { name: string; username: string; avatar: string; role: string; verified: boolean; github: boolean; orcid: boolean; location: string };
  content: string;
  category: string;
  likes: number;
  comments: number;
  shares: number;
  time: string;
  tags: string[];
  pinned: boolean;
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(post.likes);
  const cat = CATEGORIES.find(c => c.id === post.category);

  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid #f3f4f6" }}>
      {post.pinned && (
        <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 10 }}>Pinned</p>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <div className="avatar avatar-emerald" style={{ width: 34, height: 34, flexShrink: 0 }}>
          {post.author.avatar}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{post.author.name}</span>
            {post.author.verified && <span className="badge badge-emerald">verified</span>}
            {post.author.github && <span className="badge badge-github">GitHub</span>}
            {post.author.orcid && <span className="badge badge-orcid">ORCID</span>}
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{post.author.username}</span>
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{post.time}</span>
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

          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={() => { setLiked(!liked); setCount(liked ? count - 1 : count + 1); }}
              className={`feed-action ${liked ? "liked" : ""}`}>
              {count.toLocaleString()} {liked ? "liked" : "like"}
            </button>
            <button className="feed-action">{post.comments} reply</button>
            <button className="feed-action">{post.shares} share</button>
          </div>
        </div>
      </div>
    </div>
  );
}
