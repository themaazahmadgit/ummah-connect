"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/Avatar";
import CommandBar from "@/components/CommandBar";

export default function Navbar() {
  const pathname = usePathname();
  const { profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/feed",       label: "Feed" },
    { href: "/ideas",      label: "Ideas" },
    { href: "/startups",   label: "Startups" },
    { href: "/groups",     label: "Groups" },
    { href: "/events",     label: "Events" },
    { href: "/jobs",       label: "Jobs" },
    { href: "/papers",     label: "Research" },
    { href: "/mentorship", label: "Mentorship" },
    { href: "/world",      label: "World" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!profile) return;
    fetch("/api/notifications").then(r => r.json()).then(data => {
      setUnread((data.notifications || []).filter((n: { read: boolean }) => !n.read).length);
    }).catch(() => {});
  }, [profile]);


  return (
    <>
      <CommandBar />
      <nav className="nav">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>

          {/* Left: Logo + desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/" style={{ fontWeight: 800, fontSize: 15, color: "#111827", textDecoration: "none", letterSpacing: "-0.03em", marginRight: 16 }}>
              IMS
            </Link>
            <div className="nav-links" style={{ display: "flex", gap: 2 }}>
              {links.map(l => (
                <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? "active" : ""}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Cmd+K hint */}
            <button onClick={() => { const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }); window.dispatchEvent(e); }}
              className="icon-btn nav-cmdbar-btn" title="Command bar (⌘K)" style={{ gap: 4, width: "auto", padding: "4px 8px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <kbd style={{ fontSize: 10, color: "#9ca3af", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, padding: "1px 4px", lineHeight: 1.4 }}>⌘K</kbd>
            </button>


            {!loading && profile && (
              <>
                <Link href="/notifications" className="icon-btn" style={{ position: "relative" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unread > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, background: "#0d7377", borderRadius: "50%", border: "1.5px solid #fff" }} />
                  )}
                </Link>

                {/* Profile dropdown — desktop only */}
                <div ref={menuRef} style={{ position: "relative" }} className="nav-profile-desktop">
                  <button onClick={() => setMenuOpen(o => !o)}
                    style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f5fbfb"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                    <Avatar name={profile.name} url={(profile as unknown as { avatar_url?: string | null }).avatar_url} size={28} radius={7} />
                    <span className="nav-name" style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{profile.name.split(" ")[0]}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
                      style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {menuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 210, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.09)", animation: "fadeDown 0.12s ease" }}>
                      <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{profile.name}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>@{profile.username}</p>
                      </div>
                      {[
                        { href: `/profile/${profile.username}`, label: "My profile" },
                        { href: "/bookmarks", label: "Bookmarks" },
                        { href: "/people", label: "People" },
                        { href: "/settings", label: "Settings" },
                        ...(profile.is_admin ? [{ href: "/admin", label: "Admin dashboard" }] : []),
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "#374151", textDecoration: "none", borderBottom: "1px solid #f9fafb" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}>
                          {item.label}
                        </Link>
                      ))}
                      <button onClick={() => { setMenuOpen(false); signOut(); }}
                        style={{ width: "100%", padding: "10px 14px", fontSize: 13, color: "#dc2626", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fef2f2"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!loading && !profile && (
              <Link href="/auth" className="btn btn-primary btn-sm nav-join-btn">Join IMS</Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="hamburger"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
              style={{ display: "none", alignItems: "center", justifyContent: "center", width: 36, height: 36, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 0, color: "#374151" }}>
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer">
          {/* User info or join */}
          {profile ? (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={profile.name} url={(profile as unknown as { avatar_url?: string | null }).avatar_url} size={36} radius={9} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{profile.name}</p>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>@{profile.username}</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
              <Link href="/auth" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>
                Join IMS — it's free
              </Link>
            </div>
          )}

          {/* Nav links */}
          <div style={{ padding: "8px 12px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", padding: "8px 8px 4px" }}>Explore</p>
            {links.map(l => (
              <Link key={l.href} href={l.href}
                style={{ display: "flex", alignItems: "center", padding: "11px 10px", fontSize: 15, fontWeight: pathname === l.href ? 600 : 400, color: pathname === l.href ? "#0d7377" : "#111827", textDecoration: "none", borderRadius: 8, background: pathname === l.href ? "#e6f7f8" : "transparent" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Profile links */}
          {profile && (
            <div style={{ padding: "8px 12px", borderTop: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", padding: "8px 8px 4px" }}>Account</p>
              {[
                { href: `/profile/${profile.username}`, label: "My profile" },
                { href: "/bookmarks", label: "Bookmarks" },
                { href: "/settings", label: "Settings" },
                ...(profile.is_admin ? [{ href: "/admin", label: "Admin dashboard" }] : []),
              ].map(item => (
                <Link key={item.href} href={item.href}
                  style={{ display: "block", padding: "11px 10px", fontSize: 15, color: "#374151", textDecoration: "none", borderRadius: 8 }}>
                  {item.label}
                </Link>
              ))}
              <button onClick={() => { setMobileOpen(false); signOut(); }}
                style={{ width: "100%", padding: "11px 10px", fontSize: 15, color: "#dc2626", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger { display: flex !important; }
          .nav-name { display: none !important; }
          .nav-profile-desktop .nav-name { display: none !important; }
        }
        .mobile-drawer {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          background: #fff;
          z-index: 49;
          overflow-y: auto;
          border-top: 1px solid #f3f4f6;
          animation: drawerIn 0.18s ease;
        }
        @keyframes drawerIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
