import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const limit = parseInt(searchParams.get("limit") || "20");

  const supabase = await createClient();
  const admin = createAdminClient();

  const now = new Date().toISOString();

  let query = admin
    .from("posts")
    .select(`*, author:profiles!posts_user_id_fkey(id, name, username, role, is_verified, admin_verified, github_verified, orcid_verified, avatar_url), likes:post_likes(count), replies:post_replies(count), poll:post_polls(id, options)`)
    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category && category !== "all") query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();

  let likedPostIds: string[] = [];
  let bookmarkedPostIds: string[] = [];
  let myVotes: Record<string, number> = {};

  if (user) {
    const postIds = (data || []).map((p: Record<string, unknown>) => p.id as string);
    const pollIds = (data || []).filter((p: Record<string, unknown>) => p.poll).map((p: Record<string, unknown>) => (p.poll as { id: string }[])[0]?.id).filter(Boolean);

    const [likedData, bookmarkedData, votesData] = await Promise.all([
      admin.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      admin.from("bookmarks").select("post_id").eq("user_id", user.id).not("post_id", "is", null),
      pollIds.length > 0 ? admin.from("poll_votes").select("poll_id, option_index").eq("user_id", user.id).in("poll_id", pollIds) : Promise.resolve({ data: [] }),
    ]);
    likedPostIds = (likedData.data || []).map((l: { post_id: string }) => l.post_id);
    bookmarkedPostIds = (bookmarkedData.data || []).map((b: { post_id: string }) => b.post_id);
    for (const v of votesData.data || []) {
      myVotes[v.poll_id] = v.option_index;
    }
  }

  // Get poll vote counts
  const pollIds2 = (data || []).filter((p: Record<string, unknown>) => p.poll).map((p: Record<string, unknown>) => (p.poll as { id: string }[])[0]?.id).filter(Boolean);
  let pollCounts: Record<string, Record<number, number>> = {};
  if (pollIds2.length > 0) {
    const { data: allVotes } = await admin.from("poll_votes").select("poll_id, option_index").in("poll_id", pollIds2);
    for (const v of allVotes || []) {
      if (!pollCounts[v.poll_id]) pollCounts[v.poll_id] = {};
      pollCounts[v.poll_id][v.option_index] = (pollCounts[v.poll_id][v.option_index] || 0) + 1;
    }
  }

  const posts = (data || []).map((post: Record<string, unknown>) => {
    const pollArr = post.poll as { id: string; options: string[] }[] | null;
    const poll = pollArr?.[0] || null;
    return {
      ...post,
      likeCount: Array.isArray(post.likes) ? (post.likes[0] as { count: number })?.count || 0 : 0,
      replyCount: Array.isArray(post.replies) ? (post.replies[0] as { count: number })?.count || 0 : 0,
      liked: likedPostIds.includes(post.id as string),
      bookmarked: bookmarkedPostIds.includes(post.id as string),
      poll: poll ? { ...poll, counts: pollCounts[poll.id] || {}, myVote: myVotes[poll.id] ?? null } : null,
    };
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { content, category, tags, poll_options, scheduled_at } = await req.json();
  if (!content || !category) return NextResponse.json({ error: "Content and category required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .insert({ user_id: user.id, content, category, tags: tags || [], scheduled_at: scheduled_at || null })
    .select(`*, author:profiles!posts_user_id_fkey(id, name, username, role, is_verified, admin_verified, github_verified, orcid_verified, avatar_url)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let poll = null;
  if (poll_options && poll_options.filter((o: string) => o.trim()).length >= 2) {
    const { data: pollData } = await admin.from("post_polls")
      .insert({ post_id: data.id, options: poll_options.filter((o: string) => o.trim()) })
      .select().single();
    if (pollData) poll = { ...pollData, counts: {}, myVote: null };
  }

  return NextResponse.json({ post: { ...data, likeCount: 0, replyCount: 0, liked: false, bookmarked: false, poll } });
}
