"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";

interface GroupPost {
  id: string; content: string; created_at: string;
  author: { name: string; username: string; is_verified: boolean; avatar_url?: string };
}
interface Member {
  user_id: string; role: string; tag: string | null;
  member: { name: string; username: string; is_verified: boolean; avatar_url?: string };
}
interface Group {
  id: string; name: string; description: string; category: string; type: string;
  member_count: number; created_at: string;
  creator: { name: string; username: string; is_verified: boolean };
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const PRESET_TAGS = ["Moderator", "Expert", "Contributor", "Scholar", "Mentor", "Alumni", "Organiser"];

export default function GroupPage() {
  const { id } = useParams() as { id: string };
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState("");
  const [managingMember, setManagingMember] = useState<Member | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  const [copied, setCopied] = useState(false);
  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const isAdmin = myRole === "admin";
  const adminCount = members.filter(m => m.role === "admin").length;

  const handleShareLink = () => {
    const url = `${window.location.origin}/groups/${id}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/groups/${id}`)
      .then(r => r.json())
      .then(data => {
        setGroup(data.group);
        setPosts(data.posts || []);
        setMembers(data.members || []);
        setIsMember(data.isMember);
        setMyRole(data.role);
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
      if (data.joined) setMyRole("member");
      else setMyRole(null);
      fire(data.joined ? "Joined group." : "Left group.");
    } else fire(data.error || "Failed.");
    setJoining(false);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/groups/${id}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) { setPosts(prev => [data.post, ...prev]); setContent(""); }
    else fire(data.error || "Failed.");
    setPosting(false);
  };

  const memberAction = async (target_user_id: string, action: string, extra?: Record<string, string>) => {
    const res = await fetch(`/api/groups/${id}/members`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) { fire(data.error || "Failed."); return false; }
    return true;
  };

  const handleSetTag = async () => {
    if (!managingMember) return;
    setTagSaving(true);
    const ok = await memberAction(managingMember.user_id, "set_tag", { tag: tagInput });
    if (ok) {
      setMembers(prev => prev.map(m => m.user_id === managingMember.user_id ? { ...m, tag: tagInput || null } : m));
      fire("Tag updated.");
      setManagingMember(null);
    }
    setTagSaving(false);
  };

  const handlePromote = async (m: Member) => {
    if (adminCount >= 2) { fire("Groups can have at most 2 admins."); return; }
    const ok = await memberAction(m.user_id, "promote");
    if (ok) {
      setMembers(prev => prev.map(x => x.user_id === m.user_id ? { ...x, role: "admin" } : x));
      fire(`${m.member.name} promoted to admin.`);
    }
  };

  const handleRemove = async (m: Member) => {
    if (!confirm(`Remove ${m.member.name} from the group?`)) return;
    const ok = await memberAction(m.user_id, "remove");
    if (ok) {
      setMembers(prev => prev.filter(x => x.user_id !== m.user_id));
      setGroup(g => g ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g);
      fire(`${m.member.name} removed.`);
    }
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
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />

      {/* Group header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700 }}>{group.name}</h1>
                <span style={{ fontSize: 11, fontWeight: 600, color: group.type === "private" ? "#7c3aed" : "#0d7377", background: group.type === "private" ? "#f5f3ff" : "#e6f7f8", border: `1px solid ${group.type === "private" ? "#ddd6fe" : "#b2e4e6"}`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {group.type}
                </span>
                {isAdmin && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 5, padding: "2px 8px" }}>
                    Your group
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.6, maxWidth: 560 }}>{group.description}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                {group.member_count} member{group.member_count !== 1 ? "s" : ""} · Created by {group.creator?.name}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handleShareLink} className="btn btn-ghost btn-sm" title="Copy group link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d7377" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                )}
                {copied ? "Copied!" : "Share"}
              </button>
              {isMember && myRole !== "admin" && (
                <button onClick={handleJoin} disabled={joining} className="btn btn-secondary btn-sm">
                  {joining ? "..." : "Leave group"}
                </button>
              )}
              {!isMember && (
                <button onClick={handleJoin} disabled={joining} className="btn btn-primary btn-sm">
                  {joining ? "..." : "Join group"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div className="feed-layout-2">

          {/* Feed */}
          <div>
            {/* Composer */}
            {isMember && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                <textarea
                  placeholder="Write something to the group..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
                  style={{ resize: "none", minHeight: 72, width: "100%", marginBottom: 10, border: "none", outline: "none", fontSize: 14, padding: 0, background: "transparent" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handlePost} disabled={posting || !content.trim()} className="btn btn-primary btn-sm">
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            )}

            {!isMember && group.type === "private" && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "48px 24px", textAlign: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Private group</p>
                <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 16 }}>Join to see posts and participate.</p>
                <button onClick={handleJoin} disabled={joining} className="btn btn-primary btn-sm">
                  {joining ? "..." : "Join group"}
                </button>
              </div>
            )}

            {/* Posts */}
            {(isMember || group.type === "public") && (
              posts.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                  <p style={{ color: "#9ca3af", fontSize: 13.5 }}>No posts yet. Start the conversation.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {posts.map((p, i) => (
                    <div key={p.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: i === 0 ? "12px 12px 4px 4px" : i === posts.length - 1 ? "4px 4px 12px 12px" : 4, padding: "16px 18px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                        <Avatar name={p.author?.name} url={p.author?.avatar_url} size={32} radius={8} />
                        <div>
                          <Link href={`/profile/${p.author?.username}`} style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", textDecoration: "none" }}>{p.author?.name}</Link>
                          <span suppressHydrationWarning style={{ fontSize: 12, color: "#d1d5db", marginLeft: 8 }}>{timeAgo(p.created_at)}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{p.content}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Sidebar — shows below feed on mobile */}
          <aside style={{ position: "sticky", top: 72 }}>
            {/* Members */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Members <span style={{ fontWeight: 400, color: "#9ca3af" }}>({group.member_count})</span>
                </p>
              </div>

              <div>
                {members.length === 0 ? (
                  <p style={{ padding: "16px", fontSize: 13, color: "#9ca3af" }}>No members yet.</p>
                ) : members.map((m, i) => (
                  <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < members.length - 1 ? "1px solid #f9fafb" : "none", cursor: isAdmin ? "pointer" : "default", transition: "background 0.1s" }}
                    onMouseEnter={e => isAdmin && ((e.currentTarget as HTMLElement).style.background = "#f9fafb")}
                    onMouseLeave={e => isAdmin && ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    onClick={() => { if (isAdmin) { setManagingMember(m); setTagInput(m.tag || ""); } }}>
                    <Avatar name={m.member?.name} url={m.member?.avatar_url} size={28} radius={7} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <Link href={`/profile/${m.member?.username}`} onClick={e => e.stopPropagation()} style={{ fontSize: 13, fontWeight: 600, color: "#111827", textDecoration: "none" }}>{m.member?.name}</Link>
                        {m.role === "admin" && (
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: "#0d7377", background: "#e6f7f8", borderRadius: 4, padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin</span>
                        )}
                        {m.tag && (
                          <span style={{ fontSize: 9.5, fontWeight: 600, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 4, padding: "1px 6px" }}>{m.tag}</span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Back link */}
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <Link href="/groups" style={{ fontSize: 12.5, color: "#9ca3af", textDecoration: "none" }}>
                ← All groups
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Member management modal */}
      {managingMember && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setManagingMember(null); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar name={managingMember.member.name} url={managingMember.member.avatar_url} size={32} radius={8} />
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{managingMember.member.name}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>@{managingMember.member.username} · {managingMember.role}</p>
                </div>
              </div>
              <button onClick={() => setManagingMember(null)} className="icon-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Tag */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Member tag</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {PRESET_TAGS.map(t => (
                    <button key={t} onClick={() => setTagInput(t)}
                      style={{ fontSize: 12, padding: "4px 10px", border: `1px solid ${tagInput === t ? "#7c3aed" : "#e5e7eb"}`, borderRadius: 20, background: tagInput === t ? "#f5f3ff" : "#fff", color: tagInput === t ? "#7c3aed" : "#6b7280", cursor: "pointer", fontFamily: "inherit", fontWeight: tagInput === t ? 600 : 400 }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Or type a custom tag..." value={tagInput} onChange={e => setTagInput(e.target.value)}
                    style={{ fontSize: 13 }} />
                  <button onClick={() => setTagInput("")}
                    style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                    Clear
                  </button>
                </div>
                <button onClick={handleSetTag} disabled={tagSaving} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                  {tagSaving ? "Saving..." : "Save tag"}
                </button>
              </div>

              <div style={{ height: 1, background: "#f3f4f6" }} />

              {/* Role management */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</p>
                {managingMember.role === "member" ? (
                  adminCount >= 2 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>Max 2 admins allowed per group.</p>
                  ) : (
                    <button onClick={() => { handlePromote(managingMember); setManagingMember(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1px solid #b2e4e6", borderRadius: 8, background: "#f5fbfb", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#0d7377", fontWeight: 500 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
                      Promote to group admin
                    </button>
                  )
                ) : (
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>This member is an admin.</p>
                )}
                <button onClick={() => { handleRemove(managingMember); setManagingMember(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1px solid #fca5a5", borderRadius: 8, background: "#fef2f2", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
                  Remove from group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
