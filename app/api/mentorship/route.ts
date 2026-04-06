import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const skill = searchParams.get("skill");

  const admin = createAdminClient();
  let query = admin.from("mentorship")
    .select("*, profile:profiles!mentorship_user_id_fkey(id, name, username, is_verified, avatar_url, role, location, expertise, skills)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (type && type !== "all") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let results = data || [];
  if (skill) results = results.filter(m => (m.skills || []).some((s: string) => s.toLowerCase().includes(skill.toLowerCase())));

  return NextResponse.json({ mentorship: results });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { type, skills, bio } = await req.json();
  if (!type || !skills?.length) return NextResponse.json({ error: "Type and at least one skill required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("mentorship")
    .upsert({ user_id: user.id, type, skills, bio, active: true }, { onConflict: "user_id" })
    .select("*, profile:profiles!mentorship_user_id_fkey(id, name, username, is_verified, avatar_url, role, location)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mentorship: data });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  await admin.from("mentorship").update({ active: false }).eq("user_id", user.id);
  return NextResponse.json({ removed: true });
}
