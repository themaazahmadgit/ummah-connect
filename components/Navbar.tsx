"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/ideas", label: "Ideas" },
    { href: "/startups", label: "Startups" },
  ];

  return (
    <nav className="nav">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: "#111827", textDecoration: "none", letterSpacing: "-0.02em" }}>
            IMS
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
          {!loading && profile ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8 }}>
                <div className="avatar avatar-emerald" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 7 }}>
                  {profile.name[0]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{profile.name.split(" ")[0]}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {menuOpen && (
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 50 }}>
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ position: "fixed", top: 52, right: 24, width: 200, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{profile.name}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>@{profile.username}</p>
                    </div>
                    {[
                      { label: "My profile", href: `/profile/${profile.username}` },
                      ...(profile.is_admin ? [{ label: "Admin", href: "/admin" }] : []),
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "#374151", textDecoration: "none", borderBottom: "1px solid #f9fafb" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}>
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={signOut}
                      style={{ width: "100%", padding: "10px 14px", fontSize: 13, color: "#dc2626", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fef2f2"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !loading ? (
            <Link href="/auth" className="btn btn-primary btn-sm">Join</Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
