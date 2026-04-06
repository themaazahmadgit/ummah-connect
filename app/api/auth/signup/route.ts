import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password, phone, location, bio, expertise, github, orcid } = body;

    if (!name || !username || !email || !password || !phone) {
      return NextResponse.json({ error: "Name, username, email, phone and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check username not taken
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase().replace(/\s+/g, "_"))
      .single();
    if (existing) {
      return NextResponse.json({ error: "Username already taken." }, { status: 400 });
    }

    // Use anon client signUp so Supabase sends its own confirmation email automatically
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data: authData, error: authError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Signup failed." }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create profile immediately (user exists, email confirmation pending)
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
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, requiresEmailVerification: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
