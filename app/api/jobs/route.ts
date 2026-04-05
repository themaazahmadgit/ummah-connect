import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const location_type = searchParams.get("location_type");

  const admin = createAdminClient();
  let query = admin
    .from("jobs")
    .select("*, poster:profiles!jobs_user_id_fkey(name, username, is_verified)")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (category && category !== "all") query = query.eq("category", category);
  if (type) query = query.eq("type", type);
  if (location_type) query = query.eq("location_type", location_type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const { title, company, description, category, type, location_type, location, salary, apply_url, apply_email } = body;
  if (!title || !company || !description) return NextResponse.json({ error: "Title, company and description are required." }, { status: 400 });
  if (!apply_url && !apply_email) return NextResponse.json({ error: "Provide an apply URL or email." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("jobs")
    .insert({ user_id: user.id, title, company, description, category: category || "tech", type: type || "full-time", location_type: location_type || "remote", location, salary, apply_url, apply_email })
    .select("*, poster:profiles!jobs_user_id_fkey(name, username, is_verified)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
