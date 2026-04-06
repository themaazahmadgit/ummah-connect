import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 120;

export async function GET() {
  const admin = createAdminClient();

  const [members, posts, countries] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("posts").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("location").not("location", "is", null).neq("location", ""),
  ]);

  // Count distinct countries (rough: count distinct non-empty locations)
  const uniqueLocations = new Set(
    (countries.data || [])
      .map(p => (p.location || "").split(",").pop()?.trim())
      .filter(Boolean)
  );

  return NextResponse.json({
    members: members.count || 0,
    posts: posts.count || 0,
    countries: Math.max(uniqueLocations.size, 1),
  });
}
