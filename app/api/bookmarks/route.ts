import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookmarks")
    .select(`
      id, created_at,
      post_id, posts(id, content, category, created_at, profiles(name, username)),
      idea_id, ideas(id, title, description, category, created_at, profiles(name, username)),
      startup_id, startups(id, name, tagline, category, created_at, profiles(name, username))
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookmarks: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { post_id, idea_id, startup_id } = await req.json();
  if (!post_id && !idea_id && !startup_id) return NextResponse.json({ error: "Nothing to bookmark." }, { status: 400 });

  const admin = createAdminClient();

  let existing;
  if (post_id) {
    ({ data: existing } = await admin.from("bookmarks").select("id").eq("user_id", user.id).eq("post_id", post_id).single());
  } else if (idea_id) {
    ({ data: existing } = await admin.from("bookmarks").select("id").eq("user_id", user.id).eq("idea_id", idea_id).single());
  } else {
    ({ data: existing } = await admin.from("bookmarks").select("id").eq("user_id", user.id).eq("startup_id", startup_id).single());
  }

  if (existing) {
    await admin.from("bookmarks").delete().eq("id", existing.id);
    return NextResponse.json({ bookmarked: false });
  }

  await admin.from("bookmarks").insert({ user_id: user.id, post_id: post_id || null, idea_id: idea_id || null, startup_id: startup_id || null });
  return NextResponse.json({ bookmarked: true });
}
