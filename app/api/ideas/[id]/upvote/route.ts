import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ideaId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("idea_upvotes")
      .select("id")
      .eq("idea_id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("idea_upvotes").delete().eq("idea_id", ideaId).eq("user_id", user.id);
      return NextResponse.json({ upvoted: false });
    } else {
      await supabase.from("idea_upvotes").insert({ idea_id: ideaId, user_id: user.id });
      return NextResponse.json({ upvoted: true });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
