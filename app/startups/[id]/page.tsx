"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";
import { useAuth } from "@/lib/hooks/useAuth";

interface Startup {
  id: string; user_id: string; name: string; tagline: string; description: string;
  category: string; goal: number; raised: number; stage: string; perks: string[];
  verified: boolean; created_at: string; backerCount: number; updateCount: number; backed: boolean;
  founder: { id: string; name: string; username: string; bio: string | null; role: string | null; location: string | null; is_verified: boolean };
}
interface Backer { id: string; amount: number; profiles: { name: string; username: string; is_verified: boolean } }
interface Update { id: string; content: string; created_at: string; profiles: { name: string; username: string } }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StartupDetailPage() {
  const { id } = useParams() as { id: string };
  const { profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [backers, setBackers] = useState<Backer[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"about" | "updates" | "backers">("about");
  const [updateText, setUpdateText] = useState("");
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/startups/${id}`)
      .then(r => r.json())
      .then(data => {
        setStartup(data.startup);
        setBackers(data.backers || []);
        setUpdates(data.updates || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBack = async () => {
    if (!startup) return;
    setStartup(s => s ? { ...s, backed: !s.backed, backerCount: s.backed ? s.backerCount - 1 : s.backerCount + 1 } : s);
    await fetch(`/api/startups/${id}/back`, { method: "POST" });
  };

  const postUpdate = async () => {
    if (!updateText.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/startups/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updateText }),
    });
    const data = await res.json();
    if (res.ok) {
      setUpdates(prev => [{ ...data.update, profiles: { name: profile!.name, username: profile!.username } }, ...prev]);
      setUpdateText("");
      setToast("Update posted.");
      setTimeout(() => setToast(""), 2500);
    }
    setPosting(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fff" }}><Navbar />
      <div style={{ textAlign: "center", padding: "80px 0" }}><p style={{ color: "#9ca3af" }}>Loading...</p></div>
    </div>
  );

  if (!startup) return (
    <div style={{ minHeight: "100vh", background: "#fff" }}><Navbar />
      <div style={{ textAlign: "center", padding: "80px 0" }}><p style={{ color: "#dc2626" }}>Startup not found.</p></div>
    </div>
  );

  const pct = Math.min(100, Math.round((startup.raised / startup.goal) * 100));
  const isFounder = profile?.id === startup.user_id;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 40, alignItems: "start" }}>
          <div>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>{startup.name}</h1>
                {startup.verified && <span className="badge badge-emerald">verified</span>}
                <span style={{ fontSize: 12, color: "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 8px" }}>{startup.stage}</span>
              </div>
              <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 16 }}>{startup.tagline}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>${startup.raised.toLocaleString()} raised</span>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>of ${startup.goal.toLocaleString()}</span>
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{startup.backerCount} backers</span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{pct}% funded</span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{updates.length} updates</span>
                </div>
              </div>

              {startup.perks.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {startup.perks.map(p => (
                    <span key={p} style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, padding: "3px 9px" }}>{p}</span>
                  ))}
                </div>
              )}

              <button onClick={handleBack} className={`btn ${startup.backed ? "btn-secondary" : "btn-primary"}`}>
                {startup.backed ? "Backed" : "Back this startup"}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6", marginBottom: 24 }}>
              {(["about", "updates", "backers"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: "9px 16px", fontSize: 13.5, fontWeight: tab === t ? 600 : 400, cursor: "pointer", border: "none", background: "transparent", color: tab === t ? "#0d7377" : "#6b7280", borderBottom: tab === t ? "2px solid #0d7377" : "2px solid transparent", marginBottom: -1, transition: "all 0.1s", fontFamily: "inherit", textTransform: "capitalize" }}>
                  {t} {t === "updates" ? `(${updates.length})` : t === "backers" ? `(${backers.length})` : ""}
                </button>
              ))}
            </div>

            {tab === "about" && (
              <div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{startup.description}</p>
                <div style={{ marginTop: 20, padding: "14px 16px", background: "#f5fbfb", border: "1px solid #b2e4e6", borderRadius: 8 }}>
                  <p style={{ fontSize: 12.5, color: "#0a5f63" }}>All fundraising numbers are public. Founders post weekly updates.</p>
                </div>
              </div>
            )}

            {tab === "updates" && (
              <div>
                {isFounder && (
                  <div style={{ marginBottom: 20, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Post an update</p>
                    </div>
                    <div style={{ padding: 14 }}>
                      <textarea value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="Share your progress with backers..." style={{ resize: "none", minHeight: 80, marginBottom: 10 }} />
                      <button onClick={postUpdate} disabled={posting} className="btn btn-primary btn-sm">{posting ? "Posting..." : "Post update"}</button>
                    </div>
                  </div>
                )}
                {updates.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13.5, textAlign: "center", padding: "40px 0" }}>No updates yet.</p>
                ) : updates.map((u, i) => (
                  <div key={u.id} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: i < updates.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{u.profiles?.name}</span>
                      <span suppressHydrationWarning style={{ fontSize: 12.5, color: "#9ca3af" }}>{timeAgo(u.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{u.content}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "backers" && (
              <div>
                {backers.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13.5, textAlign: "center", padding: "40px 0" }}>No backers yet. Be the first.</p>
                ) : backers.map((b, i) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < backers.length - 1 ? "1px solid #f9fafb" : "none" }}>
                    <div className="avatar avatar-emerald" style={{ width: 30, height: 30, fontSize: 11 }}>{b.profiles?.name?.[0]}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "#111827" }}>{b.profiles?.name}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 6 }}>@{b.profiles?.username}</span>
                    </div>
                    {b.profiles?.is_verified && <span className="badge badge-emerald">verified</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ position: "sticky", top: 72 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280" }}>Founder</p>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <a href={`/profile/${startup.founder?.username}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="avatar avatar-emerald" style={{ width: 36, height: 36, fontSize: 13 }}>{startup.founder?.name?.[0]}</div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{startup.founder?.name}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>@{startup.founder?.username}</p>
                  </div>
                </a>
                {startup.founder?.bio && <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: 10, lineHeight: 1.55 }}>{startup.founder.bio}</p>}
                {startup.founder?.location && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>{startup.founder.location}</p>}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              {[["Category", CATEGORIES.find(c => c.id === startup.category)?.label || startup.category], ["Stage", startup.stage], ["Goal", `$${startup.goal.toLocaleString()}`], ["Raised", `$${startup.raised.toLocaleString()}`], ["Funded", `${pct}%`]].map(([k, v], i) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < 4 ? "1px solid #f9fafb" : "none" }}>
                  <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{v}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
