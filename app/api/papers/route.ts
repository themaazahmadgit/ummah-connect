import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const username = searchParams.get("username");

  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = admin
    .from("research_papers")
    .select("*, author:profiles!research_papers_user_id_fkey(name, username, is_verified, orcid_verified), upvotes:paper_upvotes(count)")
    .order("created_at", { ascending: false })
    .limit(40);

  if (category && category !== "all") query = query.eq("category", category);
  if (username) {
    const { data: profile } = await admin.from("profiles").select("id").eq("username", username).single();
    if (profile) query = query.eq("user_id", profile.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let upvotedIds: string[] = [];
  if (user) {
    const { data: uv } = await admin.from("paper_upvotes").select("paper_id").eq("user_id", user.id);
    upvotedIds = (uv || []).map((u: { paper_id: string }) => u.paper_id);
  }

  const papers = (data || []).map((p: Record<string, unknown>) => ({
    ...p,
    upvoteCount: Array.isArray(p.upvotes) ? (p.upvotes[0] as { count: number })?.count || 0 : 0,
    upvoted: upvotedIds.includes(p.id as string),
  }));

  return NextResponse.json({ papers });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { doi, category, relevance_note } = await req.json();
  if (!doi) return NextResponse.json({ error: "DOI is required." }, { status: 400 });

  // Check rate limit: max 5 papers per day
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86400000).toISOString();
  const { count } = await admin.from("research_papers").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if ((count || 0) >= 5) return NextResponse.json({ error: "Daily limit reached. Max 5 papers per day." }, { status: 429 });

  // Fetch metadata from CrossRef
  const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
  const crossrefRes = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
    headers: { "User-Agent": "IMS-Platform/1.0 (mailto:admin@ims.app)" },
  });

  if (!crossrefRes.ok) return NextResponse.json({ error: "DOI not found. Make sure it's a valid DOI." }, { status: 404 });

  const crossref = await crossrefRes.json();
  const work = crossref.message;

  const title = work.title?.[0] || "Untitled";
  const authors = (work.author || []).map((a: { given?: string; family?: string }) =>
    [a.given, a.family].filter(Boolean).join(" ")
  );
  const journal = work["container-title"]?.[0] || work.publisher || null;
  const year = work.published?.["date-parts"]?.[0]?.[0] || work["published-print"]?.["date-parts"]?.[0]?.[0] || null;
  const abstract = work.abstract ? work.abstract.replace(/<[^>]+>/g, "").trim() : null;
  const url = work.URL || `https://doi.org/${cleanDoi}`;

  const { data: paper, error } = await admin.from("research_papers").insert({
    user_id: user.id,
    doi: cleanDoi,
    title,
    authors,
    journal,
    year,
    abstract,
    url,
    category: category || "science",
    relevance_note: relevance_note?.trim() || null,
  }).select("*, author:profiles!research_papers_user_id_fkey(name, username, is_verified, orcid_verified)").single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This paper has already been submitted." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ paper: { ...paper, upvoteCount: 0, upvoted: false } });
}
