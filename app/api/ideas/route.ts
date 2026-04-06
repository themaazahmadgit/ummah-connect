import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const supabase = await createClient();

    let query = supabase
      .from("ideas")
      .select(`
        *,
        author:profiles!ideas_user_id_fkey(id, name, username, location),
        upvotes:idea_upvotes(count),
        contributors:idea_contributors(count)
      `)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    let upvotedIds: string[] = [];
    let joinedIds: string[] = [];

    if (user) {
      const { data: upvoteData } = await supabase
        .from("idea_upvotes")
        .select("idea_id")
        .eq("user_id", user.id);
      upvotedIds = (upvoteData || []).map((u: { idea_id: string }) => u.idea_id);

      const { data: joinData } = await supabase
        .from("idea_contributors")
        .select("idea_id")
        .eq("user_id", user.id);
      joinedIds = (joinData || []).map((j: { idea_id: string }) => j.idea_id);
    }

    const ideas = (data || []).map((idea: Record<string, unknown>) => ({
      ...idea,
      upvoteCount: Array.isArray(idea.upvotes) ? (idea.upvotes[0] as { count: number })?.count || 0 : 0,
      contributorCount: Array.isArray(idea.contributors) ? (idea.contributors[0] as { count: number })?.count || 0 : 0,
      upvoted: upvotedIds.includes(idea.id as string),
      joined: joinedIds.includes(idea.id as string),
    }));

    return NextResponse.json({ ideas });
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

    const { title, description, category, tags } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Title, description and category are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ideas")
      .insert({ user_id: user.id, title, description, category, tags: tags || [] })
      .select(`
        *,
        author:profiles!ideas_user_id_fkey(id, name, username, location)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ idea: { ...data, upvoteCount: 0, contributorCount: 0, upvoted: false, joined: false } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
