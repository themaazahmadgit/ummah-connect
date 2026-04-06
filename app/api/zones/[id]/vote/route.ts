import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vote } = await req.json(); // 1 or -1
  if (vote !== 1 && vote !== -1) return NextResponse.json({ error: "Vote must be 1 or -1" }, { status: 400 });

  const admin = createAdminClient();

  // Upsert vote (toggle off if same vote)
  const { data: existing } = await admin.from("zone_votes").select("vote").eq("zone_id", id).eq("user_id", user.id).single();

  if (existing?.vote === vote) {
    await admin.from("zone_votes").delete().eq("zone_id", id).eq("user_id", user.id);
  } else {
    await admin.from("zone_votes").upsert({ zone_id: id, user_id: user.id, vote }, { onConflict: "zone_id,user_id" });
  }

  // Return new counts
  const { data: votes } = await admin.from("zone_votes").select("vote").eq("zone_id", id);
  const upvotes   = (votes||[]).filter(v => v.vote === 1).length;
  const downvotes = (votes||[]).filter(v => v.vote === -1).length;
  const myVote    = existing?.vote === vote ? null : vote;

  return NextResponse.json({ upvotes, downvotes, myVote });
}
