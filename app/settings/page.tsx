"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CATEGORIES } from "@/lib/data";

interface Profile {
  name: string; bio: string; role: string; location: string;
  phone: string; phone_public: boolean; website: string; github_username: string; orcid_id: string;
  scholar_url: string; researchgate_url: string;
  github_verified: boolean; orcid_verified: boolean;
  expertise: string[]; skills: string[]; avatar_url?: string;
}

export default function SettingsPage() {
  return <Suspense><SettingsPageInner /></Suspense>;
}

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<Profile>({ name: "", bio: "", role: "", location: "", phone: "", phone_public: false, website: "", github_username: "", orcid_id: "", scholar_url: "", researchgate_url: "", github_verified: false, orcid_verified: false, expertise: [], skills: [], avatar_url: "" });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.profile) {
        const p = data.profile;
        setForm({ name: p.name || "", bio: p.bio || "", role: p.role || "", location: p.location || "", phone: p.phone || "", phone_public: !!p.phone_public, website: p.website || "", github_username: p.github_username || "", orcid_id: p.orcid_id || "", scholar_url: p.scholar_url || "", researchgate_url: p.researchgate_url || "", github_verified: !!p.github_verified, orcid_verified: !!p.orcid_verified, expertise: p.expertise || [], skills: p.skills || [], avatar_url: p.avatar_url || "" });
      }
    }).finally(() => setLoading(false));

    // Show toast when returning from OAuth
    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("error");
    if (connected === "github") { setToast("GitHub connected and verified."); setTimeout(() => setToast(""), 3000); }
    if (connected === "orcid") { setToast("ORCID connected and verified."); setTimeout(() => setToast(""), 3000); }
    if (oauthError) { setError(`Connection failed: ${oauthError.replace(/_/g, " ")}`); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed."); return; }
      setForm(f => ({ ...f, avatar_url: data.avatar_url }));
      setToast("Profile picture updated."); setTimeout(() => setToast(""), 2500);
    } catch { setError("Upload failed."); }
    finally { setAvatarUploading(false); }
  };

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
          {/* Avatar */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Profile picture</p>
            </div>
            <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="avatar" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "2px solid #e5e7eb" }} />
                ) : (
                  <div className="avatar avatar-emerald" style={{ width: 64, height: 64, fontSize: 22, borderRadius: 12 }}>{form.name?.[0] || "?"}</div>
                )}
              </div>
              <div>
                <label htmlFor="avatar-upload" style={{ cursor: "pointer" }}>
                  <div className="btn btn-secondary" style={{ fontSize: 13, display: "inline-flex" }}>
                    {avatarUploading ? "Uploading..." : "Change photo"}
                  </div>
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={avatarUploading} />
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>JPG, PNG or WebP. Max 3MB.</p>
              </div>
            </div>
          </section>

          {/* Basic */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Basic info</p>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Full name", "name"], ["Role / title", "role"], ["Location", "location"], ["Website", "website"]].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 12.5, color: "#6b7280", display: "block", marginBottom: 5 }}>{label}</label>
                  <input value={(form as unknown as Record<string, string>)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              {/* Phone with privacy toggle */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={{ fontSize: 12.5, color: "#6b7280" }}>Phone</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, phone_public: !f.phone_public }))}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                    <div style={{ width: 32, height: 18, borderRadius: 999, background: form.phone_public ? "#0d7377" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: form.phone_public ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: form.phone_public ? "#0d7377" : "#9ca3af", fontWeight: 500 }}>
                      {form.phone_public ? "Public" : "Private"}
                    </span>
                  </button>
                </div>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
                <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 4 }}>
                  {form.phone_public ? "Visible on your public profile." : "Only admins can see your phone number."}
                </p>
              </div>
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

          {/* Connected accounts */}
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>Connected accounts</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Connect your accounts to get a verified badge on your profile.</p>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* GitHub */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#111827"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>GitHub</p>
                    {form.github_verified && form.github_username ? (
                      <p style={{ fontSize: 12, color: "#059669" }}>github.com/{form.github_username}</p>
                    ) : (
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>Not connected</p>
                    )}
                  </div>
                </div>
                {form.github_verified ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#1d4ed8" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span style={{ fontSize: 12.5, color: "#1d4ed8", fontWeight: 600 }}>Verified</span>
                  </div>
                ) : (
                  <a href="/api/auth/github"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#111827", color: "#fff", borderRadius: 7, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                    Connect
                  </a>
                )}
              </div>

              <div style={{ height: 1, background: "#f3f4f6" }} />

              {/* ORCID */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="8" r="0.5" fill="#16a34a"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>ORCID</p>
                    {form.orcid_verified && form.orcid_id ? (
                      <p style={{ fontSize: 12, color: "#059669" }}>orcid.org/{form.orcid_id}</p>
                    ) : (
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>Not connected</p>
                    )}
                  </div>
                </div>
                {form.orcid_verified ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#1d4ed8" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span style={{ fontSize: 12.5, color: "#1d4ed8", fontWeight: 600 }}>Verified</span>
                  </div>
                ) : (
                  <a href="/api/auth/orcid"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#16a34a", color: "#fff", borderRadius: 7, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                    Connect
                  </a>
                )}
              </div>

              <div style={{ height: 1, background: "#f3f4f6" }} />

              {/* Google Scholar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>Google Scholar</p>
                    <input
                      placeholder="https://scholar.google.com/citations?user=..."
                      value={form.scholar_url}
                      onChange={e => setForm({ ...form, scholar_url: e.target.value })}
                      style={{ marginTop: 6, fontSize: 12.5, padding: "6px 10px" }}
                    />
                  </div>
                </div>
                {form.scholar_url && (
                  <a href={form.scholar_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#0d7377", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                    View ↗
                  </a>
                )}
              </div>

              <div style={{ height: 1, background: "#f3f4f6" }} />

              {/* ResearchGate */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 9h6M9 12h4M9 15h6"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>ResearchGate</p>
                    <input
                      placeholder="https://www.researchgate.net/profile/..."
                      value={form.researchgate_url}
                      onChange={e => setForm({ ...form, researchgate_url: e.target.value })}
                      style={{ marginTop: 6, fontSize: 12.5, padding: "6px 10px" }}
                    />
                  </div>
                </div>
                {form.researchgate_url && (
                  <a href={form.researchgate_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#0d7377", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                    View ↗
                  </a>
                )}
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
