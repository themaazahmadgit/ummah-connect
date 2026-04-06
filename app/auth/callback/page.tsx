"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Supabase puts the tokens in the URL hash after email confirmation
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("success");
        setTimeout(() => router.push("/onboarding"), 1200);
      } else if (event === "USER_UPDATED" && session) {
        setStatus("success");
        setTimeout(() => router.push("/feed"), 1200);
      }
    });

    // Also check current session in case already resolved
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("success");
        setTimeout(() => router.push("/feed"), 1200);
      }
    });

    // Timeout fallback
    const t = setTimeout(() => {
      setStatus("error");
    }, 8000);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 360, padding: "0 24px" }}>
        {status === "verifying" && (
          <>
            <div style={{ width: 44, height: 44, background: "#0d7377", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Verifying your email...</p>
            <p style={{ fontSize: 13.5, color: "#9ca3af" }}>Just a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ width: 44, height: 44, background: "#059669", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Email verified!</p>
            <p style={{ fontSize: 13.5, color: "#9ca3af" }}>Taking you in...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ width: 44, height: 44, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Link expired or invalid</p>
            <p style={{ fontSize: 13.5, color: "#9ca3af", marginBottom: 20 }}>This confirmation link has expired. Try signing in to get a new one.</p>
            <a href="/auth" style={{ display: "inline-block", background: "#0d7377", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
