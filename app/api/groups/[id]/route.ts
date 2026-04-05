import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: group, error } = await admin.from("groups")
    .select("*, creator:profiles!groups_user_id_fkey(name, username, is_verified)")
    .eq("id", id)
    .single();

  if (error || !group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  const { data: posts } = await admin.from("group_posts")
    .select("*, author:profiles!group_posts_user_id_fkey(name, username, is_verified)")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: members } = await admin.from("group_members")
    .select("role, member:profiles!group_members_user_id_fkey(name, username, is_verified)")
    .eq("group_id", id)
    .limit(20);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isMember = false;
  let role = null;
  if (user) {
    const { data: m } = await admin.from("group_members").select("role").eq("group_id", id).eq("user_id", user.id).single();
    isMember = !!m;
    role = m?.role || null;
  }

  return NextResponse.json({ group, posts: posts || [], members: members || [], isMember, role });
}
