import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "7d";
  const since = new Date(Date.now() - (period === "24h" ? 86400000 : period === "7d" ? 604800000 : 2592000000)).toISOString();

  const admin = createAdminClient();

  const [posts, ideas, papers, startups] = await Promise.all([
    admin.from("posts")
      .select("id, content, category, created_at, profiles!posts_user_id_fkey(name, username), likes:post_likes(count)")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(100),
    admin.from("ideas")
      .select("id, title, description, category, created_at, profiles!ideas_user_id_fkey(name, username), upvotes:idea_upvotes(count)")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(40),
    admin.from("research_papers")
      .select("id, title, journal, year, doi, url, category, created_at, profiles!research_papers_user_id_fkey(name, username), upvotes:paper_upvotes(count)")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(40),
    admin.from("startups")
      .select("id, name, tagline, category, raised, goal, created_at, profiles!startups_user_id_fkey(name, username), backers:startup_backers(count)")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(40),
  ]);

  const sortByCount = (arr: Record<string, unknown>[], key: string) =>
    (arr || [])
      .map(x => ({ ...x, _count: Array.isArray(x[key]) ? (x[key] as { count: number }[])[0]?.count || 0 : 0 }))
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);

  return NextResponse.json({
    posts: sortByCount(posts.data || [], "likes"),
    ideas: sortByCount(ideas.data || [], "upvotes"),
    papers: sortByCount(papers.data || [], "upvotes"),
    startups: sortByCount(startups.data || [], "backers"),
  });
}
