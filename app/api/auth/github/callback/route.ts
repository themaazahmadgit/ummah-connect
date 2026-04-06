import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=github_denied`);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/settings?error=github_token`);
  }

  // Fetch the GitHub user
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "IMS-App" },
  });
  const ghUser = await userRes.json();
  if (!ghUser.login) {
    return NextResponse.redirect(`${appUrl}/settings?error=github_user`);
  }

  // Get the logged-in IMS user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/auth?error=not_logged_in`);
  }

  // Save github_username and mark verified
  const admin = createAdminClient();
  await admin.from("profiles").update({
    github_username: ghUser.login,
    github_verified: true,
  }).eq("id", user.id);

  return NextResponse.redirect(`${appUrl}/settings?connected=github`);
}
