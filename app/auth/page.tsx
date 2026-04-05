"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/data";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", password: "", location: "", bio: "", expertise: [] as string[], github: "", orcid: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const toggleExpertise = (id: string) =>
    setForm(p => ({ ...p, expertise: p.expertise.includes(id) ? p.expertise.filter(e => e !== id) : [...p.expertise, id] }));

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError("");
    if (!form.email) { setError("Enter your email address."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send reset email."); return; }
      setResetSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!form.name || !form.username || !form.email || !form.password) {
      setError("Name, username, email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          location: form.location,
          bio: form.bio,
          expertise: form.expertise,
          github: form.github,
          orcid: form.orcid,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      // After signup, login to get session
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (loginRes.ok) {
        router.push("/onboarding");
      } else {
        router.push("/auth");
      }
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
        <Link href="/" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>Back to home</Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {mode !== "forgot" && (
            <div style={{ display: "flex", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 9, padding: 3, marginBottom: 24 }}>
              {(["signup", "login"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); setResetSent(false); }}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 7, fontSize: 13.5, fontWeight: mode === m ? 600 : 400,
                    cursor: "pointer", border: "none", transition: "all 0.1s", fontFamily: "inherit",
                    background: mode === m ? "#ffffff" : "transparent",
                    color: mode === m ? "#111827" : "#9ca3af",
                    boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}>
                  {m === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>
          )}

          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
            {mode === "forgot" ? (
              <div style={{ padding: 24 }}>
                {resetSent ? (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Check your email</p>
                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>We sent a password reset link to <strong>{form.email}</strong>.</p>
                    <button onClick={() => { setMode("login"); setResetSent(false); }} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>Back to sign in</button>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: 17, marginBottom: 4 }}>Reset password</h2>
                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Enter your email and we'll send you a reset link.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                      {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
                      <button onClick={handleForgot} disabled={loading} className="btn btn-primary" style={{ justifyContent: "center", padding: "11px" }}>
                        {loading ? "Sending..." : "Send reset link"}
                      </button>
                      <button onClick={() => { setMode("login"); setError(""); }} className="btn btn-ghost" style={{ justifyContent: "center" }}>
                        Back to sign in
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : mode === "login" ? (
              <div style={{ padding: 24 }}>
                <h2 style={{ fontSize: 17, marginBottom: 4 }}>Welcome back</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Sign into your account.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
                  <button onClick={handleLogin} disabled={loading} className="btn btn-primary" style={{ justifyContent: "center", padding: "11px" }}>
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: 12.5, color: "#9ca3af" }}>
                    Forgot password?{" "}
                    <span onClick={() => { setMode("forgot"); setError(""); setResetSent(false); }}
                      style={{ color: "#059669", cursor: "pointer" }}>Reset</span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 6, padding: "14px 24px", borderBottom: "1px solid #f3f4f6" }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{ flex: 1, height: 2, borderRadius: 999, background: s <= step ? "#059669" : "#e5e7eb", transition: "background 0.2s" }} />
                  ))}
                </div>

                <div style={{ padding: 24 }}>
                  {step === 1 && (
                    <div>
                      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Create your profile</h2>
                      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Step 1 of 3</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
                        <button onClick={() => { setError(""); setStep(2); }} className="btn btn-primary" style={{ justifyContent: "center" }}>Continue</button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h2 style={{ fontSize: 16, marginBottom: 4 }}>About you</h2>
                      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Step 2 of 3</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                        <textarea placeholder="Short bio (160 chars max)" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: "none", minHeight: 80 }} maxLength={160} />
                        <div>
                          <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 8 }}>Areas of expertise</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                              <button key={cat.id} onClick={() => toggleExpertise(cat.id)}
                                className={`pill ${form.expertise.includes(cat.id) ? "pill-active" : ""}`}
                                style={{ fontSize: 12 }}>
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>Back</button>
                          <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>Continue</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Get verified</h2>
                      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Step 3 of 3 — optional</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ padding: "12px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                          <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>GitHub username</label>
                          <input placeholder="yourusername" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} style={{ background: "#fff" }} />
                          <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 5 }}>Shows a verified builder badge on your profile.</p>
                        </div>
                        <div style={{ padding: "12px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                          <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 6 }}>ORCID iD</label>
                          <input placeholder="0000-0002-1234-5678" value={form.orcid} onChange={e => setForm({ ...form, orcid: e.target.value })} style={{ background: "#fff" }} />
                          <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 5 }}>For researchers and academics.</p>
                        </div>
                        {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ flex: 1 }}>Back</button>
                          <button onClick={handleSignup} disabled={loading} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>
                            {loading ? "Creating account..." : "Create account"}
                          </button>
                        </div>
                        <button onClick={handleSignup} disabled={loading}
                          style={{ fontSize: 12.5, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                          Skip for now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 11.5, color: "#d1d5db", marginTop: 16 }}>
            By joining you agree to keep it halal.
          </p>
        </div>
      </div>
    </div>
  );
}
