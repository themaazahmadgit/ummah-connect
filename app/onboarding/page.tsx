"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/data";

const STEPS = ["Welcome", "Your profile", "Interests", "Skills"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", bio: "", role: "", location: "", expertise: [] as string[], skills: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleExpertise = (id: string) => {
    setForm(f => ({ ...f, expertise: f.expertise.includes(id) ? f.expertise.filter(e => e !== id) : [...f.expertise, id] }));
  };

  const handleFinish = async () => {
    setError("");
    setSaving(true);
    try {
      const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, bio: form.bio, role: form.role, location: form.location, expertise: form.expertise, skills }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed."); return; }
      router.push("/feed");
    } catch { setError("Failed. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, background: "#0d7377", borderRadius: 10, marginBottom: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Welcome to IMS</h1>
          <p style={{ fontSize: 13.5, color: "#6b7280" }}>Set up your profile in 2 minutes</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= step ? "#0d7377" : "#e5e7eb", transition: "background 0.2s" }} />
          ))}
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 1 }}>Step {step + 1} of {STEPS.length}</p>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>{STEPS[step]}</h2>
          </div>

          <div style={{ padding: 20 }}>
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                  IMS is a space for Muslims to post, build, and grow together — free from noise, with real conversations about ideas, startups, research, and more.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Post on the feed", "Share thoughts, questions, and insights"],
                    ["Join groups", "Public or private topic communities"],
                    ["Build in public", "Post your startup, idea, or research paper"],
                    ["Connect", "Follow people in your field"],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: "#0d7377", marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 1 }}>{title}</p>
                        <p style={{ fontSize: 12.5, color: "#6b7280" }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Full name <span style={{ color: "#dc2626" }}>*</span></label>
                  <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Bio (optional)</label>
                  <textarea placeholder="A few words about yourself..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: "none", minHeight: 70 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Role (optional)</label>
                    <input placeholder="e.g. Engineer, Student" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Location (optional)</label>
                    <input placeholder="e.g. London" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Pick areas you're interested in. This helps surface relevant content for you.</p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                    <button key={cat.id} onClick={() => toggleExpertise(cat.id)}
                      className={`pill ${form.expertise.includes(cat.id) ? "pill-active" : ""}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>What skills do you have? Others can endorse these.</p>
                <div>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Skills (comma separated)</label>
                  <input placeholder="e.g. Python, Arabic, UX Design, Fiqh" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>You can always update this in settings later.</p>
                {error && <p style={{ fontSize: 13, color: "#dc2626", marginTop: 10 }}>{error}</p>}
              </div>
            )}
          </div>

          <div style={{ padding: "14px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => { if (step === 1 && !form.name.trim()) { setError("Name is required."); return; } setError(""); setStep(s => s + 1); }}
                className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>
                Continue
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving} className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}>
                {saving ? "Saving..." : "Go to IMS"}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#d1d5db" }}>
          <button onClick={() => router.push("/feed")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12.5 }}>Skip for now</button>
        </p>
      </div>
    </div>
  );
}
