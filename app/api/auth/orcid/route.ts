import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Redirects the user to ORCID OAuth authorization page
export async function GET() {
  const clientId = process.env.ORCID_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "ORCID OAuth not configured." }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "/authenticate",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/orcid/callback`,
  });

  // Use sandbox for development, production for prod
  const orcidBase = process.env.ORCID_SANDBOX === "true"
    ? "https://sandbox.orcid.org"
    : "https://orcid.org";

  return NextResponse.redirect(`${orcidBase}/oauth/authorize?${params}`);
}
