import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Stats
    const [postsRes, followersRes, followingRes, ideasRes] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", profile.id),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profile.id),
      supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    ]);

    // Check if current user follows this profile
    const { data: { user } } = await supabase.auth.getUser();
    let isFollowing = false;
    if (user) {
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single();
      isFollowing = !!followData;
    }

    // Get posts
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      profile,
      stats: {
        posts: postsRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        ideas: ideasRes.count || 0,
      },
      posts: posts || [],
      isFollowing,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
