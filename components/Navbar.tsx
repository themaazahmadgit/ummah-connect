"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/Avatar";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/ideas", label: "Ideas" },
    { href: "/startups", label: "Startups" },
    { href: "/groups", label: "Groups" },
    { href: "/events", label: "Events" },
    { href: "/jobs", label: "Jobs" },
    { href: "/papers", label: "Research" },
    { href: "/trending", label: "Trending" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Fetch unread count when logged in
  useEffect(() => {
    if (!profile) return;
    fetch("/api/notifications").then(r => r.json()).then(data => {
      setUnread((data.notifications || []).filter((n: { read: boolean }) => !n.read).length);
    }).catch(() => {});
  }, [profile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
    setSearchOpen(false);
    setSearchQ("");
  };

  return (
    <nav className="nav">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
              <input
                ref={searchRef}
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search..."
                style={{ width: 200, padding: "5px 10px", fontSize: 13 }}
                onBlur={() => { if (!searchQ) setSearchOpen(false); }}
              />
              <button type="submit" className="btn btn-primary btn-sm">Go</button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="icon-btn" title="Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          )}

          {!loading && profile && (
            <>
              {/* Notifications bell */}
              <Link href="/notifications" className="icon-btn" style={{ position: "relative" }} title="Notifications">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, background: "#0d7377", borderRadius: "50%", border: "1.5px solid #fff" }} />
                )}
              </Link>

              {/* Profile dropdown */}
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f5fbfb"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                  <Avatar name={profile.name} url={(profile as unknown as { avatar_url?: string | null }).avatar_url} size={28} radius={7} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{profile.name.split(" ")[0]}</span>
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
                      ...(profile.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        onClick={() => setMenuOpen(false)}
                        style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "#374151", textDecoration: "none", borderBottom: "1px solid #f9fafb" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}>
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
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
            <Link href="/auth" className="btn btn-primary btn-sm">Join</Link>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}
