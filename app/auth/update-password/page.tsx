"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Supabase puts the session in the URL hash after redirect
  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  const handleUpdate = async () => {
    setError("");
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setDone(true);
      setTimeout(() => router.push("/auth"), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 56, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: "#111827", textDecoration: "none" }}>IMS</Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)", padding: 28 }}>
            {done ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Password updated</p>
                <p style={{ fontSize: 13, color: "#6b7280" }}>Redirecting you to sign in...</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 17, marginBottom: 4 }}>Set new password</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Choose a strong password for your account.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
                  <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                  {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
                  <button onClick={handleUpdate} disabled={loading} className="btn btn-primary" style={{ justifyContent: "center", padding: "11px" }}>
                    {loading ? "Updating..." : "Update password"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
