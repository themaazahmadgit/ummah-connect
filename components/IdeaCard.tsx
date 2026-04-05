"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";

interface Idea {
  id: string;
  title: string;
  description: string;
  author: { name: string; username: string; avatar: string; location: string };
  category: string;
  status: string;
  contributors: number;
  upvotes: number;
  tags: string[];
  timePosted: string;
}

const STATUS: Record<string, { label: string; color: string }> = {
  "open": { label: "Open", color: "#059669" },
  "in-progress": { label: "In Progress", color: "#2563eb" },
  "seeking-contributors": { label: "Seeking contributors", color: "#d97706" },
  "completed": { label: "Completed", color: "#6b7280" },
};

export default function IdeaCard({ idea }: { idea: Idea }) {
  const [joined, setJoined] = useState(false);
  const [up, setUp] = useState(false);
  const [votes, setVotes] = useState(idea.upvotes);
  const cat = CATEGORIES.find(c => c.id === idea.category);
  const status = STATUS[idea.status] || STATUS["open"];

  return (
    <div className="card card-interactive" style={{ padding: "18px" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <button
          onClick={() => { setUp(!up); setVotes(up ? votes - 1 : votes + 1); }}
          className={`upvote-btn ${up ? "active" : ""}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{votes}</span>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: status.color, fontWeight: 500 }}>{status.label}</span>
            {cat && <span style={{ fontSize: 12, color: "#9ca3af" }}>{cat.label}</span>}
            <span style={{ fontSize: 12, color: "#9ca3af" }}>· {idea.timePosted}</span>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>{idea.title}</h3>
          <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>{idea.description}</p>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {idea.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 10 }}>{idea.author.avatar}</div>
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>{idea.author.name}</span>
              <span style={{ fontSize: 12.5, color: "#d1d5db" }}>·</span>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{idea.contributors} contributors</span>
            </div>
            <button onClick={() => setJoined(!joined)}
              className={joined ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}>
              {joined ? "Joined" : "Join"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
