import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = await createClient();
    const admin = createAdminClient();

    let query = admin
      .from("posts")
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, name, username, role, is_verified, github_verified, orcid_verified),
        likes:post_likes(count),
        replies:post_replies(count)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();

    let likedPostIds: string[] = [];
    let bookmarkedPostIds: string[] = [];
    if (user) {
      const [likedData, bookmarkedData] = await Promise.all([
        admin.from("post_likes").select("post_id").eq("user_id", user.id),
        admin.from("bookmarks").select("post_id").eq("user_id", user.id).not("post_id", "is", null),
      ]);
      likedPostIds = (likedData.data || []).map((l: { post_id: string }) => l.post_id);
      bookmarkedPostIds = (bookmarkedData.data || []).map((b: { post_id: string }) => b.post_id);
    }

    const posts = (data || []).map((post: Record<string, unknown>) => ({
      ...post,
      likeCount: Array.isArray(post.likes) ? (post.likes[0] as { count: number })?.count || 0 : 0,
      replyCount: Array.isArray(post.replies) ? (post.replies[0] as { count: number })?.count || 0 : 0,
      liked: likedPostIds.includes(post.id as string),
      bookmarked: bookmarkedPostIds.includes(post.id as string),
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
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { content, category, tags } = await req.json();
    if (!content || !category) return NextResponse.json({ error: "Content and category are required." }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("posts")
      .insert({ user_id: user.id, content, category, tags: tags || [] })
      .select(`*, author:profiles!posts_user_id_fkey(id, name, username, role, is_verified, github_verified, orcid_verified)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ post: { ...data, likeCount: 0, replyCount: 0, liked: false, bookmarked: false } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
