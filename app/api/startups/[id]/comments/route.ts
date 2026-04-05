import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("startup_comments")
    .select("*, author:profiles!startup_comments_user_id_fkey(name, username, is_verified)")
    .eq("startup_id", id)
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
  const { data, error } = await admin.from("startup_comments")
    .insert({ startup_id: id, user_id: user.id, content: content.trim() })
    .select("*, author:profiles!startup_comments_user_id_fkey(name, username, is_verified)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify startup owner
  const { data: startup } = await admin.from("startups").select("user_id").eq("id", id).single();
  if (startup && startup.user_id !== user.id) {
    await admin.from("notifications").insert({ user_id: startup.user_id, type: "startup_comment", actor_id: user.id, message: "commented on your startup" });
  }

  return NextResponse.json({ comment: data });
}
