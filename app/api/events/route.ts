import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = admin
    .from("events")
    .select("*, organiser:profiles!events_user_id_fkey(name, username, is_verified), rsvps:event_rsvps(count)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(40);

  if (category && category !== "all") query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rsvpedIds: string[] = [];
  if (user) {
    const { data: r } = await admin.from("event_rsvps").select("event_id").eq("user_id", user.id);
    rsvpedIds = (r || []).map((x: { event_id: string }) => x.event_id);
  }

  const events = (data || []).map((e: Record<string, unknown>) => ({
    ...e,
    rsvpCount: Array.isArray(e.rsvps) ? (e.rsvps[0] as { count: number })?.count || 0 : 0,
    rsvped: rsvpedIds.includes(e.id as string),
  }));

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const { title, description, category, type, location, url, starts_at, ends_at } = body;
  if (!title || !description || !starts_at) return NextResponse.json({ error: "Title, description and start date are required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("events")
    .insert({ user_id: user.id, title, description, category: category || "islam", type: type || "online", location, url, starts_at, ends_at })
    .select("*, organiser:profiles!events_user_id_fkey(name, username, is_verified)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: { ...data, rsvpCount: 0, rsvped: false } });
}
