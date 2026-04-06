import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminProfile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const { data: post } = await admin.from("posts").select("pinned").eq("id", id).single();
  const newPinned = !post?.pinned;
  await admin.from("posts").update({ pinned: newPinned }).eq("id", id);
  return NextResponse.json({ pinned: newPinned });
}
