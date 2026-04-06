import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { skill } = await req.json();
  if (!skill) return NextResponse.json({ error: "Skill required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("username", username).single();
  if (!profile) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (profile.id === user.id) return NextResponse.json({ error: "Can't endorse yourself." }, { status: 400 });

  const { data: existing } = await admin.from("skill_endorsements")
    .select("id").eq("profile_id", profile.id).eq("endorser_id", user.id).eq("skill", skill).single();

  if (existing) {
    await admin.from("skill_endorsements").delete().eq("id", existing.id);
    return NextResponse.json({ endorsed: false });
  }

  await admin.from("skill_endorsements").insert({ profile_id: profile.id, endorser_id: user.id, skill });
  await admin.from("notifications").insert({ user_id: profile.id, type: "endorsement", actor_id: user.id, message: `endorsed your skill: ${skill}` });
  return NextResponse.json({ endorsed: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("username", username).single();
  if (!profile) return NextResponse.json({ endorsements: [] });

  const { data } = await admin.from("skill_endorsements")
    .select("skill, endorser:profiles!skill_endorsements_endorser_id_fkey(name, username)")
    .eq("profile_id", profile.id);

  // Group by skill
  const grouped: Record<string, { count: number; endorsers: { name: string; username: string }[] }> = {};
  for (const e of data || []) {
    if (!grouped[e.skill]) grouped[e.skill] = { count: 0, endorsers: [] };
    grouped[e.skill].count++;
    if (grouped[e.skill].endorsers.length < 3) grouped[e.skill].endorsers.push(e.endorser as unknown as { name: string; username: string });
  }

  return NextResponse.json({ endorsements: Object.entries(grouped).map(([skill, v]) => ({ skill, ...v })) });
}
