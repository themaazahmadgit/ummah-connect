import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { option_index } = await req.json();
  if (option_index === undefined || option_index < 0) return NextResponse.json({ error: "Invalid option." }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("poll_votes").select("id, option_index").eq("poll_id", pollId).eq("user_id", user.id).single();

  if (existing) {
    if (existing.option_index === option_index) {
      // Unvote
      await admin.from("poll_votes").delete().eq("id", existing.id);
      return NextResponse.json({ voted: false, option_index: null });
    }
    // Change vote
    await admin.from("poll_votes").update({ option_index }).eq("id", existing.id);
    return NextResponse.json({ voted: true, option_index });
  }

  await admin.from("poll_votes").insert({ poll_id: pollId, user_id: user.id, option_index });
  return NextResponse.json({ voted: true, option_index });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("poll_votes").select("option_index").eq("poll_id", pollId);

  const counts: Record<number, number> = {};
  for (const v of data || []) {
    counts[v.option_index] = (counts[v.option_index] || 0) + 1;
  }
  return NextResponse.json({ counts, total: (data || []).length });
}
