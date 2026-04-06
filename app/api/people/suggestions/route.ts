import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ suggestions: [] });

  const admin = createAdminClient();

  // Get current user's expertise
  const { data: me } = await admin.from("profiles").select("expertise").eq("id", user.id).single();
  const myExpertise: string[] = me?.expertise || [];

  // Get who I already follow
  const { data: following } = await admin.from("follows").select("following_id").eq("follower_id", user.id);
  const followingIds = new Set((following || []).map(f => f.following_id));
  followingIds.add(user.id);

  // Get profiles with overlapping expertise, not already followed
  const { data: candidates } = await admin.from("profiles")
    .select("id, name, username, is_verified, avatar_url, role, location, expertise")
    .neq("id", user.id)
    .limit(100);

  const scored = (candidates || [])
    .filter(p => !followingIds.has(p.id))
    .map(p => {
      const overlap = myExpertise.filter(e => (p.expertise || []).includes(e)).length;
      return { ...p, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 6);

  return NextResponse.json({ suggestions: scored });
}
