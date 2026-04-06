import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Only allow author or admin to delete
  const { data: post } = await admin.from("zone_posts").select("user_id").eq("id", id).single();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (post.user_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("zone_votes").delete().eq("zone_id", id);
  await admin.from("zone_posts").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
