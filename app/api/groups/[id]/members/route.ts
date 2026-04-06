import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH — group admin sets member tag, promotes, or removes a member
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();

  // Verify caller is group admin or site admin
  const [myMembership, myProfile] = await Promise.all([
    admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).single(),
    admin.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  const isGroupAdmin = myMembership.data?.role === "admin";
  const isSiteAdmin = !!myProfile.data?.is_admin;
  if (!isGroupAdmin && !isSiteAdmin) {
    return NextResponse.json({ error: "Group admin access required." }, { status: 403 });
  }

  const { target_user_id, action, tag } = await req.json();
  if (!target_user_id || !action) return NextResponse.json({ error: "target_user_id and action required." }, { status: 400 });

  // Prevent acting on yourself for destructive actions
  if (action === "remove" && target_user_id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself." }, { status: 400 });
  }

  if (action === "set_tag") {
    const { error } = await admin.from("group_members")
      .update({ tag: tag || null })
      .eq("group_id", groupId)
      .eq("user_id", target_user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "promote") {
    const { error } = await admin.from("group_members")
      .update({ role: "admin" })
      .eq("group_id", groupId)
      .eq("user_id", target_user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "demote") {
    // Make sure there's at least one other admin
    const { data: admins } = await admin.from("group_members")
      .select("user_id").eq("group_id", groupId).eq("role", "admin");
    if ((admins?.length || 0) <= 1) {
      return NextResponse.json({ error: "Group must have at least one admin." }, { status: 400 });
    }
    const { error } = await admin.from("group_members")
      .update({ role: "member" })
      .eq("group_id", groupId)
      .eq("user_id", target_user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    await admin.from("group_members").delete().eq("group_id", groupId).eq("user_id", target_user_id);
    const { data: g } = await admin.from("groups").select("member_count").eq("id", groupId).single();
    await admin.from("groups").update({ member_count: Math.max(0, (g?.member_count || 1) - 1) }).eq("id", groupId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
