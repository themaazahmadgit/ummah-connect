"use client";

import { useState, useEffect } from "react";
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

const TYPE_LABELS: Record<string, string> = {
  like: "liked your post",
  reply: "replied to your post",
  follow: "started following you",
  admin_message: "sent you a message",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => setNotifs(data.notifications || []))
      .finally(() => setLoading(false));

    // Mark all read
    fetch("/api/notifications", { method: "POST" });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 640 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Notifications</h1>

        {loading ? (
          <p style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</p>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5 }}>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            {notifs.map((n, i) => (
              <div key={n.id} style={{
                display: "flex", gap: 12, padding: "14px 16px",
                borderBottom: i < notifs.length - 1 ? "1px solid #f9fafb" : "none",
                background: n.read ? "#fff" : "#f5fbfb",
              }}>
                {!n.read && <span style={{ width: 6, height: 6, background: "#0d7377", borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />}
                {n.read && <span style={{ width: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  {n.type === "admin_message" ? (
                    <>
                      <p style={{ fontSize: 13.5, color: "#111827", marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>Admin</span> {TYPE_LABELS[n.type]}
                      </p>
                      {n.message && <p style={{ fontSize: 13, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", marginTop: 6 }}>{n.message}</p>}
                    </>
                  ) : (
                    <p style={{ fontSize: 13.5, color: "#111827" }}>
                      <span style={{ fontWeight: 600 }}>{n.actor?.name || "Someone"}</span>{" "}
                      {TYPE_LABELS[n.type] || n.type}
                    </p>
                  )}
                  <span suppressHydrationWarning style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, display: "block" }}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
