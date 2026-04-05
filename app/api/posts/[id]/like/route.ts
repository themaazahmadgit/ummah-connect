import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Unlike
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      return NextResponse.json({ liked: true });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
