import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from("posts")
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, name, username, role, is_verified, github_verified, orcid_verified),
        likes:post_likes(count)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get current user to check liked status
    const { data: { user } } = await supabase.auth.getUser();

    let likedPostIds: string[] = [];
    if (user) {
      const { data: likedData } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      likedPostIds = (likedData || []).map((l: { post_id: string }) => l.post_id);
    }

    const posts = (data || []).map((post: Record<string, unknown>) => ({
      ...post,
      likeCount: Array.isArray(post.likes) ? (post.likes[0] as { count: number })?.count || 0 : 0,
      liked: likedPostIds.includes(post.id as string),
    }));

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { content, category, tags } = await req.json();

    if (!content || !category) {
      return NextResponse.json({ error: "Content and category are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content,
        category,
        tags: tags || [],
      })
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, name, username, role, is_verified, github_verified, orcid_verified)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ post: { ...data, likeCount: 0, liked: false } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
