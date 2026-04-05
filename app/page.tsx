import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroCTA from "@/components/HeroCTA";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#e6f7f8", border: "1px solid #b2e4e6", borderRadius: 999, padding: "4px 12px", marginBottom: 32 }}>
            <span style={{ width: 5, height: 5, background: "#0d7377", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#0a5f63", fontWeight: 500 }}>Open to everyone — no invite needed</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5.5vw, 52px)", fontWeight: 800, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Chat is cooked.<br />The vision needs more.
          </h1>

          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 36px" }}>
            IMS is a public platform for the global Muslim community. Post ideas, fund startups, build in the open. No algorithm. No noise.
          </p>

          <HeroCTA />

          <p style={{ marginTop: 24, fontSize: 12.5, color: "#d1d5db" }}>
            Free forever &nbsp;·&nbsp; No personal DMs &nbsp;·&nbsp; Public by design
          </p>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #f3f4f6", padding: "20px 24px" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#d1d5db", fontWeight: 600 }}>IMS</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Feed", "/feed"], ["Ideas", "/ideas"], ["Startups", "/startups"]].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontSize: 12.5, color: "#d1d5db", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
