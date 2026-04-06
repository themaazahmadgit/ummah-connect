import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: startup, error } = await admin
    .from("startups")
    .select("*, founder:profiles!startups_user_id_fkey(id, name, username, location, is_verified, bio, role)")
    .eq("id", id)
    .single();

  if (error || !startup) return NextResponse.json({ error: "Startup not found." }, { status: 404 });

  const [backersRes, updatesRes] = await Promise.all([
    admin.from("startup_backers").select("id, amount, profiles(name, username, is_verified)").eq("startup_id", id).order("created_at", { ascending: false }),
    admin.from("startup_updates").select("id, content, created_at, profiles(name, username)").eq("startup_id", id).order("created_at", { ascending: false }),
  ]);

  let backed = false;
  if (user) {
    const { data: b } = await admin.from("startup_backers").select("id").eq("startup_id", id).eq("user_id", user.id).single();
    backed = !!b;
  }

  return NextResponse.json({
    startup: { ...startup, backerCount: backersRes.data?.length || 0, updateCount: updatesRes.data?.length || 0, backed },
    backers: backersRes.data || [],
    updates: updatesRes.data || [],
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Post a startup update (founder only)
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Update cannot be empty." }, { status: 400 });

  const admin = createAdminClient();
  const { data: startup } = await admin.from("startups").select("user_id").eq("id", id).single();
  if (!startup || startup.user_id !== user.id) return NextResponse.json({ error: "Not your startup." }, { status: 403 });

  const { data, error } = await admin.from("startup_updates").insert({ startup_id: id, user_id: user.id, content }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ update: data });
}
