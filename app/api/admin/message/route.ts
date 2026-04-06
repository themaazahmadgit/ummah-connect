import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminProfile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const { recipient_username, subject, body, visibility } = await req.json();
  if (!recipient_username || !subject || !body) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  if (!["private", "public"].includes(visibility)) return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });

  const { data: recipient } = await admin.from("profiles").select("id").eq("username", recipient_username).single();
  if (!recipient) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const { data: msg, error } = await admin.from("admin_messages").insert({
    admin_id: user.id,
    recipient_id: recipient.id,
    subject,
    body,
    visibility,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notification for recipient
  await admin.from("notifications").insert({
    user_id: recipient.id,
    type: "admin_message",
    actor_id: user.id,
    message: subject,
  });

  return NextResponse.json({ message: msg });
}

export async function GET(req: NextRequest) {
  // Get messages for a profile (admin sees all, user sees own)
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Username required." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: recipient } = await admin.from("profiles").select("id").eq("username", username).single();
  if (!recipient) return NextResponse.json({ messages: [] });

  let isAdmin = false;
  let isOwner = false;
  if (user) {
    const { data: p } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
    isAdmin = !!p?.is_admin;
    isOwner = user.id === recipient.id;
  }

  let query = admin
    .from("admin_messages")
    .select("id, subject, body, visibility, created_at, admin:profiles!admin_messages_admin_id_fkey(name, username)")
    .eq("recipient_id", recipient.id)
    .order("created_at", { ascending: false });

  // Public sees only public messages; owner/admin sees all
  if (!isAdmin && !isOwner) {
    query = query.eq("visibility", "public");
  }

  const { data } = await query;
  return NextResponse.json({ messages: data || [] });
}
