"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

interface Analytics {
  users: { total: number; last7d: number; last30d: number };
  posts: { total: number; last7d: number };
  content: { ideas: number; startups: number; papers: number; events: number; jobs: number; groups: number };
  pendingReports: number;
  signupsByDay: Record<string, number>;
}
interface Report {
  id: string; reason: string; details: string | null; status: string; created_at: string;
  reporter: { name: string; username: string };
  post?: { id: string; content: string; author: { name: string; username: string } } | null;
}
interface Broadcast {
  id: string; title: string; message: string; type: string; recipient_count: number; created_at: string;
}
interface User {
  id: string; name: string; username: string; email: string | null; location: string | null;
  role: string | null; is_admin: boolean; is_verified: boolean; admin_verified: boolean;
  can_create_groups: boolean; github_verified: boolean; orcid_verified: boolean; created_at: string;
  avatar_url?: string | null;
}
interface AdminProfile {
  id: string; name: string; username: string; is_admin: boolean; avatar_url?: string | null;
}
interface AdminGroup {
  id: string; name: string; description: string; category: string; type: string;
  member_count: number; created_at: string;
  creator: { name: string; username: string } | null;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  overview: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  broadcast:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.75a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z"/></svg>,
  reports:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  digest:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  groups:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="7" r="2"/><path d="M23 21v-1.5a3 3 0 0 0-2-2.83"/></svg>,
};

const NAV_ITEMS = [
  { id: "overview",  label: "Overview"  },
  { id: "users",     label: "Users"     },
  { id: "groups",    label: "Groups"    },
  { id: "broadcast", label: "Broadcast" },
  { id: "reports",   label: "Reports"   },
  { id: "digest",    label: "Digest"    },
];

export default function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [toast, setToast] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);

  // Overview
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Broadcast
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [bForm, setBForm] = useState({ title: "", message: "", type: "announcement" });
  const [bSending, setBSending] = useState(false);
  const [bError, setBError] = useState("");

  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Groups
  const [adminGroups, setAdminGroups] = useState<AdminGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  // Digest
  const [digestSending, setDigestSending] = useState(false);
  const [lastDigestSent, setLastDigestSent] = useState<string | null>(null);
  useEffect(() => { setLastDigestSent(localStorage.getItem("ims_last_digest")); }, []);

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Load admin profile
  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.profile?.is_admin) setAdminProfile(d.profile);
      else window.location.href = "/";
    }).catch(() => { window.location.href = "/"; });
  }, []);

  // Load section data
  useEffect(() => {
    if (section === "overview" && !analytics) {
      setAnalyticsLoading(true);
      fetch("/api/admin/analytics").then(r => r.json()).then(d => { setAnalytics(d); setAnalyticsLoading(false); }).catch(() => setAnalyticsLoading(false));
    }
    if (section === "users" && users.length === 0) fetchUsers("");
    if (section === "broadcast" && broadcasts.length === 0) {
      fetch("/api/admin/broadcast").then(r => r.json()).then(d => setBroadcasts(d.broadcasts || [])).catch(() => {});
    }
    if (section === "reports" && reports.length === 0) {
      setReportsLoading(true);
      fetch("/api/reports").then(r => r.json()).then(d => { setReports(d.reports || []); setReportsLoading(false); }).catch(() => setReportsLoading(false));
    }
    if (section === "groups" && adminGroups.length === 0) {
      setGroupsLoading(true);
      fetch("/api/admin/groups").then(r => r.json()).then(d => { setAdminGroups(d.groups || []); setGroupsLoading(false); }).catch(() => setGroupsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const fetchUsers = useCallback(async (q: string) => {
    setUsersLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    fetch(`/api/admin/users${params}`).then(r => r.json()).then(d => {
      setUsers(d.users || []);
      setUserTotal(d.total || 0);
    }).finally(() => setUsersLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (section !== "users") return;
    const t = setTimeout(() => fetchUsers(search), 350);
    return () => clearTimeout(t);
  }, [search, section, fetchUsers]);

  const handleAvatarUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setAdminProfile(p => p ? { ...p, avatar_url: data.avatar_url } : p);
      fire("Photo updated.");
    } else fire(data.error || "Upload failed.");
  };

  const handleUserAction = async (userId: string, action: string) => {
    if ((action === "grant_admin" || action === "revoke_admin") && !confirm(action === "grant_admin" ? "Give this user full admin access?" : "Revoke admin access?")) return;
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, action }) });
    const update = (u: User): User => {
      if (u.id !== userId) return u;
      if (action === "grant_admin") return { ...u, is_admin: true };
      if (action === "revoke_admin") return { ...u, is_admin: false };
      if (action === "grant_blue_badge") return { ...u, admin_verified: true };
      if (action === "revoke_blue_badge") return { ...u, admin_verified: false };
      if (action === "grant_group_create") return { ...u, can_create_groups: true };
      if (action === "revoke_group_create") return { ...u, can_create_groups: false };
      if (action === "grant_verified") return { ...u, is_verified: true };
      if (action === "revoke_verified") return { ...u, is_verified: false };
      return u;
    };
    setUsers(prev => prev.map(update));
    if (activeUser?.id === userId) setActiveUser(prev => prev ? update(prev) : prev);
    fire("Updated.");
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      setAdminGroups(prev => prev.filter(g => g.id !== groupId));
      fire("Group deleted.");
    } else {
      const d = await res.json();
      fire(d.error || "Delete failed.");
    }
  };

  const handleReportAction = async (id: string, status: string) => {
    await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setReports(prev => prev.filter(r => r.id !== id));
    fire(`Marked as ${status}.`);
  };

  const handleBroadcast = async () => {
    setBError("");
    if (!bForm.title || !bForm.message) { setBError("Title and message required."); return; }
    setBSending(true);
    const res = await fetch("/api/admin/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bForm) });
    const data = await res.json();
    if (!res.ok) { setBError(data.error || "Failed."); setBSending(false); return; }
    fire(`Sent to ${data.sent} users.`);
    setBForm({ title: "", message: "", type: "announcement" });
    fetch("/api/admin/broadcast").then(r => r.json()).then(d => setBroadcasts(d.broadcasts || []));
    setBSending(false);
  };

  if (!adminProfile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f4f6f9", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "#111827", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40 }}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1f2937" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>IMS</p>
            <p style={{ fontSize: 11, color: "#4b5563", marginTop: 1 }}>Admin Dashboard</p>
          </Link>
        </div>

        {/* Admin avatar */}
        <div style={{ padding: "20px", borderBottom: "1px solid #1f2937" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar name={adminProfile.name} url={adminProfile.avatar_url} size={40} radius={10} />
              <button
                onClick={() => avatarRef.current?.click()}
                style={{ position: "absolute", bottom: -3, right: -3, width: 18, height: 18, background: "#0d7377", border: "2px solid #111827", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                title="Change photo">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminProfile.name}</p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>@{adminProfile.username}</p>
            </div>
          </div>
          <Link href={`/profile/${adminProfile.username}`} style={{ display: "block", textAlign: "center", fontSize: 11.5, color: "#6b7280", textDecoration: "none", padding: "5px 0", border: "1px solid #1f2937", borderRadius: 6, transition: "all 0.1s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#d1d5db"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
            View my profile →
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%", fontSize: 13.5, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? "#1f2937" : "transparent", color: section === item.id ? "#ffffff" : "#6b7280", transition: "all 0.1s" }}>
              <span style={{ opacity: section === item.id ? 1 : 0.6 }}>{NAV_ICONS[item.id]}</span>
              {item.label}
              {item.id === "reports" && reports.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10, background: "#dc2626", color: "#fff", borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{reports.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f2937" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, color: "#6b7280", textDecoration: "none", fontSize: 13, transition: "color 0.1s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#d1d5db"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:6}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              {NAV_ITEMS.find(n => n.id === section)?.label || "Admin"}
            </h1>
          </div>
          <span style={{ fontSize: 11.5, color: "#9ca3af" }}>IMS Admin Panel</span>
        </div>

        <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

          {/* ── OVERVIEW ── */}
          {section === "overview" && (
            analyticsLoading || !analytics ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "80px 0" }}>{analyticsLoading ? "Loading..." : "No data."}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {[
                    { label: "Total users", value: analytics.users.total, sub: `+${analytics.users.last7d} this week · +${analytics.users.last30d} this month`, color: "#0d7377" },
                    { label: "Total posts", value: analytics.posts.total, sub: `+${analytics.posts.last7d} this week`, color: "#7c3aed" },
                    { label: "Ideas", value: analytics.content.ideas, color: "#d97706" },
                    { label: "Startups", value: analytics.content.startups, color: "#059669" },
                    { label: "Research Papers", value: analytics.content.papers, color: "#2563eb" },
                    { label: "Events", value: analytics.content.events, color: "#db2777" },
                    { label: "Jobs", value: analytics.content.jobs, color: "#ea580c" },
                    { label: "Groups", value: analytics.content.groups, color: "#7c3aed" },
                    { label: "Pending Reports", value: analytics.pendingReports, warn: analytics.pendingReports > 0, color: "#dc2626" },
                  ].map((s, i) => (
                    <div key={i} onClick={() => s.warn && s.value > 0 ? setSection("reports") : null}
                      style={{ background: "#fff", border: `1px solid ${s.warn && s.value > 0 ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 12, padding: "18px 20px", cursor: s.warn && s.value > 0 ? "pointer" : "default" }}>
                      <div style={{ width: 32, height: 4, background: s.warn && s.value > 0 ? "#dc2626" : s.color, borderRadius: 2, marginBottom: 12 }} />
                      <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{s.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: s.warn && s.value > 0 ? "#dc2626" : "#111827", letterSpacing: "-0.04em" }}>{s.value.toLocaleString()}</p>
                      {s.sub && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{s.sub}</p>}
                    </div>
                  ))}
                </div>

                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 20 }}>New signups — last 14 days</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                    {Object.entries(analytics.signupsByDay).map(([day, count]) => {
                      const max = Math.max(...Object.values(analytics.signupsByDay), 1);
                      const pct = (count / max) * 100;
                      return (
                        <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }} title={`${day}: ${count} signups`}>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>{count > 0 ? count : ""}</span>
                          <div style={{ width: "100%", background: count > 0 ? "#0d7377" : "#f3f4f6", borderRadius: "4px 4px 0 0", height: `${Math.max(pct, 4)}%`, transition: "height 0.3s" }} />
                          <span style={{ fontSize: 10, color: "#d1d5db" }}>{day.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── USERS ── */}
          {section === "users" && (
            <div style={{ display: "grid", gridTemplateColumns: activeUser ? "1fr 320px" : "1fr", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ marginBottom: 14 }}>
                  <input placeholder="Search by name, username, email, phone..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 420, background: "#fff" }} />
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                  {usersLoading ? (
                    <p style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>Loading...</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          {["User", "Email", "Role", "Status", "Joined"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No users found.</td></tr>
                        ) : users.map((u, i) => (
                          <tr key={u.id}
                            onClick={() => setActiveUser(activeUser?.id === u.id ? null : u)}
                            style={{ borderBottom: i < users.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer", background: activeUser?.id === u.id ? "#f0fdf4" : "transparent", transition: "background 0.1s" }}
                            onMouseEnter={e => { if (activeUser?.id !== u.id) (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
                            onMouseLeave={e => { if (activeUser?.id !== u.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <Avatar name={u.name} url={u.avatar_url} size={32} radius={8} />
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{u.name}</p>
                                    {u.is_admin && <span style={{ fontSize: 9, background: "#0d7377", color: "#fff", borderRadius: 3, padding: "1px 5px" }}>ADMIN</span>}
                                  </div>
                                  <p style={{ fontSize: 11.5, color: "#9ca3af" }}>@{u.username}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#6b7280" }}>{u.email || "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#6b7280" }}>{u.role || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                {u.admin_verified && <span style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, padding: "1px 6px" }}>✓ Verified</span>}
                                {u.is_verified && <span style={{ fontSize: 10, background: "#e6f7f8", color: "#0d7377", border: "1px solid #b2e4e6", borderRadius: 4, padding: "1px 6px" }}>Member</span>}
                                {u.can_create_groups && <span style={{ fontSize: 10, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: 4, padding: "1px 6px" }}>Groups</span>}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                              {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>{userTotal} total users · click a row to manage</p>
                  </div>
                </div>
              </div>

              {/* User detail panel */}
              {activeUser && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", position: "sticky", top: 80 }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar name={activeUser.name} url={activeUser.avatar_url} size={44} radius={10} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{activeUser.name}</p>
                        <p style={{ fontSize: 12.5, color: "#9ca3af" }}>@{activeUser.username}</p>
                        {activeUser.email && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{activeUser.email}</p>}
                      </div>
                    </div>
                    <button onClick={() => setActiveUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                  </div>

                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Permissions</p>

                    {[
                      { label: "Admin access", sub: "Full admin panel access", active: activeUser.is_admin, grant: "grant_admin", revoke: "revoke_admin", danger: true },
                      { label: "Blue ✓ badge", sub: "Verified by IMS admin", active: activeUser.admin_verified, grant: "grant_blue_badge", revoke: "revoke_blue_badge" },
                      { label: "Green verified", sub: "Member verified badge", active: activeUser.is_verified, grant: "grant_verified", revoke: "revoke_verified" },
                      { label: "Create groups", sub: "Can create public/private groups", active: activeUser.can_create_groups, grant: "grant_group_create", revoke: "revoke_group_create" },
                    ].map(item => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f9fafb", borderRadius: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{item.label}</p>
                          <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{item.sub}</p>
                        </div>
                        <button
                          onClick={() => handleUserAction(activeUser.id, item.active ? item.revoke : item.grant)}
                          style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: item.active ? (item.danger ? "#dc2626" : "#0d7377") : "#e5e7eb", color: item.active ? "#fff" : "#6b7280", transition: "all 0.1s", fontFamily: "inherit" }}>
                          {item.active ? "Revoke" : "Grant"}
                        </button>
                      </div>
                    ))}

                    <Link href={`/profile/${activeUser.username}`} target="_blank"
                      style={{ display: "block", textAlign: "center", fontSize: 12.5, color: "#0d7377", textDecoration: "none", padding: "8px", border: "1px solid #b2e4e6", borderRadius: 7, marginTop: 4 }}>
                      View profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GROUPS ── */}
          {section === "groups" && (
            groupsLoading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "80px" }}>Loading...</p>
            : (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0 }}>{adminGroups.length} groups</p>
                  <input placeholder="Filter groups..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} style={{ maxWidth: 220, fontSize: 12.5, padding: "5px 10px" }} />
                  <Link href="/groups" target="_blank" style={{ fontSize: 12.5, color: "#0d7377", textDecoration: "none", flexShrink: 0 }}>View all →</Link>
                </div>
                {adminGroups.length === 0 ? (
                  <p style={{ padding: "40px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No groups yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        {["Group", "Type", "Category", "Members", "Creator", "Created", ""].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminGroups.filter(g => !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase()) || g.creator?.name?.toLowerCase().includes(groupSearch.toLowerCase())).map((g, i) => (
                        <tr key={g.id} style={{ borderBottom: i < adminGroups.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{g.name}</p>
                            <p style={{ fontSize: 11.5, color: "#9ca3af", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.description}</p>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: g.type === "private" ? "#7c3aed" : "#0d7377", background: g.type === "private" ? "#f5f3ff" : "#e6f7f8", border: `1px solid ${g.type === "private" ? "#ddd6fe" : "#b2e4e6"}`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{g.type}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#6b7280", textTransform: "capitalize" }}>{g.category}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#111827", fontWeight: 600 }}>{g.member_count}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#6b7280" }}>{g.creator?.name || "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>{new Date(g.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <Link href={`/groups/${g.id}`} target="_blank" style={{ fontSize: 12, color: "#0d7377", textDecoration: "none", padding: "5px 10px", border: "1px solid #b2e4e6", borderRadius: 6 }}>View</Link>
                              <button onClick={() => handleDeleteGroup(g.id, g.name)}
                                style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          )}

          {/* ── BROADCAST ── */}
          {section === "broadcast" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>New broadcast</h2>
                  <p style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>Sends an email to all users via Resend.</p>
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6, fontWeight: 500 }}>Type</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["announcement", "event", "update", "alert"].map(t => (
                        <button key={t} onClick={() => setBForm({ ...bForm, type: t })}
                          style={{ flex: 1, padding: "7px 0", border: `1px solid ${bForm.type === t ? "#0d7377" : "#e5e7eb"}`, borderRadius: 7, background: bForm.type === t ? "#e6f7f8" : "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: bForm.type === t ? 600 : 400, color: bForm.type === t ? "#0d7377" : "#6b7280", textTransform: "capitalize", fontFamily: "inherit" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 5, fontWeight: 500 }}>Title</label>
                    <input placeholder="Broadcast title" value={bForm.title} onChange={e => setBForm({ ...bForm, title: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Message</label>
                      <span style={{ fontSize: 11, color: bForm.message.length > 800 ? "#dc2626" : "#9ca3af" }}>{bForm.message.length} chars</span>
                    </div>
                    <textarea placeholder="Your message..." value={bForm.message} onChange={e => setBForm({ ...bForm, message: e.target.value })} style={{ resize: "none", minHeight: 100 }} />
                  </div>
                  {bError && <p style={{ fontSize: 13, color: "#dc2626" }}>{bError}</p>}
                  <button onClick={handleBroadcast} disabled={bSending} style={{ background: "#0d7377", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {bSending ? "Sending..." : "Send broadcast"}
                  </button>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Sent broadcasts</p>
                {broadcasts.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>None yet.</p>
                ) : broadcasts.map((b, i) => (
                  <div key={b.id || i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{b.title}</p>
                    <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 }}>{b.message.slice(0, 80)}{b.message.length > 80 ? "…" : ""}</p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#059669" }}>{b.recipient_count} reached</span>
                      <span style={{ fontSize: 12, color: "#d1d5db" }}>{timeAgo(b.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {section === "reports" && (
            reportsLoading ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "80px" }}>Loading...</p>
            : reports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>All clear</p>
                <p style={{ fontSize: 13.5, color: "#9ca3af" }}>No pending reports.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{reports.length} pending report{reports.length !== 1 ? "s" : ""}</p>
                {reports.map(r => (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", padding: "3px 10px", borderRadius: 6 }}>{r.reason}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>by @{r.reporter?.username} · {timeAgo(r.created_at)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.post && (
                          <button onClick={async () => {
                            if (!confirm("Delete this post? Cannot be undone.")) return;
                            await fetch(`/api/posts/${r.post!.id}`, { method: "DELETE" });
                            handleReportAction(r.id, "resolved");
                          }} style={{ fontSize: 12.5, padding: "6px 14px", border: "1px solid #fca5a5", borderRadius: 7, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Delete post</button>
                        )}
                        <button onClick={() => handleReportAction(r.id, "resolved")} style={{ fontSize: 12.5, padding: "6px 14px", border: "1px solid #0d7377", borderRadius: 7, background: "#e6f7f8", color: "#0d7377", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Resolve</button>
                        <button onClick={() => handleReportAction(r.id, "dismissed")} style={{ fontSize: 12.5, padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#9ca3af", cursor: "pointer", fontFamily: "inherit" }}>Dismiss</button>
                      </div>
                    </div>
                    {r.post && (
                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", marginBottom: r.details ? 8 : 0 }}>
                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 4 }}>Post by @{r.post.author?.username}</p>
                        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{r.post.content?.slice(0, 240)}{(r.post.content?.length || 0) > 240 ? "…" : ""}</p>
                      </div>
                    )}
                    {r.details && <p style={{ fontSize: 12.5, color: "#6b7280", fontStyle: "italic", marginTop: 6 }}>"{r.details}"</p>}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── DIGEST ── */}
          {section === "digest" && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Jumu&apos;ah Weekly Digest</h2>
                  <p style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>Sends top posts, ideas, papers and startups from the past 7 days to all users.</p>
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: "14px 16px", background: "#f5fbfb", border: "1px solid #b2e4e6", borderRadius: 8 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0a5f63", marginBottom: 4 }}>Send on Fridays 🕌</p>
                    <p style={{ fontSize: 13, color: "#0a5f63", lineHeight: 1.6 }}>The Jumu&apos;ah digest is best sent on Fridays as a sunnah. It compiles the most engaged content from the last 7 days and emails every registered user.</p>
                  </div>
                  {lastDigestSent && (
                    <div style={{ padding: "10px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12.5, color: "#6b7280" }}>
                      Last sent: <strong style={{ color: "#111827" }}>{new Date(lastDigestSent).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                    </div>
                  )}
                  <button onClick={async () => {
                    setDigestSending(true);
                    const res = await fetch("/api/admin/digest", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) { fire(`Jumu'ah digest sent to ${data.sent} users.`); const now = new Date().toISOString(); localStorage.setItem("ims_last_digest", now); setLastDigestSent(now); }
                    else fire(data.error || "Failed.");
                    setDigestSending(false);
                  }} disabled={digestSending}
                    style={{ background: "#0d7377", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {digestSending ? "Sending..." : "Send Jumu'ah digest now"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#111827", color: "#fff", borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 500, zIndex: 200, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", animation: "toastIn 0.18s ease" }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
