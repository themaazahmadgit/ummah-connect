import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doi = searchParams.get("doi")?.trim().replace(/^https?:\/\/doi\.org\//i, "");
  if (!doi) return NextResponse.json({ error: "DOI required." }, { status: 400 });

  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { "User-Agent": "IMS-Platform/1.0 (mailto:admin@ims.app)" },
  });

  if (!res.ok) return NextResponse.json({ error: "DOI not found." }, { status: 404 });

  const { message: w } = await res.json();

  return NextResponse.json({
    title: w.title?.[0] || "Untitled",
    authors: (w.author || []).map((a: { given?: string; family?: string }) => [a.given, a.family].filter(Boolean).join(" ")),
    journal: w["container-title"]?.[0] || w.publisher || null,
    year: w.published?.["date-parts"]?.[0]?.[0] || w["published-print"]?.["date-parts"]?.[0]?.[0] || null,
    abstract: w.abstract ? w.abstract.replace(/<[^>]+>/g, "").trim() : null,
    url: w.URL || `https://doi.org/${doi}`,
    doi,
  });
}
