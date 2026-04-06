import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Must be an image." }, { status: 400 });
  if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Max 3MB." }, { status: 400 });

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const admin = createAdminClient();

  // Ensure bucket exists (ignore error if already exists)
  await admin.storage.createBucket("avatars", { public: true, fileSizeLimit: 3145728 });

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  // If upload failed, return clear error
  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path);

  // Store clean URL in DB, send cache-busted URL to client so browser shows new image immediately
  await admin.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

  return NextResponse.json({ avatar_url: `${publicUrl}?t=${Date.now()}` });
}
