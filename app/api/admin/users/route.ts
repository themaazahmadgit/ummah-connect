import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return null;
  return { user, admin };
}

export async function GET(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { admin } = ctx;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  // If search looks like email or phone, search auth.users first
  let filterIds: string[] | null = null;
  if (search && (search.includes("@") || search.startsWith("+") || /^\d{7,}/.test(search))) {
    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const matched = (authUsers?.users || []).filter(u =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    ).map(u => u.id);
    filterIds = matched;
    if (matched.length === 0) return NextResponse.json({ users: [], total: 0 });
  }

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterIds !== null) {
    query = query.in("id", filterIds);
  } else if (search) {
    query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data: users, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Attach emails from auth if possible
  let emailMap: Record<string, string> = {};
  if (users && users.length > 0) {
    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authUsers?.users || []) {
      if (u.email) emailMap[u.id] = u.email;
    }
  }

  const enriched = (users || []).map(u => ({ ...u, email: emailMap[u.id] || null }));
  return NextResponse.json({ users: enriched, total: count || 0 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { admin } = ctx;

  const { user_id, action } = await req.json();
  if (!user_id || !action) return NextResponse.json({ error: "user_id and action required." }, { status: 400 });

  const allowed = ["grant_group_create", "revoke_group_create", "grant_blue_badge", "revoke_blue_badge", "grant_verified", "revoke_verified", "grant_admin", "revoke_admin"];
  if (!allowed.includes(action)) return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  const updates: Record<string, boolean> = {};
  if (action === "grant_group_create") updates.can_create_groups = true;
  if (action === "revoke_group_create") updates.can_create_groups = false;
  if (action === "grant_blue_badge") updates.admin_verified = true;
  if (action === "revoke_blue_badge") updates.admin_verified = false;
  if (action === "grant_verified") updates.is_verified = true;
  if (action === "revoke_verified") updates.is_verified = false;
  if (action === "grant_admin") updates.is_admin = true;
  if (action === "revoke_admin") updates.is_admin = false;

  const { error } = await admin.from("profiles").update(updates).eq("id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
