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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/avatar.${ext}`;

  const admin = createAdminClient();

  // Try to create bucket — safe to call even if it already exists
  const { error: bucketErr } = await admin.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 3145728,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  // bucketErr is fine if it's "already exists"
  if (bucketErr && !bucketErr.message.includes("already exists") && !bucketErr.message.includes("duplicate")) {
    return NextResponse.json({ error: `Bucket error: ${bucketErr.message}` }, { status: 500 });
  }

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path);
  const cacheBusted = `${publicUrl}?t=${Date.now()}`;

  // Update profile — ignore error so we still return the URL
  await admin.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

  return NextResponse.json({ avatar_url: cacheBusted });
}
