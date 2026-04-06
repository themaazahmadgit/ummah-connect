import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("group_members").select("id").eq("group_id", id).eq("user_id", user.id).single();

  if (existing) {
    // Check not last admin
    const { data: adminCount } = await admin.from("group_members").select("id", { count: "exact" }).eq("group_id", id).eq("role", "admin");
    const { data: myRole } = await admin.from("group_members").select("role").eq("group_id", id).eq("user_id", user.id).single();
    if (myRole?.role === "admin" && (adminCount?.length || 0) <= 1) {
      return NextResponse.json({ error: "You're the only admin. Transfer admin first." }, { status: 400 });
    }
    await admin.from("group_members").delete().eq("id", existing.id);
    const { data: g } = await admin.from("groups").select("member_count").eq("id", id).single();
    await admin.from("groups").update({ member_count: Math.max(0, (g?.member_count || 1) - 1) }).eq("id", id);
    return NextResponse.json({ joined: false });
  }

  await admin.from("group_members").insert({ group_id: id, user_id: user.id, role: "member" });
  const { data: g } = await admin.from("groups").select("member_count").eq("id", id).single();
  await admin.from("groups").update({ member_count: (g?.member_count || 0) + 1 }).eq("id", id);
  return NextResponse.json({ joined: true });
}
