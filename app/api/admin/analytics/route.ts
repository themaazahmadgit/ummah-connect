import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminProfile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    totalUsers, newUsers7d, newUsers30d,
    totalPosts, newPosts7d,
    totalIdeas, totalStartups, totalPapers,
    totalEvents, totalJobs, totalGroups,
    totalReports,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d30),
    admin.from("posts").select("id", { count: "exact", head: true }),
    admin.from("posts").select("id", { count: "exact", head: true }).gte("created_at", d7),
    admin.from("ideas").select("id", { count: "exact", head: true }),
    admin.from("startups").select("id", { count: "exact", head: true }),
    admin.from("research_papers").select("id", { count: "exact", head: true }),
    admin.from("events").select("id", { count: "exact", head: true }),
    admin.from("jobs").select("id", { count: "exact", head: true }),
    admin.from("groups").select("id", { count: "exact", head: true }),
    admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Signups per day for last 14 days
  const { data: recentUsers } = await admin.from("profiles")
    .select("created_at")
    .gte("created_at", new Date(now.getTime() - 14 * 86400000).toISOString())
    .order("created_at", { ascending: true });

  const signupsByDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    signupsByDay[key] = 0;
  }
  for (const u of recentUsers || []) {
    const key = u.created_at.slice(0, 10);
    if (key in signupsByDay) signupsByDay[key]++;
  }

  return NextResponse.json({
    users: { total: totalUsers.count || 0, last7d: newUsers7d.count || 0, last30d: newUsers30d.count || 0 },
    posts: { total: totalPosts.count || 0, last7d: newPosts7d.count || 0 },
    content: {
      ideas: totalIdeas.count || 0,
      startups: totalStartups.count || 0,
      papers: totalPapers.count || 0,
      events: totalEvents.count || 0,
      jobs: totalJobs.count || 0,
      groups: totalGroups.count || 0,
    },
    pendingReports: totalReports.count || 0,
    signupsByDay,
  });
}
