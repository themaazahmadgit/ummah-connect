"use client";

import { useState, useEffect } from "react";

interface Commodity {
  symbol: string; name: string; price: number;
  change: number; changePercent: number; unit: string;
}

export default function CommodityTicker() {
  const [items, setItems] = useState<Commodity[]>([]);

  useEffect(() => {
    fetch("/api/commodities").then(r => r.json()).then(d => setItems(d.commodities || [])).catch(() => {});
    const id = setInterval(() => {
      fetch("/api/commodities").then(r => r.json()).then(d => setItems(d.commodities || [])).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!items.length) return null;

  // Duplicate for seamless scroll
  const doubled = [...items, ...items];

  return (
    <div style={{ background: "#0a1628", borderBottom: "1px solid #1e3a5f", overflow: "hidden", height: 30, display: "flex", alignItems: "center" }}>
      <div style={{ flexShrink: 0, padding: "0 12px", borderRight: "1px solid #1e3a5f", fontSize: 10, fontWeight: 700, color: "#4a9db5", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
        Markets
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div className="ticker-scroll" style={{ display: "flex", gap: 0, whiteSpace: "nowrap" }}>
          {doubled.map((c, i) => {
            const up = c.changePercent >= 0;
            return (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 20px", borderRight: "1px solid #1e3a5f", height: 30 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{c.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
                  ${c.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: up ? "#34d399" : "#f87171" }}>
                  {up ? "▲" : "▼"} {Math.abs(c.changePercent).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .ticker-scroll {
          animation: ticker 28s linear infinite;
        }
        .ticker-scroll:hover { animation-play-state: paused; }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
