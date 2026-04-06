import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroCTA from "@/components/HeroCTA";

const FEATURES = [
  {
    title: "Feed",
    desc: "Share thoughts and insights with the global Muslim community. Real conversations, no algorithm.",
    color: "#0d7377", bg: "#e6f7f8",
  },
  {
    title: "Ideas",
    desc: "Post your idea, get feedback from builders and investors across the ummah.",
    color: "#7c3aed", bg: "#f5f3ff",
  },
  {
    title: "Startups",
    desc: "Muslim-founded startups showcase progress and backers in public — transparency by default.",
    color: "#d97706", bg: "#fffbeb",
  },
  {
    title: "Groups",
    desc: "Topic communities for tech, fiqh, medicine, finance and more. Public or private.",
    color: "#059669", bg: "#f0fdf4",
  },
  {
    title: "Events",
    desc: "Muslim conferences, hackathons, and networking. Discover what the community is building.",
    color: "#db2777", bg: "#fdf2f8",
  },
  {
    title: "Research",
    desc: "Academics share papers with Muslim professionals worldwide. ORCID-verified credibility.",
    color: "#2563eb", bg: "#eff6ff",
  },
];

async function getStats() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const res = await fetch(`${base}/api/stats`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return res.json() as Promise<{ members: number; posts: number; countries: number }>;
  } catch {
    return null;
  }
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ padding: "120px 24px 100px", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#0d7377", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}>
            Open to everyone
          </p>

          <h1 style={{ fontSize: "clamp(36px, 6vw, 58px)", fontWeight: 900, color: "#111827", lineHeight: 1.08, letterSpacing: "-0.035em", marginBottom: 28 }}>
            Where the Muslim<br />
            <span style={{ color: "#0d7377" }}>ummah builds</span><br />
            in public.
          </h1>

          <p style={{ fontSize: "clamp(15px, 2.5vw, 17px)", color: "#6b7280", lineHeight: 1.8, maxWidth: 460, margin: "0 auto 48px" }}>
            Post ideas, fund startups, share research, and connect with Muslims across every field. No algorithm. No noise.
          </p>

          <HeroCTA />

          {/* Live stats */}
          {stats && (stats.members > 0 || stats.posts > 0) && (
            <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 52, flexWrap: "wrap" }}>
              {[
                { value: fmt(stats.members), label: "members" },
                { value: fmt(stats.posts), label: "posts" },
                { value: `${stats.countries}+`, label: "countries" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "#f3f4f6", maxWidth: 1080, margin: "0 auto", width: "100%" }} />

      {/* ── FEATURES ── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 14 }}>
              Everything in one place
            </h2>
            <p style={{ fontSize: 16, color: "#9ca3af", maxWidth: 420, margin: "0 auto" }}>
              Built for how Muslims actually work and collaborate.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, border: "1px solid #f3f4f6", borderRadius: 16, overflow: "hidden" }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{ borderRadius: 0, border: "none", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.color, marginBottom: 20 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 10, letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 16 }}>
            Ready to join?
          </h2>
          <p style={{ fontSize: 16, color: "#9ca3af", marginBottom: 40, lineHeight: 1.7 }}>
            Free forever. No credit card. No invite. Just the ummah.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0d7377", color: "#fff", padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              Create your account
            </Link>
            <Link href="/feed"
              style={{ display: "inline-flex", alignItems: "center", padding: "13px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: "none", border: "1px solid #e5e7eb", color: "#374151" }}>
              Browse the feed
            </Link>
          </div>
          <p style={{ fontSize: 13, color: "#d1d5db", marginTop: 28 }}>
            Free forever · No personal DMs · Public by design
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #f3f4f6", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>IMS</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[["Feed", "/feed"], ["Ideas", "/ideas"], ["Startups", "/startups"], ["Groups", "/groups"], ["Research", "/papers"], ["Events", "/events"], ["Jobs", "/jobs"]].map(([l, h]) => (
              <Link key={h} href={h} className="footer-link">{l}</Link>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#d1d5db" }}>© 2026 IMS</p>
        </div>
      </footer>
    </div>
  );
}
