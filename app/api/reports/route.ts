import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { post_id, idea_id, reason } = await req.json();
  if (!reason?.trim()) return NextResponse.json({ error: "Reason required." }, { status: 400 });
  if (!post_id && !idea_id) return NextResponse.json({ error: "Must report a post or idea." }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("reports").insert({ reporter_id: user.id, post_id: post_id || null, idea_id: idea_id || null, reason: reason.trim() });
  return NextResponse.json({ reported: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminProfile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const { data } = await admin.from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(name, username), post:posts(content), idea:ideas(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ reports: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminProfile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const { id, status } = await req.json();
  await admin.from("reports").update({ status }).eq("id", id);
  return NextResponse.json({ updated: true });
}
