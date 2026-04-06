"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { CATEGORIES } from "@/lib/data";

interface Profile {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  role: string | null;
  location: string | null;
  phone: string | null; phone_public: boolean;
  website: string | null;
  github_username: string | null;
  orcid_id: string | null;
  scholar_url: string | null;
  researchgate_url: string | null;
  expertise: string[];
  skills: string[];
  is_admin: boolean;
  is_verified: boolean;
  admin_verified: boolean;
  github_verified: boolean;
  orcid_verified: boolean;
  avatar_url: string | null;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  category: string;
  created_at: string;
  tags: string[];
}

interface Stats {
  posts: number;
  followers: number;
  following: number;
  ideas: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [tab, setTab] = useState("posts");
  const [followed, setFollowed] = useState(false);
  const [papers, setPapers] = useState<{ id: string; doi: string; title: string; authors: string[]; journal: string | null; year: number | null; url: string; category: string; relevance_note: string | null; upvoteCount: number }[]>([]);
  const [adminMessages, setAdminMessages] = useState<{ id: string; subject: string; body: string; visibility: string; created_at: string; admin: { name: string; username: string } }[]>([]);
  const [endorsements, setEndorsements] = useState<{ skill: string; count: number; endorsers: { name: string; username: string }[] }[]>([]);
  const [endorsingSkill, setEndorsingSkill] = useState("");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ posts: 0, followers: 0, following: 0, ideas: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/profiles/${username}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setProfile(data.profile);
        setStats(data.stats);
        setPosts(data.posts);
        setFollowed(data.isFollowing);
        setIsOwnProfile(!!data.isOwnProfile);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));

    fetch(`/api/admin/message?username=${username}`)
      .then(r => r.json())
      .then(data => setAdminMessages(data.messages || []))
      .catch(() => {});

    fetch(`/api/papers?username=${username}`)
      .then(r => r.json())
      .then(data => setPapers(data.papers || []))
      .catch(() => {});

    fetch(`/api/profiles/${username}/endorse`)
      .then(r => r.json())
      .then(data => setEndorsements(data.endorsements || []))
      .catch(() => {});
  }, [username]);

  const handleFollow = async () => {
    const prev = followed;
    setFollowed(!followed);
    setStats(s => ({ ...s, followers: prev ? s.followers - 1 : s.followers + 1 }));
    fire(prev ? "Unfollowed." : "Following.");
    try {
      await fetch(`/api/profiles/${username}/follow`, { method: "POST" });
    } catch {
      setFollowed(prev);
      setStats(s => ({ ...s, followers: prev ? s.followers + 1 : s.followers - 1 }));
    }
  };

  const handleEndorse = async (skill: string) => {
    setEndorsingSkill(skill);
    try {
      const res = await fetch(`/api/profiles/${username}/endorse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill }) });
      const data = await res.json();
      if (res.ok) {
        setEndorsements(prev => {
          const existing = prev.find(e => e.skill === skill);
          if (existing) {
            if (data.endorsed) return prev.map(e => e.skill === skill ? { ...e, count: e.count + 1 } : e);
            return prev.map(e => e.skill === skill ? { ...e, count: Math.max(0, e.count - 1) } : e).filter(e => e.count > 0);
          }
          return [...prev, { skill, count: 1, endorsers: [] }];
        });
        fire(data.endorsed ? `Endorsed ${skill}.` : `Removed endorsement.`);
      }
    } catch { fire("Failed."); }
    finally { setEndorsingSkill(""); }
  };

  const TABS = [
    { id: "posts", label: "Posts", count: stats.posts },
    { id: "ideas", label: "Ideas", count: stats.ideas },
    { id: "papers", label: "Papers", count: papers.length || undefined },
    { id: "backed", label: "Backed" },
    { id: "endorsements", label: "Endorsements", count: endorsements.length || undefined },
    { id: "about", label: "About" },
    ...(adminMessages.length > 0 ? [{ id: "messages", label: "Messages", count: adminMessages.length }] : []),
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "#dc2626", fontSize: 13.5 }}>{error || "Profile not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div className="grid-2col" style={{ gap: 40 }}>

          <div>
            {/* Profile header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                <Avatar name={profile.name} url={profile.avatar_url} size={56} radius={12} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 700 }}>{profile.name}</h1>
                    {/* Blue verified badge — Twitter/X style */}
                    {profile.admin_verified && (
                      <span title="Verified by IMS" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: "#1d4ed8", flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    )}
                    {profile.is_verified && <span className="badge badge-emerald" style={{ fontSize: 11 }}>verified</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 2 }}>@{profile.username}{profile.role ? ` · ${profile.role}` : ""}</p>
                  <p style={{ fontSize: 12.5, color: "#9ca3af" }}>{profile.location ? `${profile.location} · ` : ""}Joined {formatDate(profile.created_at)}</p>
                </div>
                <button onClick={handleFollow}
                  className={followed ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}>
                  {followed ? "Following" : "Follow"}
                </button>
              </div>

              {profile.bio && <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.65, marginBottom: 14 }}>{profile.bio}</p>}

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                {profile.website && <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#059669", textDecoration: "none" }}>{profile.website}</a>}
                {profile.phone && profile.phone_public && <a href={`tel:${profile.phone}`} style={{ fontSize: 13, color: "#059669", textDecoration: "none" }}>{profile.phone}</a>}
              </div>

              {(profile.expertise.length > 0 || profile.skills.length > 0) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {profile.expertise.map(e => {
                    const cat = CATEGORIES.find(c => c.id === e);
                    return cat ? <span key={e} className="pill pill-active" style={{ fontSize: 12 }}>{cat.label}</span> : null;
                  })}
                  {profile.skills.map(s => (
                    <span key={s} style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 8px" }}>{s}</span>
                  ))}
                </div>
              )}

              {/* GitHub / ORCID connections */}
              <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #f3f4f6", flexWrap: "wrap", alignItems: "center" }}>
                {profile.github_username ? (
                  <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noopener noreferrer"
                    className="badge badge-github" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 12, textDecoration: "none" }}>
                    {/* GitHub icon */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    {profile.github_verified && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    github.com/{profile.github_username}
                  </a>
                ) : isOwnProfile ? (
                  <a href="/api/auth/github"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12.5, color: "#374151", textDecoration: "none", background: "#fff", fontFamily: "inherit", fontWeight: 500 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Connect GitHub
                  </a>
                ) : null}

                {profile.orcid_id ? (
                  <a href={`https://orcid.org/${profile.orcid_id}`} target="_blank" rel="noopener noreferrer"
                    className="badge badge-orcid" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 12, textDecoration: "none" }}>
                    {profile.orcid_verified && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    ORCID {profile.orcid_id.slice(0, 9)}…
                  </a>
                ) : isOwnProfile ? (
                  <a href="/api/auth/orcid"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12.5, color: "#374151", textDecoration: "none", background: "#fff", fontFamily: "inherit", fontWeight: 500 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Connect ORCID
                  </a>
                ) : null}

                {/* Scholar + ResearchGate — URL links, no OAuth */}
                {profile.scholar_url && (
                  <a href={profile.scholar_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 6, fontSize: 12, color: "#92400e", textDecoration: "none", fontWeight: 500 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z"/></svg>
                    Google Scholar
                  </a>
                )}
                {profile.researchgate_url && (
                  <a href={profile.researchgate_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 6, fontSize: 12, color: "#0369a1", textDecoration: "none", fontWeight: 500 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 9h6M9 12h4M9 15h6"/></svg>
                    ResearchGate
                  </a>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 1, marginBottom: 20, borderBottom: "1px solid #f3f4f6" }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", border: "none", background: "transparent",
                    color: tab === t.id ? "#059669" : "#6b7280",
                    borderBottom: tab === t.id ? "2px solid #059669" : "2px solid transparent",
                    marginBottom: -1, transition: "all 0.1s", fontFamily: "inherit",
                  }}>
                  {t.label} {t.count !== undefined && <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>({t.count})</span>}
                </button>
              ))}
            </div>

            {tab === "posts" && (
              posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <p style={{ fontSize: 13.5, color: "#9ca3af" }}>Nothing yet. Be the first.</p>
                </div>
              ) : posts.map((post, i) => {
                const cat = CATEGORIES.find(c => c.id === post.category);
                return (
                  <div key={post.id} style={{ paddingBottom: "18px", marginBottom: "18px", borderBottom: i < posts.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      {cat && <span style={{ fontSize: 12, color: "#9ca3af" }}>{cat.label}</span>}
                      <span suppressHydrationWarning style={{ fontSize: 12, color: "#d1d5db" }}>· {timeAgo(post.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, marginBottom: 10 }}>{post.content}</p>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 12.5, color: "#9ca3af" }}>Reply</span>
                    </div>
                  </div>
                );
              })
            )}

            {tab === "about" && (
              <div style={{ border: "1px solid #f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                {[
                  ["Location", profile.location],
                  ["Website", profile.website],
                  ["Phone", profile.phone_public ? profile.phone : null],
                  ["GitHub", profile.github_username ? `github.com/${profile.github_username}` : null],
                  ["ORCID", profile.orcid_id],
                  ["Joined", formatDate(profile.created_at)],
                ].filter(([, v]) => v).map(([label, value], i, arr) => (
                  <div key={label as string} style={{ display: "flex", gap: 20, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #f9fafb" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <span style={{ fontSize: 12.5, color: "#9ca3af", width: 72, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13.5, color: "#374151" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "papers" && (
              papers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <p style={{ fontSize: 13.5, color: "#9ca3af" }}>No papers submitted yet.</p>
                  <a href="/papers" className="btn btn-secondary btn-sm" style={{ marginTop: 12, display: "inline-flex" }}>Browse all papers</a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {papers.map(p => (
                    <div key={p.id} style={{ border: "1px solid #f0f0f0", borderRadius: 10, padding: "14px 16px" }}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 5 }}>{p.title}</p>
                      </a>
                      <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 5 }}>{p.authors.slice(0, 3).join(", ")}{p.authors.length > 3 ? " et al." : ""}</p>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {p.journal && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>{p.journal}</span>}
                        {p.year && <span style={{ fontSize: 12, color: "#9ca3af" }}>{p.year}</span>}
                        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11.5, color: "#0d7377", fontFamily: "monospace", textDecoration: "none" }}>DOI:{p.doi}</a>
                      </div>
                      {p.relevance_note && (
                        <p style={{ fontSize: 12.5, color: "#4b5563", marginTop: 8, padding: "8px 10px", background: "#f5fbfb", borderRadius: 6, lineHeight: 1.55 }}>{p.relevance_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {(tab === "ideas" || tab === "backed") && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: 13.5, color: "#9ca3af" }}>Nothing yet. Be the first.</p>
              </div>
            )}

            {tab === "endorsements" && (
              <div>
                {profile.skills.length > 0 && (
                  <div style={{ marginBottom: 20, padding: "14px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                    <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 10 }}>Endorse a skill</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {profile.skills.map(skill => (
                        <button key={skill} onClick={() => handleEndorse(skill)} disabled={endorsingSkill === skill}
                          className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {endorsements.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ fontSize: 13.5, color: "#9ca3af" }}>No endorsements yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {endorsements.sort((a, b) => b.count - a.count).map(e => (
                      <div key={e.skill} style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{e.skill}</span>
                          {e.endorsers.length > 0 && (
                            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Endorsed by {e.endorsers.map(en => en.name).join(", ")}{e.count > 3 ? ` and ${e.count - 3} more` : ""}</p>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0d7377" }}>{e.count}</span>
                          <button onClick={() => handleEndorse(e.skill)} disabled={endorsingSkill === e.skill}
                            className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>Endorse</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "messages" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {adminMessages.map(m => (
                  <div key={m.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{m.subject}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>From admin · {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: m.visibility === "public" ? "#fffbeb" : "#e6f7f8", color: m.visibility === "public" ? "#92400e" : "#0a5f63", border: `1px solid ${m.visibility === "public" ? "#fde68a" : "#b2e4e6"}` }}>
                        {m.visibility}
                      </span>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.65 }}>{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats sidebar */}
          <aside style={{ position: "sticky", top: 72 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
              {[["Posts", stats.posts], ["Followers", stats.followers.toLocaleString()], ["Following", stats.following], ["Ideas", stats.ideas]].map(([label, val], i) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < 3 ? "1px solid #f9fafb" : "none" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{val}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => fire("Link copied.")}>
              Copy profile link
            </button>
          </aside>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
