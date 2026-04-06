import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("zone_posts")
    .select(`
      *,
      author:profiles!zone_posts_user_id_fkey(id, name, username, avatar_url, is_verified),
      votes:zone_votes(vote)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const zones = (data || []).map(z => ({
    ...z,
    upvotes:   (z.votes || []).filter((v: { vote: number }) => v.vote === 1).length,
    downvotes: (z.votes || []).filter((v: { vote: number }) => v.vote === -1).length,
    votes: undefined,
  }));

  return NextResponse.json({ zones });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, brief, category, lat, lng, region, country, tags, severity, post_type } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (post_type !== "plot" && !brief?.trim()) return NextResponse.json({ error: "Brief is required for zones." }, { status: 400 });
  if (typeof lat !== "number" || typeof lng !== "number") return NextResponse.json({ error: "Location required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("zone_posts")
    .insert({
      user_id: user.id,
      title: title.trim(),
      brief: brief?.trim() || "",
      category: category || "general",
      lat, lng,
      region: region || null,
      country: country || null,
      tags: tags || [],
      severity: severity || "medium",
      post_type: post_type || "zone",
    })
    .select(`*, author:profiles!zone_posts_user_id_fkey(id, name, username, avatar_url, is_verified)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ zone: { ...data, upvotes: 0, downvotes: 0 } });
}
