"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface TrendingPost { id: string; content: string; category: string; created_at: string; _count: number; profiles: { name: string; username: string }; }
interface TrendingIdea { id: string; title: string; description: string; category: string; _count: number; profiles: { name: string; username: string }; }
interface TrendingPaper { id: string; title: string; journal: string; year: number; _count: number; profiles: { name: string; username: string }; }
interface TrendingStartup { id: string; name: string; tagline: string; raised: number; goal: number; _count: number; profiles: { name: string; username: string }; }

const PERIODS = [{ id: "24h", label: "24h" }, { id: "7d", label: "7 days" }, { id: "30d", label: "30 days" }];

export default function TrendingPage() {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<{ posts: TrendingPost[]; ideas: TrendingIdea[]; papers: TrendingPaper[]; startups: TrendingStartup[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trending?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const tabs = [
    { id: "posts", label: "Posts", count: data?.posts.length || 0 },
    { id: "ideas", label: "Ideas", count: data?.ideas.length || 0 },
    { id: "papers", label: "Papers", count: data?.papers.length || 0 },
    { id: "startups", label: "Startups", count: data?.startups.length || 0 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Trending</h1>
            <p style={{ fontSize: 13.5, color: "#6b7280" }}>What the Ummah is engaging with most.</p>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 3 }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{ fontSize: 12.5, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: period === p.id ? 600 : 400, background: period === p.id ? "#0d7377" : "transparent", color: period === p.id ? "#fff" : "#6b7280", transition: "all 0.15s" }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #f3f4f6", paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontSize: 13.5, padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? "#0d7377" : "#6b7280", borderBottom: activeTab === tab.id ? "2px solid #0d7377" : "2px solid transparent", marginBottom: -1 }}>
              {tab.label} {!loading && <span style={{ fontSize: 11, color: activeTab === tab.id ? "#0d7377" : "#d1d5db" }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "60px 0" }}>Loading...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {activeTab === "posts" && (data?.posts || []).map((p, i) => (
              <div key={p.id} className="card" style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: i < 3 ? "#0d7377" : "#d1d5db", minWidth: 28, textAlign: "center" }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, color: "#111827", lineHeight: 1.6, marginBottom: 8 }}>{p.content.substring(0, 180)}{p.content.length > 180 ? "..." : ""}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>by {p.profiles?.name}</span>
                    <span style={{ fontSize: 12, color: "#0d7377", fontWeight: 600 }}>{p._count} likes</span>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "ideas" && (data?.ideas || []).map((idea, i) => (
              <Link key={idea.id} href={`/ideas`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: i < 3 ? "#0d7377" : "#d1d5db", minWidth: 28, textAlign: "center" }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{idea.title}</h3>
                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{idea.description.substring(0, 120)}...</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>by {idea.profiles?.name}</span>
                      <span style={{ fontSize: 12, color: "#0d7377", fontWeight: 600 }}>{idea._count} upvotes</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {activeTab === "papers" && (data?.papers || []).map((paper, i) => (
              <div key={paper.id} className="card" style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: i < 3 ? "#0d7377" : "#d1d5db", minWidth: 28, textAlign: "center" }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{paper.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {paper.journal && <span style={{ fontSize: 12, color: "#6b7280" }}>{paper.journal} · {paper.year}</span>}
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>shared by {paper.profiles?.name}</span>
                    <span style={{ fontSize: 12, color: "#0d7377", fontWeight: 600 }}>{paper._count} upvotes</span>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "startups" && (data?.startups || []).map((s, i) => (
              <div key={s.id} className="card" style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: i < 3 ? "#0d7377" : "#d1d5db", minWidth: 28, textAlign: "center" }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{s.name}</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{s.tagline}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#0d7377", fontWeight: 600 }}>${s.raised?.toLocaleString()} raised</span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>of ${s.goal?.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: "#0d7377", fontWeight: 600 }}>{s._count} backers</span>
                  </div>
                </div>
              </div>
            ))}

            {!loading && activeTab === "posts" && (data?.posts || []).length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0", fontSize: 13.5 }}>Nothing trending yet in this period.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
