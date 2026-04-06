import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "Phone required." }, { status: 400 });

  // Normalize: ensure starts with +
  const normalized = phone.startsWith("+") ? phone : `+${phone}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ sent: true });
}
