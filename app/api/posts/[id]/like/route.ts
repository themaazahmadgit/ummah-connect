import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).single();

  if (existing) {
    await admin.from("post_likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  }

  await admin.from("post_likes").insert({ post_id: postId, user_id: user.id });

  // Notify post owner
  const { data: post } = await admin.from("posts").select("user_id").eq("id", postId).single();
  if (post && post.user_id !== user.id) {
    await admin.from("notifications").insert({ user_id: post.user_id, type: "like", actor_id: user.id, post_id: postId, message: "liked your post" });
  }

  return NextResponse.json({ liked: true });
}
