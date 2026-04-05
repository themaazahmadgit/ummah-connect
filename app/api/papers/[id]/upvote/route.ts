import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("paper_upvotes").select("id").eq("paper_id", id).eq("user_id", user.id).single();

  if (existing) {
    await admin.from("paper_upvotes").delete().eq("id", existing.id);
    return NextResponse.json({ upvoted: false });
  }
  await admin.from("paper_upvotes").insert({ paper_id: id, user_id: user.id });
  return NextResponse.json({ upvoted: true });
}
