"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Result {
  type: "page" | "search";
  label: string;
  sub?: string;
  href: string;
  icon: string;
}

const PAGES: Result[] = [
  { type: "page", label: "Feed",       sub: "Posts from the community",     href: "/feed",       icon: "M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h.01" },
  { type: "page", label: "Ideas",      sub: "Startup ideas & contributors", href: "/ideas",      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { type: "page", label: "Startups",   sub: "Muslim-founded companies",     href: "/startups",   icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { type: "page", label: "Groups",     sub: "Community groups",             href: "/groups",     icon: "M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
  { type: "page", label: "Events",     sub: "Muslim events & conferences",  href: "/events",     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" },
  { type: "page", label: "Research",   sub: "Papers & academics",           href: "/papers",     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" },
  { type: "page", label: "Jobs",       sub: "Muslim job board",             href: "/jobs",       icon: "M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" },
  { type: "page", label: "Mentorship", sub: "Find a mentor or mentee",      href: "/mentorship", icon: "M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197L15 21z" },
  { type: "page", label: "World Map",  sub: "Global zone intelligence",     href: "/world",      icon: "M3.055 11H5a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2 2 2 0 0 1 2 2v2.945M8 3.935V5.5A2.5 2.5 0 0 0 10.5 8h.5a2 2 0 0 1 2 2 2 2 0 0 0 4 0 2 2 0 0 1 2-2h1.064M15 20.488V18a2 2 0 0 1 2-2h3.064M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { type: "page", label: "People",     sub: "Discover members",             href: "/people",     icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" },
  { type: "page", label: "Leaderboard",sub: "Top contributors",             href: "/leaderboard",icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2m9 11V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v14m5 0h3m-3 0a2 2 0 0 1-2-2m5 2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" },
  { type: "page", label: "Settings",   sub: "Account & profile",            href: "/settings",   icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
];

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results: Result[] = query.trim().length === 0
    ? PAGES
    : [
        ...PAGES.filter(p =>
          p.label.toLowerCase().includes(query.toLowerCase()) ||
          (p.sub || "").toLowerCase().includes(query.toLowerCase())
        ),
        ...(query.trim().length >= 2 ? [{
          type: "search" as const,
          label: `Search "${query}"`,
          href: `/search?q=${encodeURIComponent(query.trim())}`,
          icon: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
        }] : []),
      ];

  const go = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, [router]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setSelected(0); }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) go(results[selected].href);
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", backdropFilter: "blur(6px)", zIndex: 999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "18vh" }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid #e5e7eb" }}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search pages, people, posts..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent", color: "#111827" }}
          />
          <kbd style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 5, padding: "2px 6px" }}>esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {results.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: 13.5 }}>No results for "{query}"</p>
          ) : results.map((r, i) => (
            <button key={r.href} onClick={() => go(r.href)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: i === selected ? "#f5fbfb" : "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f9fafb" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: i === selected ? "#e6f7f8" : "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={i === selected ? "#0d7377" : "#9ca3af"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={r.icon}/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: i === selected ? "#0d7377" : "#111827" }}>{r.label}</p>
                {r.sub && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{r.sub}</p>}
              </div>
              {r.type === "page" && (
                <span style={{ fontSize: 11, color: "#d1d5db" }}>↵</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "8px 16px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 16 }}>
          {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <kbd style={{ fontSize: 10.5, color: "#9ca3af", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, padding: "1px 5px" }}>{k}</kbd>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
