"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Leader {
  id: string; name: string; username: string; is_verified: boolean; location: string | null; role: string | null;
  score: number; postCount: number; likesReceived: number; ideaCount: number; upvotesReceived: number;
  startupCount: number; paperCount: number; followerCount: number; endorsementCount: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => setLeaders(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leaderboard</h1>
          <p style={{ fontSize: 13.5, color: "#6b7280" }}>Most active contributors to the Ummah. Score based on posts, ideas, startups, papers, likes, and followers.</p>
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "60px 0" }}>Loading...</p>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length > 0 && (
              <div className="three-col" style={{ gap: 12, marginBottom: 28 }}>
                {top3.map((p, i) => (
                  <Link key={p.id} href={`/profile/${p.username}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "20px 16px", textAlign: "center", border: i === 0 ? "2px solid #0d7377" : "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{MEDALS[i]}</div>
                      <div className="avatar avatar-emerald" style={{ width: 44, height: 44, fontSize: 16, margin: "0 auto 10px" }}>{p.name[0]}</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>@{p.username}</p>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#0d7377", marginBottom: 4 }}>{p.score.toLocaleString()}</div>
                      <p style={{ fontSize: 11.5, color: "#9ca3af" }}>points</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Rest of leaderboard */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div className="lb-row lb-header" style={{ padding: "10px 16px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                {["#", "Member", "Score", "Posts", "Ideas", "Papers", "Followers"].map(h => (
                  <span key={h} className={`lb-col-${h.toLowerCase()}`} style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
                ))}
              </div>
              {rest.map((p, i) => (
                <Link key={p.id} href={`/profile/${p.username}`} style={{ textDecoration: "none", display: "block" }}>
                  <div className="lb-row" style={{ padding: "12px 16px", borderBottom: i < rest.length - 1 ? "1px solid #f9fafb" : "none", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <span className="lb-col-#" style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>{i + 4}</span>
                    <div className="lb-col-member" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar avatar-emerald" style={{ width: 28, height: 28, fontSize: 11 }}>{p.name[0]}</div>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{p.name}</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af" }}>@{p.username}</p>
                      </div>
                      {p.is_verified && <span className="badge badge-emerald" style={{ fontSize: 10 }}>verified</span>}
                    </div>
                    <span className="lb-col-score" style={{ fontSize: 13.5, fontWeight: 700, color: "#0d7377" }}>{p.score.toLocaleString()}</span>
                    <span className="lb-col-posts lb-hide-mobile" style={{ fontSize: 13, color: "#6b7280" }}>{p.postCount}</span>
                    <span className="lb-col-ideas lb-hide-mobile" style={{ fontSize: 13, color: "#6b7280" }}>{p.ideaCount}</span>
                    <span className="lb-col-papers lb-hide-mobile" style={{ fontSize: 13, color: "#6b7280" }}>{p.paperCount}</span>
                    <span className="lb-col-followers lb-hide-mobile" style={{ fontSize: 13, color: "#6b7280" }}>{p.followerCount}</span>
                  </div>
                </Link>
              ))}
            </div>
            <style>{`
              .lb-row { display: grid; grid-template-columns: 32px 1fr 80px 60px 60px 60px 60px; gap: 0; }
              @media (max-width: 600px) {
                .lb-row { grid-template-columns: 32px 1fr 70px; }
                .lb-hide-mobile { display: none !important; }
                .lb-col-#, .lb-col-member, .lb-col-score { display: flex; align-items: center; }
              }
            `}</style>

            {leaders.length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0", fontSize: 13.5 }}>No activity yet. Be the first to post.</p>
            )}

            <p style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", marginTop: 20 }}>
              Score = posts ×2 + likes received ×3 + ideas ×4 + upvotes ×2 + startups ×10 + backers ×5 + papers ×6 + followers ×1 + endorsements ×2
            </p>
          </>
        )}
      </div>
    </div>
  );
}
