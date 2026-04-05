import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { phone, token } = await req.json();
  if (!phone || !token) return NextResponse.json({ error: "Phone and OTP required." }, { status: 400 });

  const normalized = phone.startsWith("+") ? phone : `+${phone}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone: normalized, token, type: "sms" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ verified: true });
}
