"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  recipient_count: number;
  created_at: string;
  admin: { name: string; username: string };
}

interface User {
  id: string;
  name: string;
  username: string;
  location: string | null;
  role: string | null;
  is_verified: boolean;
  github_verified: boolean;
  orcid_verified: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ANALYTICS = [
  { title: "Top countries", items: [["Indonesia", 22], ["Pakistan", 18], ["Turkey", 12], ["Nigeria", 10], ["Malaysia", 8]] },
  { title: "Top categories", items: [["Tech", 34], ["Islam", 28], ["Business", 16], ["Science", 12], ["Art", 10]] },
];

export default function AdminPage() {
  const [tab, setTab] = useState("broadcast");
  const [form, setForm] = useState({ title: "", message: "", type: "announcement" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [msgForm, setMsgForm] = useState({ recipient_username: "", subject: "", body: "", visibility: "private" });
  const [msgError, setMsgError] = useState("");
  const [msgSending, setMsgSending] = useState(false);

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/broadcast");
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts || []);
      }
    } catch {
      // Silently fail — user may not be admin yet
    }
  }, []);

  const fetchUsers = useCallback(async (q: string) => {
    setUsersLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/admin/users${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setUserTotal(data.total || 0);
      }
    } catch {
      // Silently fail
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  useEffect(() => {
    if (tab === "users") {
      fetchUsers(search);
    }
  }, [tab, fetchUsers, search]);

  const handleSendBroadcast = async () => {
    setBroadcastError("");
    if (!form.title || !form.message) { setBroadcastError("Title and message are required."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, message: form.message, type: form.type }),
      });
      const data = await res.json();
      if (!res.ok) { setBroadcastError(data.error || "Failed to send broadcast."); return; }
      fire(`Broadcast sent to ${data.sent} users.`);
      setForm({ title: "", message: "", type: "announcement" });
      fetchBroadcasts();
    } catch {
      setBroadcastError("Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendMessage = async () => {
    setMsgError("");
    if (!msgForm.recipient_username || !msgForm.subject || !msgForm.body) { setMsgError("All fields required."); return; }
    setMsgSending(true);
    try {
      const res = await fetch("/api/admin/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msgForm) });
      const data = await res.json();
      if (!res.ok) { setMsgError(data.error || "Failed to send."); return; }
      fire(`Message sent to @${msgForm.recipient_username}.`);
      setMsgForm({ recipient_username: "", subject: "", body: "", visibility: "private" });
    } catch { setMsgError("Failed to send."); }
    finally { setMsgSending(false); }
  };

  const TABS = ["broadcast", "message", "users", "analytics"];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Admin</h1>
          <span className="badge badge-emerald">Admin access</span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6", marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "9px 16px", fontSize: 13.5, fontWeight: tab === t ? 600 : 400, cursor: "pointer", border: "none",
                background: "transparent", color: tab === t ? "#059669" : "#6b7280",
                borderBottom: tab === t ? "2px solid #059669" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.1s", fontFamily: "inherit", textTransform: "capitalize",
              }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "broadcast" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }}>
            <div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600 }}>New broadcast</h2>
                  <p style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>Sends an email to all users via Resend.</p>
                </div>
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Type</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["announcement", "event", "update", "alert"].map(t => (
                        <button key={t} onClick={() => setForm({ ...form, type: t })}
                          className={`pill ${form.type === t ? "pill-active" : ""}`}
                          style={{ textTransform: "capitalize", fontSize: 12 }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Title</label>
                    <input placeholder="Broadcast title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Message</label>
                    <textarea placeholder="Your message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ resize: "none", minHeight: 90 }} />
                  </div>
                  <div style={{ padding: "10px 12px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 7 }}>
                    <p style={{ fontSize: 12.5, color: "#92400e" }}>This will send an email to all registered users via Resend.</p>
                  </div>
                  {broadcastError && <p style={{ fontSize: 13, color: "#dc2626" }}>{broadcastError}</p>}
                  <button onClick={handleSendBroadcast} disabled={sending}
                    className="btn btn-primary" style={{ justifyContent: "center", padding: "10px" }}>
                    {sending ? "Sending..." : "Send broadcast"}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="section-label" style={{ marginBottom: 12 }}>Recent</p>
              {broadcasts.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>No broadcasts yet.</p>
              ) : broadcasts.map((b, i) => (
                <div key={b.id || i} className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{b.title}</p>
                  <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 }}>{b.message}</p>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#059669" }}>{b.recipient_count} reached</span>
                    <span style={{ fontSize: 12, color: "#d1d5db" }}>{timeAgo(b.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "message" && (
          <div style={{ maxWidth: 520 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Send message to user</h2>
                <p style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>Admin message. You choose who sees it.</p>
              </div>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Recipient username</label>
                  <input placeholder="username (without @)" value={msgForm.recipient_username} onChange={e => setMsgForm({ ...msgForm, recipient_username: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Subject</label>
                  <input placeholder="Message subject" value={msgForm.subject} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>Message</label>
                  <textarea placeholder="Write your message..." value={msgForm.body} onChange={e => setMsgForm({ ...msgForm, body: e.target.value })} style={{ resize: "none", minHeight: 100 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 8 }}>Visibility</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["private", "Private", "Only visible to the user"], ["public", "Public", "Visible on their profile to everyone"]].map(([val, label, desc]) => (
                      <button key={val} onClick={() => setMsgForm({ ...msgForm, visibility: val })}
                        style={{ flex: 1, padding: "10px 12px", border: `1px solid ${msgForm.visibility === val ? "#0d7377" : "#e5e7eb"}`, borderRadius: 8, background: msgForm.visibility === val ? "#e6f7f8" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.1s" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: msgForm.visibility === val ? "#0d7377" : "#374151", marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "10px 12px", background: msgForm.visibility === "public" ? "#fffbeb" : "#f5fbfb", border: `1px solid ${msgForm.visibility === "public" ? "#fde68a" : "#b2e4e6"}`, borderRadius: 7 }}>
                  <p style={{ fontSize: 12.5, color: msgForm.visibility === "public" ? "#92400e" : "#0a5f63" }}>
                    {msgForm.visibility === "public"
                      ? "This message will appear publicly on the user's profile."
                      : "This message will only be visible to the user in their notifications."}
                  </p>
                </div>
                {msgError && <p style={{ fontSize: 13, color: "#dc2626" }}>{msgError}</p>}
                <button onClick={handleSendMessage} disabled={msgSending} className="btn btn-primary" style={{ justifyContent: "center", padding: "10px" }}>
                  {msgSending ? "Sending..." : "Send message"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div>
            <div style={{ marginBottom: 14, maxWidth: 320 }}>
              <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {usersLoading ? (
              <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
            ) : (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                      {["User", "Location", "Role", "Badges", "Joined", ""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11.5, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "24px 14px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                          Nothing yet. Be the first.
                        </td>
                      </tr>
                    ) : filtered.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div className="avatar avatar-emerald" style={{ width: 28, height: 28, fontSize: 11 }}>{u.name[0]}</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{u.name}</p>
                              <p style={{ fontSize: 11.5, color: "#9ca3af" }}>@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b7280" }}>{u.location || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b7280" }}>{u.role || "—"}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            {u.is_verified && <span className="badge badge-emerald" style={{ fontSize: 10 }}>verified</span>}
                            {u.github_verified && <span className="badge badge-github" style={{ fontSize: 10 }}>GitHub</span>}
                            {u.orcid_verified && <span className="badge badge-orcid" style={{ fontSize: 10 }}>ORCID</span>}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#9ca3af" }}>
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <a href={`/profile/${u.username}`} className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>View</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "10px 14px", borderTop: "1px solid #f9fafb", background: "#fafafa" }}>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>Showing {filtered.length} of {userTotal} users</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {ANALYTICS.map((s, i) => (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px" }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 16 }}>{s.title}</p>
                {s.items.map(([label, pct], j) => (
                  <div key={j} style={{ marginBottom: j < s.items.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: "#4b5563" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Real analytics</p>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                Real-time analytics will appear here once data accumulates — user growth, post volume, category trends, geographic distribution, and engagement rates.
              </p>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
