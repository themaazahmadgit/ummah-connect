import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav className="nav">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: "#111827", textDecoration: "none", letterSpacing: "-0.02em" }}>
              Ummah Connect
            </Link>
            <div style={{ display: "flex", gap: 2 }}>
              <Link href="/feed" className="nav-link">Feed</Link>
              <Link href="/ideas" className="nav-link">Ideas</Link>
              <Link href="/startups" className="nav-link">Startups</Link>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/auth" className="btn btn-secondary btn-sm">Sign in</Link>
            <Link href="/auth" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero — single section */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 999, padding: "4px 12px", marginBottom: 32 }}>
            <span style={{ width: 5, height: 5, background: "#059669", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#047857", fontWeight: 500 }}>Open to everyone — no invite needed</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5.5vw, 52px)", fontWeight: 800, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            A platform for Muslims<br />to think and build together.
          </h1>

          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            Post ideas publicly. Collaborate on projects. Fund Muslim-led startups with full transparency. No algorithm. No noise.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth" className="btn btn-primary btn-lg">
              Create account
            </Link>
            <Link href="/feed" className="btn btn-secondary btn-lg">
              Browse the feed
            </Link>
          </div>

          <p style={{ marginTop: 24, fontSize: 12.5, color: "#d1d5db" }}>
            Free forever &nbsp;·&nbsp; No personal DMs &nbsp;·&nbsp; Public by design
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #f3f4f6", padding: "20px 24px" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#d1d5db", fontWeight: 600 }}>Ummah Connect</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Feed", "/feed"], ["Ideas", "/ideas"], ["Startups", "/startups"], ["Admin", "/admin"]].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontSize: 12.5, color: "#d1d5db", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
