import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("idea_comments")
    .select("*, author:profiles!idea_comments_user_id_fkey(name, username, is_verified)")
    .eq("idea_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("idea_comments")
    .insert({ idea_id: id, user_id: user.id, content: content.trim() })
    .select("*, author:profiles!idea_comments_user_id_fkey(name, username, is_verified)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify idea owner
  const { data: idea } = await admin.from("ideas").select("user_id").eq("id", id).single();
  if (idea && idea.user_id !== user.id) {
    await admin.from("notifications").insert({ user_id: idea.user_id, type: "idea_comment", actor_id: user.id, idea_id: id, message: "commented on your idea" });
  }

  return NextResponse.json({ comment: data });
}
