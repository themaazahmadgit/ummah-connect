import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300; // cache 5 min

export async function GET() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("posts")
    .select("tags")
    .gte("created_at", since)
    .not("tags", "is", null);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    for (const tag of row.tags || []) {
      if (tag && tag.trim()) counts[tag.trim()] = (counts[tag.trim()] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({ hashtags: sorted });
}
