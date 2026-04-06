import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ posts: [], ideas: [], startups: [], people: [] });

  const admin = createAdminClient();
  const like = `%${q}%`;

  // For people: also search by email/phone via auth.users
  const isEmailOrPhone = q.includes("@") || q.startsWith("+") || /^\d{7,}/.test(q);
  let authMatchIds: string[] = [];
  if (isEmailOrPhone) {
    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authMatchIds = (authUsers?.users || [])
      .filter(u => u.email?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q))
      .map(u => u.id);
  }

  const [posts, ideas, startups, people] = await Promise.all([
    admin.from("posts").select("id, content, category, created_at, profiles!posts_user_id_fkey(name, username)").ilike("content", like).limit(6),
    admin.from("ideas").select("id, title, description, category, created_at, profiles!ideas_user_id_fkey(name, username)").or(`title.ilike.${like},description.ilike.${like}`).limit(6),
    admin.from("startups").select("id, name, tagline, category, created_at, profiles!startups_user_id_fkey(name, username)").or(`name.ilike.${like},tagline.ilike.${like}`).limit(6),
    authMatchIds.length > 0
      ? admin.from("profiles").select("id, name, username, bio, role, location, is_verified, admin_verified").in("id", authMatchIds).limit(6)
      : admin.from("profiles").select("id, name, username, bio, role, location, is_verified, admin_verified").or(`name.ilike.${like},username.ilike.${like},role.ilike.${like}`).limit(6),
  ]);

  return NextResponse.json({
    posts: posts.data || [],
    ideas: ideas.data || [],
    startups: startups.data || [],
    people: people.data || [],
  });
}
