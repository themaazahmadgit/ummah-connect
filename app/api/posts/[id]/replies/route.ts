import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("post_replies")
    .select("id, content, created_at, user_id, profiles(name, username, is_verified)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, name, username, is_verified").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: reply, error } = await admin
    .from("post_replies")
    .insert({ post_id: id, user_id: user.id, content: content.trim() })
    .select("id, content, created_at, user_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify post owner
  const { data: post } = await admin.from("posts").select("user_id").eq("id", id).single();
  if (post && post.user_id !== user.id) {
    await admin.from("notifications").insert({ user_id: post.user_id, type: "reply", actor_id: user.id, post_id: id, message: "replied to your post" });
  }

  return NextResponse.json({ reply: { ...reply, profiles: profile } });
}
