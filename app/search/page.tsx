"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";
import { Suspense } from "react";

interface SearchResults {
  posts: { id: string; content: string; category: string; profiles: { name: string; username: string } }[];
  ideas: { id: string; title: string; description: string; profiles: { name: string; username: string } }[];
  startups: { id: string; name: string; tagline: string; profiles: { name: string; username: string } }[];
  people: { id: string; name: string; username: string; role: string | null; is_verified: boolean }[];
}

function SearchInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResults>({ posts: [], ideas: [], startups: [], people: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setSearched(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (q.length >= 2) doSearch(q); }, 350);
    return () => clearTimeout(t);
  }, [q, doSearch]);

  const total = results.posts.length + results.ideas.length + results.startups.length + results.people.length;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>
        <div style={{ marginBottom: 28 }}>
          <input
            autoFocus
            placeholder="Search posts, ideas, startups, people..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ fontSize: 15, padding: "11px 14px" }}
          />
        </div>

        {loading && <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Searching...</p>}

        {!loading && searched && total === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 13.5, textAlign: "center", padding: "48px 0" }}>No results for "{q}"</p>
        )}

        {!loading && searched && total > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {results.people.length > 0 && (
              <section>
                <p className="section-label" style={{ marginBottom: 12 }}>People</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {results.people.map(p => (
                    <a key={p.id} href={`/profile/${p.username}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f5fbfb"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <div className="avatar avatar-emerald" style={{ width: 32, height: 32, fontSize: 12 }}>{p.name[0]}</div>
                        <div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{p.name}</span>
                          <span style={{ fontSize: 12.5, color: "#9ca3af", marginLeft: 6 }}>@{p.username}{p.role ? ` · ${p.role}` : ""}</span>
                        </div>
                        {p.is_verified && <span className="badge badge-emerald" style={{ marginLeft: "auto" }}>verified</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {results.posts.length > 0 && (
              <section>
                <p className="section-label" style={{ marginBottom: 12 }}>Posts</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {results.posts.map(p => (
                    <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151" }}>{p.profiles?.name}</span>
                        <span style={{ fontSize: 12.5, color: "#9ca3af" }}>@{p.profiles?.username}</span>
                        <span style={{ fontSize: 12, color: "#d1d5db" }}>· {CATEGORIES.find(c => c.id === p.category)?.label}</span>
                      </div>
                      <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>{p.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.ideas.length > 0 && (
              <section>
                <p className="section-label" style={{ marginBottom: 12 }}>Ideas</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.ideas.map(i => (
                    <div key={i.id} className="card" style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{i.title}</p>
                      <p style={{ fontSize: 13, color: "#6b7280" }}>{i.description}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>by {i.profiles?.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.startups.length > 0 && (
              <section>
                <p className="section-label" style={{ marginBottom: 12 }}>Startups</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.startups.map(s => (
                    <a key={s.id} href={`/startups/${s.id}`} style={{ textDecoration: "none" }}>
                      <div className="card card-interactive" style={{ padding: "12px 14px" }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{s.name}</p>
                        <p style={{ fontSize: 13, color: "#6b7280" }}>{s.tagline}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>by {s.profiles?.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchInner /></Suspense>;
}
