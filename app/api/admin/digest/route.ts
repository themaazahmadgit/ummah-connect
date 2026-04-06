import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export async function POST() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminProfile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const since = new Date(Date.now() - 604800000).toISOString();

  const [postsRes, ideasRes, papersRes, startupsRes] = await Promise.all([
    admin.from("posts").select("content, profiles!posts_user_id_fkey(name)").gte("created_at", since).limit(5),
    admin.from("ideas").select("title, description, profiles!ideas_user_id_fkey(name)").gte("created_at", since).limit(3),
    admin.from("research_papers").select("title, journal, year, profiles!research_papers_user_id_fkey(name)").gte("created_at", since).limit(3),
    admin.from("startups").select("name, tagline, raised, goal").gte("created_at", since).limit(3),
  ]);

  const posts = postsRes.data || [];
  const ideas = ideasRes.data || [];
  const papers = papersRes.data || [];
  const startups = startupsRes.data || [];

  // Get real emails from Supabase Auth
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = authUsers.filter(u => u.email).map(u => ({ id: u.id, email: u.email!, name: u.user_metadata?.name || u.email!.split("@")[0] }));

  const date = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #111827; background: #f9fafb; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
  .header { background: #0d7377; padding: 28px 32px; }
  .header h1 { color: #fff; font-size: 22px; margin: 0 0 4px; }
  .header p { color: #b2e4e6; font-size: 13px; margin: 0; }
  .section { padding: 24px 32px; border-bottom: 1px solid #f3f4f6; }
  .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin: 0 0 16px; }
  .item { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f9fafb; }
  .item:last-child { border: none; margin: 0; padding: 0; }
  .item-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; }
  .item-sub { font-size: 12.5px; color: #6b7280; }
  .footer { padding: 20px 32px; text-align: center; }
  .footer p { font-size: 12px; color: #9ca3af; }
  .cta { display: inline-block; background: #0d7377; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13.5px; font-weight: 600; margin: 16px 0; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>IMS Weekly Digest</h1>
    <p>Jumu'ah Edition · ${date}</p>
  </div>

  ${posts.length > 0 ? `
  <div class="section">
    <h2>Top Posts This Week</h2>
    ${posts.map((p: Record<string, unknown>) => `
    <div class="item">
      <div class="item-title">${String((p.content as string || "").substring(0, 120))}${(p.content as string || "").length > 120 ? "..." : ""}</div>
      <div class="item-sub">by ${(p.profiles as { name: string })?.name || "Anonymous"}</div>
    </div>`).join("")}
  </div>` : ""}

  ${ideas.length > 0 ? `
  <div class="section">
    <h2>Ideas in the Community</h2>
    ${ideas.map((i: Record<string, unknown>) => `
    <div class="item">
      <div class="item-title">${String(i.title)}</div>
      <div class="item-sub">${String((i.description as string || "").substring(0, 100))}... · by ${(i.profiles as { name: string })?.name}</div>
    </div>`).join("")}
  </div>` : ""}

  ${papers.length > 0 ? `
  <div class="section">
    <h2>Research Papers Submitted</h2>
    ${papers.map((p: Record<string, unknown>) => `
    <div class="item">
      <div class="item-title">${String(p.title)}</div>
      <div class="item-sub">${p.journal ? String(p.journal) + " · " : ""}${p.year || ""} · shared by ${(p.profiles as { name: string })?.name}</div>
    </div>`).join("")}
  </div>` : ""}

  ${startups.length > 0 ? `
  <div class="section">
    <h2>Startups Building</h2>
    ${startups.map((s: Record<string, unknown>) => `
    <div class="item">
      <div class="item-title">${String(s.name)}</div>
      <div class="item-sub">${String(s.tagline)} · $${Number(s.raised).toLocaleString()} raised of $${Number(s.goal).toLocaleString()}</div>
    </div>`).join("")}
  </div>` : ""}

  <div class="footer">
    <a href="https://ims.app/feed" class="cta">Visit IMS</a>
    <p>Islamic Messaging System · You're receiving this because you're a member.<br>JazakAllah khair for being part of the Ummah.</p>
  </div>
</div>
</body>
</html>`;

  // Send to all users in batches of 100
  let sent = 0;
  for (let i = 0; i < users.length; i += 100) {
    const batch = users.slice(i, i + 100);
    await Promise.allSettled(batch.map(u =>
      resend.emails.send({
        from: "IMS <digest@ims.app>",
        to: u.email,
        subject: `Jumu'ah Digest · ${date}`,
        html,
      })
    ));
    sent += batch.length;
  }

  return NextResponse.json({ sent, date });
}
