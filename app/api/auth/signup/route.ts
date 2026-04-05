import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password, phone, location, bio, expertise, github, orcid } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "Name, username, email and password are required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      name,
      username: username.toLowerCase().replace(/\s+/g, "_"),
      bio: bio || null,
      role: null,
      location: location || null,
      phone: phone || null,
      expertise: expertise || [],
      github_username: github || null,
      orcid_id: orcid || null,
      github_verified: false,
      orcid_verified: false,
    });

    if (profileError) {
      // Rollback: delete the auth user
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Send welcome email
    try {
      await resend.emails.send({
        from: "Ummah Connect <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to Ummah Connect",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h1 style="font-size: 22px; color: #111827; margin-bottom: 8px;">Welcome to Ummah Connect, ${name}!</h1>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Your account has been created. Join the global Muslim community — share ideas, support startups, and build together.
            </p>
            <a href="https://ummah-connect.vercel.app/feed" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Go to your feed
            </a>
            <p style="color: #d1d5db; font-size: 12px; margin-top: 32px;">Ummah Connect · Connecting the Muslim world</p>
          </div>
        `,
      });
    } catch {
      // Don't fail signup if email fails
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
