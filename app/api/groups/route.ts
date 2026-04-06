import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");

  const admin = createAdminClient();
  let query = admin
    .from("groups")
    .select("*, creator:profiles!groups_user_id_fkey(name, username, is_verified), member_count")
    .order("member_count", { ascending: false })
    .limit(50);

  if (category && category !== "all") query = query.eq("category", category);
  if (type) query = query.eq("type", type);
  else query = query.eq("type", "public");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check membership for authed user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let memberOf: string[] = [];
  let canCreate = false;

  if (user) {
    const [memberships, profile] = await Promise.all([
      admin.from("group_members").select("group_id").eq("user_id", user.id),
      admin.from("profiles").select("is_admin, can_create_groups").eq("id", user.id).single(),
    ]);
    memberOf = (memberships.data || []).map(m => m.group_id);
    canCreate = !!(profile.data?.is_admin || profile.data?.can_create_groups);
  }

  const groups = (data || []).map(g => ({ ...g, isMember: memberOf.includes(g.id) }));
  return NextResponse.json({ groups, canCreate });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin, can_create_groups").eq("id", user.id).single();
  if (!profile?.is_admin && !profile?.can_create_groups) {
    return NextResponse.json({ error: "You don't have permission to create groups." }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, category, type } = body;
  if (!name || !description) return NextResponse.json({ error: "Name and description required." }, { status: 400 });

  const { data: group, error } = await admin.from("groups")
    .insert({ user_id: user.id, name, description, category: category || "islam", type: type || "public" })
    .select("*, creator:profiles!groups_user_id_fkey(name, username, is_verified)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Creator joins as admin role in this group
  await admin.from("group_members").insert({ group_id: group.id, user_id: user.id, role: "admin" });

  return NextResponse.json({ group: { ...group, isMember: true } });
}
