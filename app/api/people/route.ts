import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const expertise = searchParams.get("expertise") || "";
  const location = searchParams.get("location") || "";

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id, name, username, bio, role, location, expertise, skills, is_verified, github_verified, orcid_verified, created_at")
    .order("created_at", { ascending: false })
    .limit(48);

  if (search) {
    query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%,role.ilike.%${search}%`);
  }
  if (expertise) {
    query = query.contains("expertise", [expertise]);
  }
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ people: data || [] });
}
