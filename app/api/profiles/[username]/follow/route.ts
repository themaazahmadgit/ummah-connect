import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id").eq("username", username).single();
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });

  const { data: existing } = await admin.from("follows").select("id").eq("follower_id", user.id).eq("following_id", target.id).single();

  if (existing) {
    await admin.from("follows").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  }

  await admin.from("follows").insert({ follower_id: user.id, following_id: target.id });
  await admin.from("notifications").insert({ user_id: target.id, type: "follow", actor_id: user.id, message: "started following you" });
  return NextResponse.json({ following: true });
}
