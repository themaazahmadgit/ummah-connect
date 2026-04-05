"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Profile {
  name: string; bio: string; role: string; location: string;
  phone: string; website: string; github_username: string; orcid_id: string;
  expertise: string[]; skills: string[];
}

export default function SettingsPage() {
  const [form, setForm] = useState<Profile>({ name: "", bio: "", role: "", location: "", phone: "", website: "", github_username: "", orcid_id: "", expertise: [], skills: [] });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.profile) {
        const p = data.profile;
        setForm({ name: p.name || "", bio: p.bio || "", role: p.role || "", location: p.location || "", phone: p.phone || "", website: p.website || "", github_username: p.github_username || "", orcid_id: p.orcid_id || "", expertise: p.expertise || [], skills: p.skills || [] });
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggleExpertise = (id: string) =>
    setForm(f => ({ ...f, expertise: f.expertise.includes(id) ? f.expertise.filter(e => e !== id) : [...f.expertise, id] }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (s: string) => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

  const handleSave = async () => {
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save."); return; }
      setToast("Profile saved.");
      setTimeout(() => setToast(""), 2500);
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fff" }}><Navbar />
      <div style={{ textAlign: "center", padding: "80px 0" }}><p style={{ color: "#9ca3af" }}>Loading...</p></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 640 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h1>
          <p style={{ fontSize: 13.5, color: "#6b7280", marginTop: 2 }}>Update your profile information.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Basic info</p>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Full name", "name"], ["Role / title", "role"], ["Location", "location"], ["Website", "website"], ["Phone", "phone"]].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>{label}</label>
                  <input value={(form as unknown as Record<string, string>)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={160} style={{ resize: "none", minHeight: 80 }} placeholder="160 chars max" />
              </div>
            </div>
          </section>

          {/* Expertise */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Expertise</p>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                  <button key={cat.id} onClick={() => toggleExpertise(cat.id)}
                    className={`pill ${form.expertise.includes(cat.id) ? "pill-active" : ""}`}
                    style={{ fontSize: 12.5 }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Skills */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Skills</p>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input placeholder="e.g. React, Figma, Arabic" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                <button onClick={addSkill} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {form.skills.map(s => (
                  <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#374151", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px" }}>
                    {s}
                    <button onClick={() => removeSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Verification */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Verification</p>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>GitHub username</label>
                <input value={form.github_username} onChange={e => setForm({ ...form, github_username: e.target.value })} placeholder="yourusername" />
              </div>
              <div>
                <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>ORCID iD</label>
                <input value={form.orcid_id} onChange={e => setForm({ ...form, orcid_id: e.target.value })} placeholder="0000-0002-1234-5678" />
              </div>
            </div>
          </section>

          {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ justifyContent: "center", padding: "11px" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
