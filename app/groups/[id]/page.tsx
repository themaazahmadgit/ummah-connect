"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface GroupPost {
  id: string; content: string; created_at: string;
  author: { name: string; username: string; is_verified: boolean };
}
interface Member {
  role: string;
  member: { name: string; username: string; is_verified: boolean };
}
interface Group {
  id: string; name: string; description: string; category: string; type: string; member_count: number; created_at: string;
  creator: { name: string; username: string; is_verified: boolean };
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function GroupPage() {
  const { id } = useParams() as { id: string };
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState("");

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/groups/${id}`)
      .then(r => r.json())
      .then(data => {
        setGroup(data.group);
        setPosts(data.posts || []);
        setMembers(data.members || []);
        setIsMember(data.isMember);
        setRole(data.role);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setIsMember(data.joined);
      setGroup(g => g ? { ...g, member_count: data.joined ? g.member_count + 1 : g.member_count - 1 } : g);
      fire(data.joined ? "Joined group." : "Left group.");
    }
    setJoining(false);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/groups/${id}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    const data = await res.json();
    if (res.ok) { setPosts(prev => [data.post, ...prev]); setContent(""); }
    else fire(data.error || "Failed.");
    setPosting(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "80px 0" }}><p style={{ color: "#9ca3af" }}>Loading...</p></div>
    </div>
  );

  if (!group) return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "80px 0" }}><p style={{ color: "#dc2626" }}>Group not found.</p></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 32, alignItems: "start" }}>
          <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700 }}>{group.name}</h1>
                    <span style={{ fontSize: 11, color: group.type === "private" ? "#7c3aed" : "#0d7377", background: group.type === "private" ? "#f5f3ff" : "#e6f7f8", border: `1px solid ${group.type === "private" ? "#ddd6fe" : "#b2e4e6"}`, borderRadius: 5, padding: "2px 7px" }}>{group.type}</span>
                  </div>
                  <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.6 }}>{group.description}</p>
                </div>
                <button onClick={handleJoin} disabled={joining} className={`btn ${isMember ? "btn-secondary" : "btn-primary"} btn-sm`}>
                  {joining ? "..." : isMember ? (role === "admin" ? "Admin" : "Joined") : "Join"}
                </button>
              </div>
              <div style={{ fontSize: 12.5, color: "#9ca3af" }}>
                {group.member_count} member{group.member_count !== 1 ? "s" : ""} · created by {group.creator?.name}
              </div>
            </div>

            {/* Post composer (members only) */}
            {isMember && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <textarea
                  placeholder="Write something to the group..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ resize: "none", minHeight: 70, width: "100%", marginBottom: 10 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handlePost} disabled={posting || !content.trim()} className="btn btn-primary btn-sm">
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            )}

            {!isMember && group.type === "private" && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13.5 }}>
                <p>Join to see posts in this private group.</p>
              </div>
            )}

            {/* Posts */}
            {(isMember || group.type === "public") && (
              posts.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0", fontSize: 13.5 }}>No posts yet. Start the conversation.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {posts.map((p, i) => (
                    <div key={p.id} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: i < posts.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <div className="avatar avatar-emerald" style={{ width: 28, height: 28, fontSize: 11 }}>{p.author?.name?.[0]}</div>
                        <div>
                          <Link href={`/profile/${p.author?.username}`} style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", textDecoration: "none" }}>{p.author?.name}</Link>
                          <span suppressHydrationWarning style={{ fontSize: 12, color: "#d1d5db", marginLeft: 8 }}>{timeAgo(p.created_at)}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{p.content}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ position: "sticky", top: 72 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Members</p>
              </div>
              {members.slice(0, 8).map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: i < Math.min(members.length, 8) - 1 ? "1px solid #f9fafb" : "none" }}>
                  <div className="avatar avatar-emerald" style={{ width: 24, height: 24, fontSize: 10 }}>{m.member?.name?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/profile/${m.member?.username}`} style={{ fontSize: 13, color: "#111827", textDecoration: "none", fontWeight: 500 }}>{m.member?.name}</Link>
                  </div>
                  {m.role === "admin" && <span style={{ fontSize: 10, color: "#0d7377", background: "#e6f7f8", borderRadius: 4, padding: "1px 5px" }}>admin</span>}
                </div>
              ))}
              {members.length > 8 && (
                <div style={{ padding: "8px 14px", fontSize: 12.5, color: "#9ca3af", textAlign: "center" }}>+{members.length - 8} more</div>
              )}
            </div>
            <Link href="/groups" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", display: "block", textAlign: "center" }}>← All groups</Link>
          </aside>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
