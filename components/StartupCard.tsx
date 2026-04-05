"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";

interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  founder: { name: string; username: string; avatar: string; location: string; verified: boolean };
  category: string;
  raised: number;
  goal: number;
  backers: number;
  daysLeft: number;
  perks: string[];
  updates: number;
  stage: string;
  verified: boolean;
}

export default function StartupCard({ startup }: { startup: Startup }) {
  const [backed, setBacked] = useState(false);
  const cat = CATEGORIES.find(c => c.id === startup.category);
  const pct = Math.min(100, Math.round((startup.raised / startup.goal) * 100));
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  return (
    <div className="card card-interactive" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div className="avatar" style={{ width: 40, height: 40, fontSize: 16, fontWeight: 700, borderRadius: 10, background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" }}>
          {startup.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>{startup.name}</span>
            {startup.verified && <span className="badge badge-emerald">verified</span>}
            <span className="badge badge-gray">{startup.stage}</span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>{startup.tagline}</p>
        </div>
        {cat && <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{cat.label}</span>}
      </div>

      <p style={{ fontSize: 13.5, color: "#4b5563", lineHeight: 1.65, marginBottom: 16 }}>{startup.description}</p>

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>{fmt(startup.raised)}</span>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>of {fmt(startup.goal)} goal</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 500 }}>{pct}% funded</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{startup.backers.toLocaleString()} backers · {startup.daysLeft}d left</span>
        </div>
      </div>

      {/* Perks */}
      <div style={{ marginBottom: 16, padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f3f4f6" }}>
        <p className="section-label" style={{ marginBottom: 6 }}>Supporter perks</p>
        {startup.perks.map((p, i) => (
          <p key={i} style={{ fontSize: 13, color: "#6b7280", marginTop: i > 0 ? 2 : 0 }}>— {p}</p>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="avatar avatar-emerald" style={{ width: 22, height: 22, fontSize: 10 }}>{startup.founder.avatar}</div>
          <span style={{ fontSize: 12.5, color: "#6b7280" }}>{startup.founder.name}</span>
          <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{startup.updates} updates</span>
        </div>
        <button onClick={() => setBacked(!backed)}
          className={backed ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}>
          {backed ? "Backed" : "Back this"}
        </button>
      </div>
    </div>
  );
}
