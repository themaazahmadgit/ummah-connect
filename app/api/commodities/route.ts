import { NextResponse } from "next/server";

const TTL = 5 * 60 * 1000;
let cache: { data: Commodity[]; at: number } | null = null;

interface Commodity {
  symbol: string; name: string; price: number;
  change: number; changePercent: number; unit: string;
}

const FALLBACK: Commodity[] = [
  { symbol: "CL=F",  name: "WTI",    price: 82.45,   change: -0.34, changePercent: -0.41, unit: "/bbl" },
  { symbol: "BZ=F",  name: "Brent",  price: 86.12,   change:  0.28, changePercent:  0.33, unit: "/bbl" },
  { symbol: "GC=F",  name: "Gold",   price: 2334.50, change: 12.30, changePercent:  0.53, unit: "/oz"  },
  { symbol: "ZW=F",  name: "Wheat",  price: 567.25,  change: -3.75, changePercent: -0.66, unit: "/bu"  },
  { symbol: "NG=F",  name: "NatGas", price: 2.87,    change: -0.05, changePercent: -1.71, unit: "/MMBtu" },
];

async function fetchYahoo(symbol: string, name: string, unit: string): Promise<Commodity> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("bad");
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error("no meta");
    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.previousClose || meta.chartPreviousClose || price;
    const change = price - prevClose;
    const changePercent = meta.regularMarketChangePercent ?? (prevClose ? (change / prevClose) * 100 : 0);
    return { symbol, name, price, change, changePercent, unit };
  } catch {
    return FALLBACK.find(f => f.symbol === symbol) || { symbol, name, price: 0, change: 0, changePercent: 0, unit };
  }
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ commodities: cache.data });
  }
  const commodities = await Promise.all([
    fetchYahoo("CL=F", "WTI",    "/bbl"),
    fetchYahoo("BZ=F", "Brent",  "/bbl"),
    fetchYahoo("GC=F", "Gold",   "/oz"),
    fetchYahoo("ZW=F", "Wheat",  "/bu"),
    fetchYahoo("NG=F", "NatGas", "/MMBtu"),
  ]);
  cache = { data: commodities, at: Date.now() };
  return NextResponse.json({ commodities });
}
