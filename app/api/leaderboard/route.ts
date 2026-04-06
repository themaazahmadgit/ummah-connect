import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();

  const [profiles, posts, postLikes, ideas, ideaUpvotes, startups, startupBackers, papers, followers, endorsements] = await Promise.all([
    admin.from("profiles").select("id, name, username, is_verified, location, role"),
    admin.from("posts").select("user_id"),
    admin.from("post_likes").select("post_id, posts!inner(user_id)"),
    admin.from("ideas").select("user_id"),
    admin.from("idea_upvotes").select("idea_id, ideas!inner(user_id)"),
    admin.from("startups").select("user_id"),
    admin.from("startup_backers").select("startup_id, startups!inner(user_id)"),
    admin.from("research_papers").select("user_id"),
    admin.from("follows").select("following_id"),
    admin.from("skill_endorsements").select("profile_id"),
  ]);

  const count = (arr: { user_id?: string }[] | null, userId: string) =>
    (arr || []).filter((x) => x.user_id === userId).length;

  const countNested = (arr: Record<string, unknown>[] | null, key: string, userId: string) =>
    (arr || []).filter((x) => {
      const nested = x[key] as { user_id?: string } | null;
      return nested?.user_id === userId;
    }).length;

  const countById = (arr: { following_id?: string; profile_id?: string }[] | null, field: "following_id" | "profile_id", userId: string) =>
    (arr || []).filter((x) => x[field] === userId).length;

  const scored = (profiles.data || []).map(p => {
    const postCount = count(posts.data as { user_id: string }[], p.id);
    const likesReceived = countNested(postLikes.data as Record<string, unknown>[], "posts", p.id);
    const ideaCount = count(ideas.data as { user_id: string }[], p.id);
    const upvotesReceived = countNested(ideaUpvotes.data as Record<string, unknown>[], "ideas", p.id);
    const startupCount = count(startups.data as { user_id: string }[], p.id);
    const backersReceived = countNested(startupBackers.data as Record<string, unknown>[], "startups", p.id);
    const paperCount = count(papers.data as { user_id: string }[], p.id);
    const followerCount = countById(followers.data as { following_id: string }[], "following_id", p.id);
    const endorsementCount = countById(endorsements.data as { profile_id: string }[], "profile_id", p.id);

    const score = postCount * 2 + likesReceived * 3 + ideaCount * 4 + upvotesReceived * 2 + startupCount * 10 + backersReceived * 5 + paperCount * 6 + followerCount * 1 + endorsementCount * 2;

    return {
      ...p,
      score,
      postCount,
      likesReceived,
      ideaCount,
      upvotesReceived,
      startupCount,
      paperCount,
      followerCount,
      endorsementCount,
    };
  });

  const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 50);
  return NextResponse.json({ leaderboard: sorted });
}
