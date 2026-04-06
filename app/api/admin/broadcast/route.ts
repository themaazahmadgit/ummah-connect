import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { title, message, type } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    // Get all users' emails via admin client
    const admin = createAdminClient();
    const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    const emails = authUsers.users
      .filter((u: { email?: string }) => u.email)
      .map((u: { email?: string }) => u.email as string);

    // Send broadcast email to all users (batch in groups of 50)
    let sent = 0;
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      try {
        await resend.emails.send({
          from: "IMS <onboarding@resend.dev>",
          to: batch,
          subject: `[${type?.toUpperCase() || "ANNOUNCEMENT"}] ${title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
              <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 10px 16px; margin-bottom: 20px;">
                <span style="font-size: 12px; color: #047857; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">${type || "Announcement"}</span>
              </div>
              <h1 style="font-size: 20px; color: #111827; margin-bottom: 12px;">${title}</h1>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.65; margin-bottom: 24px;">${message}</p>
              <a href="https://ummah-connect.vercel.app/feed" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View in IMS
              </a>
              <p style="color: #d1d5db; font-size: 12px; margin-top: 32px;">IMS Admin Broadcast</p>
            </div>
          `,
        });
        sent += batch.length;
      } catch {
        // Continue sending remaining batches even if one fails
      }
    }

    // Save broadcast record
    await supabase.from("broadcasts").insert({
      admin_id: user.id,
      title,
      message,
      type: type || "announcement",
      recipient_count: sent,
    });

    return NextResponse.json({ success: true, sent });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data: broadcasts } = await supabase
      .from("broadcasts")
      .select("*, admin:profiles!broadcasts_admin_id_fkey(name, username)")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ broadcasts: broadcasts || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
