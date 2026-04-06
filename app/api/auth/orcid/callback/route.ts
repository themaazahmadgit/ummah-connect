import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=orcid_denied`);
  }

  const orcidBase = process.env.ORCID_SANDBOX === "true"
    ? "https://sandbox.orcid.org"
    : "https://orcid.org";

  // Exchange code for access token + ORCID iD
  const tokenRes = await fetch(`${orcidBase}/oauth/token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.ORCID_CLIENT_ID || "",
      client_secret: process.env.ORCID_CLIENT_SECRET || "",
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/auth/orcid/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  // ORCID token response includes the orcid iD directly
  const orcidId: string | undefined = tokenData.orcid;

  if (!orcidId) {
    return NextResponse.redirect(`${appUrl}/settings?error=orcid_token`);
  }

  // Get the logged-in IMS user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/auth?error=not_logged_in`);
  }

  // Save orcid_id and mark verified
  const admin = createAdminClient();
  await admin.from("profiles").update({
    orcid_id: orcidId,
    orcid_verified: true,
  }).eq("id", user.id);

  return NextResponse.redirect(`${appUrl}/settings?connected=orcid`);
}
