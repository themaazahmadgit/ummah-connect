import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: startupId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("startup_backers")
      .select("id")
      .eq("startup_id", startupId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("startup_backers").delete().eq("startup_id", startupId).eq("user_id", user.id);
      return NextResponse.json({ backed: false });
    } else {
      const body = await req.json().catch(() => ({}));
      const amount = body.amount || 0;
      await supabase.from("startup_backers").insert({ startup_id: startupId, user_id: user.id, amount });
      return NextResponse.json({ backed: true });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
