"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Person {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  role: string | null;
  location: string | null;
  expertise: string[];
  skills: string[];
  is_verified: boolean;
  github_verified: boolean;
  orcid_verified: boolean;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expertise, setExpertise] = useState("");

  const fetchPeople = useCallback(async (s: string, e: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (s) params.set("search", s);
      if (e) params.set("expertise", e);
      const res = await fetch(`/api/people?${params}`);
      const data = await res.json();
      setPeople(data.people || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPeople(search, expertise), 300);
    return () => clearTimeout(t);
  }, [search, expertise, fetchPeople]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>People</h1>
          <p style={{ fontSize: 13.5, color: "#6b7280" }}>Find Muslims to collaborate with, follow, and learn from.</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <input
            placeholder="Search by name, username, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <select value={expertise} onChange={e => setExpertise(e.target.value)} style={{ width: "auto" }}>
            <option value="">All expertise</option>
            {CATEGORIES.filter(c => c.id !== "all").map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
          <button onClick={() => setExpertise("")} className={`pill ${expertise === "" ? "pill-active" : ""}`}>All</button>
          {CATEGORIES.filter(c => c.id !== "all").map(cat => (
            <button key={cat.id} onClick={() => setExpertise(expertise === cat.id ? "" : cat.id)}
              className={`pill ${expertise === cat.id ? "pill-active" : ""}`}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
          </div>
        ) : people.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5 }}>No one found. Try a different filter.</p>
          </div>
        ) : (
          <div className="card-grid-sm" style={{ gap: 12 }}>
            {people.map(person => (
              <a key={person.id} href={`/profile/${person.username}`} style={{ textDecoration: "none" }}>
                <div className="card card-interactive" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <div className="avatar avatar-emerald" style={{ width: 40, height: 40, fontSize: 15, borderRadius: 10, flexShrink: 0 }}>
                      {person.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{person.name}</span>
                        {person.is_verified && <span className="badge badge-emerald">verified</span>}
                        {person.github_verified && <span className="badge badge-github">GitHub</span>}
                        {person.orcid_verified && <span className="badge badge-orcid">ORCID</span>}
                      </div>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>@{person.username}{person.role ? ` · ${person.role}` : ""}</p>
                      {person.location && <p style={{ fontSize: 12, color: "#9ca3af" }}>{person.location}</p>}
                    </div>
                  </div>

                  {person.bio && (
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, marginBottom: 10,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {person.bio}
                    </p>
                  )}

                  {person.expertise.length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {person.expertise.slice(0, 3).map(e => {
                        const cat = CATEGORIES.find(c => c.id === e);
                        return cat ? <span key={e} className="pill pill-active" style={{ fontSize: 11, padding: "2px 8px" }}>{cat.label}</span> : null;
                      })}
                      {person.expertise.length > 3 && (
                        <span style={{ fontSize: 11, color: "#9ca3af", padding: "2px 0" }}>+{person.expertise.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
