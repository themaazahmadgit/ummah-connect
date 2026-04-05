"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Notification {
  id: string;
  type: string;
  message: string | null;
  read: boolean;
  created_at: string;
  post_id: string | null;
  idea_id: string | null;
  actor: { name: string; username: string } | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  like:             { icon: "♥", color: "#dc2626", bg: "#fef2f2" },
  reply:            { icon: "↩", color: "#2563eb", bg: "#eff6ff" },
  follow:           { icon: "＋", color: "#0d7377", bg: "#e6f7f8" },
  endorsement:      { icon: "★", color: "#d97706", bg: "#fffbeb" },
  idea_comment:     { icon: "💡", color: "#7c3aed", bg: "#f5f3ff" },
  startup_comment:  { icon: "🚀", color: "#0891b2", bg: "#ecfeff" },
  admin_message:    { icon: "📢", color: "#6b7280", bg: "#f9fafb" },
};

function getNotifText(n: Notification): { text: string; link?: string } {
  const name = n.actor?.name || "Someone";
  switch (n.type) {
    case "like":            return { text: `${name} liked your post`, link: n.post_id ? `/feed` : undefined };
    case "reply":           return { text: `${name} replied to your post`, link: n.post_id ? `/feed` : undefined };
    case "follow":          return { text: `${name} started following you`, link: n.actor ? `/profile/${n.actor.username}` : undefined };
    case "endorsement":     return { text: n.message ? `${name} ${n.message}` : `${name} endorsed a skill`, link: n.actor ? `/profile/${n.actor.username}` : undefined };
    case "idea_comment":    return { text: `${name} commented on your idea`, link: n.idea_id ? `/ideas` : undefined };
    case "startup_comment": return { text: `${name} commented on your startup`, link: `/startups` };
    case "admin_message":   return { text: `Admin sent you a message` };
    default:                return { text: n.message || n.type };
  }
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => setNotifs(data.notifications || []))
      .finally(() => setLoading(false));
    fetch("/api/notifications", { method: "POST" });
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Notifications</h1>
            {unread > 0 && <p style={{ fontSize: 12.5, color: "#0d7377" }}>{unread} unread</p>}
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔔</p>
            <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Nothing yet. When people interact with you, it shows up here.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            {notifs.map((n, i) => {
              const { text, link } = getNotifText(n);
              const style = TYPE_ICON[n.type] || { icon: "•", color: "#6b7280", bg: "#f9fafb" };
              const inner = (
                <div style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: i < notifs.length - 1 ? "1px solid #f9fafb" : "none", background: n.read ? "#fff" : "#f5fbfb", transition: "background 0.1s" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, color: style.color }}>
                    {style.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, color: "#111827", lineHeight: 1.5, marginBottom: 3 }}>{text}</p>
                    {n.type === "admin_message" && n.message && (
                      <p style={{ fontSize: 13, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", marginTop: 6, lineHeight: 1.55 }}>{n.message}</p>
                    )}
                    <span suppressHydrationWarning style={{ fontSize: 12, color: "#9ca3af" }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0d7377", flexShrink: 0, marginTop: 6 }} />}
                </div>
              );
              return link ? (
                <Link key={n.id} href={link} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
