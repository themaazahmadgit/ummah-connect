import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const supabase = await createClient();

    let query = supabase
      .from("startups")
      .select(`
        *,
        founder:profiles!startups_user_id_fkey(id, name, username, location, is_verified),
        backers:startup_backers(count),
        updates:startup_updates(count)
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
    let backedIds: string[] = [];

    if (user) {
      const { data: backedData } = await supabase
        .from("startup_backers")
        .select("startup_id")
        .eq("user_id", user.id);
      backedIds = (backedData || []).map((b: { startup_id: string }) => b.startup_id);
    }

    const startups = (data || []).map((s: Record<string, unknown>) => ({
      ...s,
      backerCount: Array.isArray(s.backers) ? (s.backers[0] as { count: number })?.count || 0 : 0,
      updateCount: Array.isArray(s.updates) ? (s.updates[0] as { count: number })?.count || 0 : 0,
      backed: backedIds.includes(s.id as string),
    }));

    return NextResponse.json({ startups });
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

    const { name, tagline, description, category, goal, stage } = await req.json();

    if (!name || !tagline || !description || !category || !goal) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("startups")
      .insert({ user_id: user.id, name, tagline, description, category, goal: Number(goal), stage: stage || "Pre-seed" })
      .select(`
        *,
        founder:profiles!startups_user_id_fkey(id, name, username, location, is_verified)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ startup: { ...data, backerCount: 0, updateCount: 0, backed: false } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
