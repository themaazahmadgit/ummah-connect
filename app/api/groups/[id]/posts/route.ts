import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: membership } = await admin.from("group_members").select("id").eq("group_id", id).eq("user_id", user.id).single();
  if (!membership) return NextResponse.json({ error: "Join the group first." }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required." }, { status: 400 });

  const { data, error } = await admin.from("group_posts")
    .insert({ group_id: id, user_id: user.id, content: content.trim() })
    .select("*, author:profiles!group_posts_user_id_fkey(name, username, is_verified)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
