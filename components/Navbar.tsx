"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);

  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/ideas", label: "Ideas" },
    { href: "/startups", label: "Startups" },
  ];

  const notifs = [
    { text: "Your post got 100+ upvotes", time: "2m", unread: true },
    { text: "Omar joined your idea", time: "1h", unread: true },
    { text: "Admin: Halal finance summit announced", time: "3h", unread: false },
  ];

  return (
    <nav className="nav">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: "#111827", textDecoration: "none", letterSpacing: "-0.02em" }}>
            Ummah Connect
          </Link>
          <div style={{ display: "flex", gap: 2 }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? "active" : ""}`}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="icon-btn" style={{ position: "relative" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ position: "absolute", top: 6, right: 6, width: 5, height: 5, background: "#059669", borderRadius: "50%", border: "1.5px solid #fff" }} />
            </button>

            {notifOpen && (
              <div style={{ position: "absolute", top: 38, right: 0, width: 300, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Notifications</span>
                  <button style={{ fontSize: 11.5, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
                </div>
                {notifs.map((n, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderBottom: i < notifs.length - 1 ? "1px solid #f9fafb" : "none", display: "flex", gap: 10, cursor: "pointer", background: n.unread ? "#fafafa" : "#fff" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.unread ? "#fafafa" : "#fff"}>
                    {n.unread && <span style={{ width: 5, height: 5, background: "#059669", borderRadius: "50%", marginTop: 7, flexShrink: 0 }} />}
                    {!n.unread && <span style={{ width: 5, flexShrink: 0 }} />}
                    <div>
                      <p style={{ fontSize: 13, color: "#374151" }}>{n.text}</p>
                      <span style={{ fontSize: 11.5, color: "#9ca3af" }}>{n.time} ago</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link href="/profile/demo" style={{ width: 28, height: 28, background: "#ecfdf5", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", fontWeight: 700, fontSize: 12, textDecoration: "none", border: "1px solid #a7f3d0" }}>
            U
          </Link>

          <Link href="/auth" className="btn btn-primary btn-sm">
            Join
          </Link>
        </div>
      </div>
    </nav>
  );
}
