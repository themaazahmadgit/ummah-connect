"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, {
  Marker, Source, Layer, NavigationControl,
  type MapRef, type MapMouseEvent,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type PlotMode = "none" | "point" | "route" | "zone";

interface ZoneAuthor { id: string; name: string; username: string; avatar_url?: string; }
interface Zone {
  id: string; title: string; brief: string; category: string;
  post_type: "zone" | "plot"; plot_mode: PlotMode;
  lat: number; lng: number; geometry: GeoJSON.Geometry | null;
  region: string | null; country: string | null;
  tags: string[]; severity: string; created_at: string; author: ZoneAuthor;
  upvotes: number; downvotes: number; myVote?: number | null;
}
interface GeoResult { name: string; fullName: string; latitude: number; longitude: number; }

const SEV_COLOR: Record<string, string> = {
  low: "#059669", medium: "#d97706", high: "#dc2626", critical: "#7c3aed",
};
const SEV_BG: Record<string, string> = {
  low: "#f0fdf4", medium: "#fffbeb", high: "#fef2f2", critical: "#f5f3ff",
};
const CATEGORIES = [
  "general","conflict","politics","economy","humanitarian",
  "environment","health","education","infrastructure","community",
];

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

function centroid(coords: [number,number][]): [number,number] {
  const lng = coords.reduce((s,c) => s+c[0], 0) / coords.length;
  const lat = coords.reduce((s,c) => s+c[1], 0) / coords.length;
  return [lng, lat];
}

// Build GeoJSON sources for routes and zone polygons
function buildGeometryGeoJSON(zones: Zone[], severity: string) {
  const routes: GeoJSON.Feature[] = [];
  const polygons: GeoJSON.Feature[] = [];

  for (const z of zones) {
    if (!z.geometry) continue;
    const color = SEV_COLOR[z.severity] || "#d97706";
    if (z.geometry.type === "LineString") {
      routes.push({ type:"Feature", properties:{ color, id:z.id }, geometry: z.geometry });
    }
    if (z.geometry.type === "Polygon") {
      polygons.push({ type:"Feature", properties:{ color, id:z.id, fill: color+"33" }, geometry: z.geometry });
    }
  }
  void severity;
  return {
    routes:   { type:"FeatureCollection" as const, features: routes },
    polygons: { type:"FeatureCollection" as const, features: polygons },
  };
}

// Preview geometry while drawing
function buildPreview(
  vertices: [number,number][],
  mode: PlotMode,
  mouse: [number,number] | null
): GeoJSON.FeatureCollection {
  if (vertices.length === 0) return { type:"FeatureCollection", features:[] };
  const pts = mouse ? [...vertices, mouse] : vertices;
  if (mode === "route") {
    return { type:"FeatureCollection", features: pts.length < 2 ? [] : [{
      type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: pts }
    }]};
  }
  if (mode === "zone") {
    if (pts.length < 3) return { type:"FeatureCollection", features:[] };
    return { type:"FeatureCollection", features:[{
      type:"Feature", properties:{}, geometry:{ type:"Polygon", coordinates:[[...pts, pts[0]]] }
    }]};
  }
  return { type:"FeatureCollection", features:[] };
}

function MobileGate() {
  return (
    <div style={{ minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column" }}>
      <Navbar />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ maxWidth:320 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"#e6f7f8", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d7377" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:10 }}>Desktop only</h2>
          <p style={{ fontSize:14, color:"#6b7280", lineHeight:1.7, marginBottom:24 }}>
            The World Intelligence Map needs a larger screen. Open it on your laptop or desktop.
          </p>
          <Link href="/feed" className="btn btn-primary" style={{ display:"inline-flex", justifyContent:"center" }}>Back to Feed</Link>
        </div>
      </div>
    </div>
  );
}

export default function WorldPage() {
  const [isMobile, setIsMobile]     = useState(false);
  const [zones, setZones]           = useState<Zone[]>([]);
  const [selected, setSelected]     = useState<Zone | null>(null);
  const [plotMode, setPlotMode]     = useState<PlotMode>("none");
  const [vertices, setVertices]     = useState<[number,number][]>([]);
  const [mousePos, setMousePos]     = useState<[number,number] | null>(null);
  const [pendingGeo, setPendingGeo] = useState<GeoJSON.Geometry | null>(null);
  const [pendingLatLng, setPendingLatLng] = useState<{lat:number;lng:number} | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [postType, setPostType]     = useState<"zone"|"plot">("zone");
  const [form, setForm]             = useState({ title:"", brief:"", category:"general", severity:"medium", tags:"", region:"", country:"" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState("");
  const [searchQ, setSearchQ]       = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [filterSev, setFilterSev]   = useState("all");
  const [filterType, setFilterType] = useState<"all"|"zone"|"plot">("all");

  const { profile } = useAuth();
  const mapRef        = useRef<MapRef>(null);
  const dblClickGuard = useRef(false);

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Delete this post? Cannot be undone.")) return;
    const res = await fetch(`/api/zones/${id}`, { method: "DELETE" });
    if (res.ok) {
      setZones(prev => prev.filter(z => z.id !== id));
      setSelected(null);
      fire("Post deleted.");
    } else {
      const d = await res.json();
      fire(d.error || "Delete failed.");
    }
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 900);
    fetch("/api/zones").then(r=>r.json()).then(d=>setZones(d.zones||[])).catch(()=>{});
  }, []);

  // ESC cancels drawing
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPlotMode("none"); setVertices([]); setMousePos(null); setPendingGeo(null); setPendingLatLng(null); setShowForm(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const flyTo = useCallback((lat: number, lng: number, zoom = 5) => {
    mapRef.current?.flyTo({ center:[lng, lat], zoom, duration:1200, essential:true });
  }, []);

  // Fit map to geometry bounds (routes/polygons)
  const fitGeometry = useCallback((geo: GeoJSON.Geometry) => {
    const coords: [number,number][] =
      geo.type === "LineString" ? (geo.coordinates as [number,number][]) :
      geo.type === "Polygon"    ? (geo.coordinates[0] as [number,number][]) : [];
    if (coords.length === 0) return;
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const pad = 0.5;
    mapRef.current?.fitBounds(
      [[Math.min(...lngs)-pad, Math.min(...lats)-pad],[Math.max(...lngs)+pad, Math.max(...lats)+pad]],
      { duration:1000, padding:60 }
    );
  }, []);

  const activateMode = (mode: PlotMode) => {
    if (plotMode === mode) { setPlotMode("none"); setVertices([]); return; }
    setPlotMode(mode);
    setVertices([]);
    setMousePos(null);
    setPendingGeo(null);
    setShowForm(false);
    setSelected(null);
  };

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (dblClickGuard.current) return;
    const { lng, lat } = e.lngLat;
    const mode = plotMode;

    if (mode === "point") {
      const geo: GeoJSON.Geometry = { type:"Point", coordinates:[lng, lat] };
      setPendingGeo(geo);
      setPendingLatLng({ lat, lng });
      setPlotMode("none");
      setShowForm(true);
      setSelected(null);
      // Reverse geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(r=>r.json()).then(d => setForm(f=>({...f, country:d.address?.country||"", region:d.address?.state||d.address?.county||""})))
        .catch(()=>{});
      return;
    }

    if (mode === "route" || mode === "zone") {
      setVertices(prev => [...prev, [lng, lat]]);
      return;
    }

    // No drawing mode — select existing zone
    setShowForm(false);
  }, [plotMode]);

  const handleDblClick = useCallback((e: MapMouseEvent) => {
    const mode = plotMode;
    if (mode !== "route" && mode !== "zone") return;
    e.preventDefault();
    dblClickGuard.current = true;
    setTimeout(() => { dblClickGuard.current = false; }, 300);

    const { lng, lat } = e.lngLat;
    const allVerts = [...vertices, [lng, lat]] as [number,number][];

    let geo: GeoJSON.Geometry | null = null;
    if (mode === "route" && allVerts.length >= 2) {
      geo = { type:"LineString", coordinates: allVerts };
    }
    if (mode === "zone" && allVerts.length >= 3) {
      geo = { type:"Polygon", coordinates:[[...allVerts, allVerts[0]]] };
    }

    if (!geo) { fire("Add more points first."); return; }

    const [cLng, cLat] = centroid(allVerts);
    setPendingGeo(geo);
    setPendingLatLng({ lat: cLat, lng: cLng });
    setPlotMode("none");
    setVertices([]);
    setMousePos(null);
    setShowForm(true);
    setSelected(null);
    // Reverse geocode centroid
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${cLat}&lon=${cLng}&format=json`)
      .then(r=>r.json()).then(d => setForm(f=>({...f, country:d.address?.country||"", region:d.address?.state||""})))
      .catch(()=>{});
  }, [plotMode, vertices]);

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    if (plotMode === "route" || plotMode === "zone") {
      setMousePos([e.lngLat.lng, e.lngLat.lat]);
    }
  }, [plotMode]);

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQ)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    if (postType === "zone" && !form.brief.trim()) { fire("Brief is required for zone posts."); return; }
    setSubmitting(true);
    try {
      const lat = pendingLatLng?.lat || 0;
      const lng = pendingLatLng?.lng || 0;
      const res = await fetch("/api/zones", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          ...form, lat, lng, post_type: postType,
          geometry: pendingGeo,
          plot_mode: pendingGeo?.type === "LineString" ? "route" : pendingGeo?.type === "Polygon" ? "zone" : "point",
          tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setZones(prev => [data.zone, ...prev]);
        setPendingGeo(null); setPendingLatLng(null); setShowForm(false);
        setForm({ title:"", brief:"", category:"general", severity:"medium", tags:"", region:"", country:"" });
        fire("Posted to the world map.");
      } else fire(data.error || "Failed.");
    } catch { fire("Failed."); }
    setSubmitting(false);
  };

  const handleVote = async (zoneId: string, vote: number) => {
    const res = await fetch(`/api/zones/${zoneId}/vote`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({vote}) });
    const data = await res.json();
    if (res.ok) {
      setZones(prev => prev.map(z => z.id===zoneId ? {...z, upvotes:data.upvotes, downvotes:data.downvotes, myVote:data.myVote} : z));
      if (selected?.id===zoneId) setSelected(s => s ? {...s, ...data} : s);
    }
  };

  const downloadPNG = () => {
    const canvas = document.querySelector(".mapboxgl-canvas") as HTMLCanvasElement|null;
    if (!canvas) return;
    const a = document.createElement("a"); a.download = `ims-world-${Date.now()}.png`; a.href = canvas.toDataURL("image/png"); a.click();
  };

  if (isMobile) return <MobileGate />;

  const filtered = zones.filter(z => {
    if (filterSev !== "all" && z.severity !== filterSev) return false;
    if (filterType !== "all" && z.post_type !== filterType) return false;
    return true;
  });

  const { routes, polygons } = buildGeometryGeoJSON(filtered, filterSev);
  const previewGeoJSON = buildPreview(vertices, plotMode, mousePos);

  const cursorStyle = plotMode !== "none" ? "crosshair" : "default";

  const MODES: { mode: PlotMode; label: string; icon: string; tip: string }[] = [
    { mode:"point", label:"Point", icon:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", tip:"Click to drop a pin" },
    { mode:"route", label:"Route", icon:"M3 12h18M3 12l4-4m-4 4 4 4M21 12l-4-4m4 4-4 4",            tip:"Click to add points, double-click to finish" },
    { mode:"zone",  label:"Zone",  icon:"M12 2l9 7-3.5 11h-11L3 9z",                                 tip:"Click to draw polygon, double-click to close" },
  ];

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#fff", overflow:"hidden" }}>
      <Navbar />

      {/* Header */}
      <div style={{ borderBottom:"1px solid #f3f4f6", padding:"12px 24px", flexShrink:0, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ fontSize:16, fontWeight:800, color:"#111827", letterSpacing:"-0.03em", margin:0 }}>World Intelligence Map</h1>
          <p style={{ fontSize:12, color:"#9ca3af", margin:"2px 0 0" }}>
            {zones.filter(z=>z.post_type==="zone").length} zones · {zones.filter(z=>z.post_type==="plot").length} plots
          </p>
        </div>

        {/* Drawing toolbar */}
        <div style={{ display:"flex", gap:4, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:4 }}>
          {MODES.map(m => (
            <button key={m.mode} onClick={()=>activateMode(m.mode)} title={m.tip}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:"none", background:plotMode===m.mode?"#0d7377":"transparent", color:plotMode===m.mode?"#fff":"#6b7280", fontSize:12.5, fontWeight:plotMode===m.mode?700:400, cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={m.icon}/></svg>
              {m.label}
            </button>
          ))}
          {plotMode !== "none" && (
            <button onClick={()=>{setPlotMode("none");setVertices([]);setMousePos(null);}}
              style={{ padding:"6px 10px", borderRadius:7, border:"none", background:"#fef2f2", color:"#dc2626", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              ✕ Cancel
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:4, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:4 }}>
          {(["all","zone","plot"] as const).map(t => (
            <button key={t} onClick={()=>setFilterType(t)}
              style={{ padding:"5px 10px", borderRadius:7, border:"none", background:filterType===t?"#fff":"transparent", color:filterType===t?"#111827":"#9ca3af", fontSize:12, fontWeight:filterType===t?600:400, cursor:"pointer", boxShadow:filterType===t?"0 1px 4px rgba(0,0,0,0.08)":"none", fontFamily:"inherit" }}>
              {t==="all"?"All":t==="zone"?"Zones":"Plots"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:4, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:4 }}>
          {["all","low","medium","high","critical"].map(s => (
            <button key={s} onClick={()=>setFilterSev(s)}
              style={{ padding:"5px 10px", borderRadius:7, border:"none", background:filterSev===s?(s==="all"?"#fff":SEV_BG[s]):"transparent", color:filterSev===s?(s==="all"?"#111827":SEV_COLOR[s]):"#9ca3af", fontSize:12, fontWeight:filterSev===s?600:400, cursor:"pointer", boxShadow:filterSev===s?"0 1px 4px rgba(0,0,0,0.08)":"none", fontFamily:"inherit", textTransform:"capitalize" }}>
              {s==="all"?"All":s}
            </button>
          ))}
        </div>

        <button onClick={downloadPNG} className="btn btn-secondary btn-sm" style={{ display:"flex", alignItems:"center", gap:5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PNG
        </button>
      </div>

      {/* Drawing status bar */}
      {plotMode !== "none" && (
        <div style={{ background:"#0d7377", padding:"7px 24px", fontSize:12.5, color:"#fff", flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff", opacity:0.8, animation:"pulse 1.2s ease-in-out infinite" }} />
          <strong>{plotMode === "point" ? "Point mode" : plotMode === "route" ? "Route mode" : "Zone mode"}</strong>
          {plotMode === "point" && "— click anywhere on the map to drop a pin"}
          {plotMode === "route" && `— click to add points (${vertices.length} added), double-click to finish`}
          {plotMode === "zone" && `— click to draw polygon (${vertices.length} points), double-click to close`}
          <span style={{ marginLeft:"auto", opacity:0.7 }}>ESC to cancel</span>
        </div>
      )}

      {/* Map + sidebar */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, position:"relative" }}>

          {/* Search overlay */}
          <div style={{ position:"absolute", top:14, left:14, zIndex:10, width:290 }}>
            <div style={{ display:"flex", gap:6 }}>
              <div style={{ flex:1, position:"relative" }}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}
                  placeholder="Search a location..."
                  style={{ paddingLeft:34, background:"rgba(255,255,255,0.96)", backdropFilter:"blur(12px)", boxShadow:"0 2px 16px rgba(0,0,0,0.1)", border:"1px solid #e5e7eb", fontSize:13 }} />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <button onClick={handleSearch} disabled={searching} className="btn btn-primary btn-sm">{searching?"…":"Go"}</button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop:4, background:"rgba(255,255,255,0.97)", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
                {searchResults.map((r,i) => (
                  <button key={i} onClick={()=>{ flyTo(r.latitude,r.longitude,6); setSearchResults([]); setSearchQ(r.name); }}
                    style={{ width:"100%", padding:"9px 14px", background:"none", border:"none", borderBottom:i<searchResults.length-1?"1px solid #f3f4f6":"none", cursor:"pointer", textAlign:"left" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f5fbfb"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="none"}>
                    <p style={{ margin:0, fontSize:13, fontWeight:500, color:"#111827" }}>{r.name}</p>
                    <p style={{ margin:0, fontSize:11, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.fullName}</p>
                  </button>
                ))}
                <button onClick={()=>setSearchResults([])} style={{ width:"100%", padding:"6px", background:"#f9fafb", border:"none", color:"#9ca3af", fontSize:11.5, cursor:"pointer" }}>Close</button>
              </div>
            )}
          </div>

          {/* Vertex count badge */}
          {vertices.length > 0 && (
            <div style={{ position:"absolute", bottom:50, left:"50%", transform:"translateX(-50%)", zIndex:10, background:"#0d7377", borderRadius:20, padding:"5px 14px", fontSize:12, color:"#fff", pointerEvents:"none" }}>
              {vertices.length} point{vertices.length!==1?"s":""} · double-click to finish
            </div>
          )}

          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude:35, latitude:20, zoom:1.9 }}
            style={{ width:"100%", height:"100%" }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            projection={{ name:"globe" }}
            fog={{ color:"#fff", "high-color":"#d4eaf5", "horizon-blend":0.04, "space-color":"#eef2f7", "star-intensity":0 }}
            onClick={handleMapClick}
            onDblClick={handleDblClick}
            onMouseMove={handleMouseMove}
            cursor={cursorStyle}
            preserveDrawingBuffer
            doubleClickZoom={false}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            {/* Highlight selected geometry */}
            {selected?.geometry && selected.geometry.type === "LineString" && (
              <Source id="highlight" type="geojson" data={{ type:"FeatureCollection", features:[{ type:"Feature", properties:{}, geometry:selected.geometry }] }}>
                <Layer id="highlight-line-glow" type="line" paint={{ "line-color":"#0d7377", "line-width":10, "line-opacity":0.18 }} />
                <Layer id="highlight-line" type="line" paint={{ "line-color":"#0d7377", "line-width":3.5, "line-opacity":1 }} />
              </Source>
            )}
            {selected?.geometry && selected.geometry.type === "Polygon" && (
              <Source id="highlight" type="geojson" data={{ type:"FeatureCollection", features:[{ type:"Feature", properties:{}, geometry:selected.geometry }] }}>
                <Layer id="highlight-fill" type="fill" paint={{ "fill-color":"#0d7377", "fill-opacity":0.18 }} />
                <Layer id="highlight-outline" type="line" paint={{ "line-color":"#0d7377", "line-width":3.5, "line-opacity":1 }} />
              </Source>
            )}

            {/* Existing routes */}
            <Source id="routes" type="geojson" data={routes}>
              <Layer id="route-lines" type="line" paint={{ "line-color":["get","color"], "line-width":2.5, "line-opacity":0.85 }} />
            </Source>

            {/* Existing polygons */}
            <Source id="polygons" type="geojson" data={polygons}>
              <Layer id="polygon-fill"    type="fill"   paint={{ "fill-color":["get","fill"],  "fill-opacity":0.2 }} />
              <Layer id="polygon-outline" type="line"   paint={{ "line-color":["get","color"], "line-width":2, "line-opacity":0.9 }} />
            </Source>

            {/* Drawing preview */}
            <Source id="preview" type="geojson" data={previewGeoJSON}>
              <Layer id="preview-line" type="line" paint={{ "line-color":"#0d7377", "line-width":2, "line-opacity":0.8, "line-dasharray":[4,3] }} />
              <Layer id="preview-fill" type="fill" paint={{ "fill-color":"#0d7377", "fill-opacity":0.12 }} />
            </Source>

            {/* Vertex dots while drawing */}
            {vertices.map((v, i) => (
              <Marker key={i} longitude={v[0]} latitude={v[1]}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#0d7377", border:"2px solid #fff", boxShadow:"0 1px 6px rgba(13,115,119,0.5)" }} />
              </Marker>
            ))}

            {/* Pending point marker */}
            {pendingLatLng && pendingGeo?.type === "Point" && (
              <Marker longitude={pendingLatLng.lng} latitude={pendingLatLng.lat}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:"#0d7377", border:"3px solid #fff", boxShadow:"0 2px 12px #0d737780, 0 0 0 6px #0d737722", animation:"pulse 1.5s ease-in-out infinite" }} />
              </Marker>
            )}

            {/* Existing point markers */}
            {filtered.filter(z => !z.geometry || z.geometry.type==="Point").map(z => {
              const isSelected = selected?.id === z.id;
              const sz = z.severity==="critical"?18:z.severity==="high"?14:11;
              return (
                <Marker key={z.id} longitude={z.lng} latitude={z.lat}
                  onClick={e=>{ e.originalEvent.stopPropagation(); setSelected(z); setShowForm(false); flyTo(z.lat,z.lng,5); }}>
                  <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isSelected && (
                      <div style={{ position:"absolute", width:sz+14, height:sz+14, borderRadius:z.post_type==="plot"?"4px":"50%", border:`2.5px solid ${SEV_COLOR[z.severity]}`, animation:"hlPulse 1.4s ease-in-out infinite", pointerEvents:"none", transform:z.post_type==="plot"?"rotate(45deg)":"none" }} />
                    )}
                    <div title={z.title}
                      style={{ width:sz, height:sz, borderRadius:z.post_type==="plot"?"2px":"50%", background:SEV_COLOR[z.severity], border:`${isSelected?"3px":"2.5px"} solid #fff`, boxShadow:`0 2px 8px ${SEV_COLOR[z.severity]}77${isSelected?", 0 0 0 4px "+SEV_COLOR[z.severity]+"33":""}`, cursor:"pointer", transition:"transform 0.15s", transform:z.post_type==="plot"?"rotate(45deg)":"none" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform=z.post_type==="plot"?"rotate(45deg) scale(1.4)":"scale(1.4)"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform=z.post_type==="plot"?"rotate(45deg)":"none"}
                    />
                  </div>
                </Marker>
              );
            })}

            {/* Route/polygon label markers (click to select) */}
            {filtered.filter(z => z.geometry && z.geometry.type!=="Point").map(z => (
              <Marker key={`lbl-${z.id}`} longitude={z.lng} latitude={z.lat}
                onClick={e=>{ e.originalEvent.stopPropagation(); setSelected(z); setShowForm(false); if(z.geometry&&z.geometry.type!=="Point")fitGeometry(z.geometry); else flyTo(z.lat,z.lng,6); }}>
                <div style={{ background:"#fff", border:`2px solid ${SEV_COLOR[z.severity]}`, borderRadius:8, padding:"2px 8px", fontSize:10.5, fontWeight:600, color:SEV_COLOR[z.severity], cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.1)", whiteSpace:"nowrap", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>
                  {z.title}
                </div>
              </Marker>
            ))}
          </Map>
        </div>

        {/* Sidebar */}
        <div style={{ width:360, borderLeft:"1px solid #f3f4f6", display:"flex", flexDirection:"column", overflow:"hidden", background:"#fff" }}>

          {/* Post form */}
          {showForm && pendingLatLng && (
            <div style={{ borderBottom:"1px solid #f3f4f6", overflow:"hidden", flexShrink:0 }}>
              <div style={{ padding:"14px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:700, color:"#111827", margin:0 }}>New Post</p>
                  <p style={{ fontSize:11, color:"#9ca3af", margin:"2px 0 0" }}>
                    {pendingGeo?.type==="LineString"?"Route":pendingGeo?.type==="Polygon"?"Zone polygon":"Point"} · {pendingLatLng.lat.toFixed(3)}°, {pendingLatLng.lng.toFixed(3)}°
                    {form.country && ` · ${form.country}`}
                  </p>
                </div>
                <button onClick={()=>{setShowForm(false);setPendingGeo(null);setPendingLatLng(null);}} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:20, lineHeight:1, padding:0 }}>×</button>
              </div>

              {/* Zone vs Plot */}
              <div style={{ display:"flex", margin:"10px 20px 0", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:3 }}>
                {(["zone","plot"] as const).map(t => (
                  <button key={t} onClick={()=>setPostType(t)}
                    style={{ flex:1, padding:"6px", border:"none", borderRadius:8, background:postType===t?"#fff":"transparent", color:postType===t?"#111827":"#9ca3af", fontSize:12.5, fontWeight:postType===t?600:400, cursor:"pointer", boxShadow:postType===t?"0 1px 4px rgba(0,0,0,0.08)":"none", fontFamily:"inherit" }}>
                    {t==="zone"?"Zone Post":"Quick Plot"}
                  </button>
                ))}
              </div>

              <div style={{ padding:"10px 20px 16px", display:"flex", flexDirection:"column", gap:9, overflowY:"auto", maxHeight:"55vh" }}>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  placeholder={postType==="zone"?"Title — what's happening here?":"Quick label"} style={{fontSize:13.5}} />
                {postType==="zone" && (
                  <textarea value={form.brief} onChange={e=>setForm(f=>({...f,brief:e.target.value}))}
                    placeholder="Brief — context, key facts, significance..." rows={3} style={{resize:"vertical",fontSize:13}} />
                )}
                <div style={{display:"flex",gap:8}}>
                  {postType==="zone" && (
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{flex:1,fontSize:12}}>
                      {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <select value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))} style={{flex:1,fontSize:12}}>
                    {["low","medium","high","critical"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {postType==="zone" && (
                  <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="Tags — OIC, ceasefire, aid" style={{fontSize:12}} />
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setShowForm(false);setPendingGeo(null);setPendingLatLng(null);}} className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:"center"}}>Cancel</button>
                  <button onClick={handleSubmit} disabled={submitting||!form.title.trim()||(postType==="zone"&&!form.brief.trim())} className="btn btn-primary btn-sm" style={{flex:2,justifyContent:"center"}}>
                    {submitting?"Posting...":"Post"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detail panel */}
          {selected && !showForm && (
            <div style={{ borderBottom:"1px solid #f3f4f6", padding:18, flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:SEV_COLOR[selected.severity], background:SEV_BG[selected.severity], padding:"2px 9px", borderRadius:20, border:`1px solid ${SEV_COLOR[selected.severity]}44`, textTransform:"capitalize" }}>{selected.severity}</span>
                  <span style={{ fontSize:10.5, color:"#9ca3af", background:"#f3f4f6", padding:"2px 8px", borderRadius:20 }}>
                    {selected.geometry?.type === "LineString" ? "route" : selected.geometry?.type === "Polygon" ? "polygon" : selected.post_type}
                  </span>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {(profile?.id === selected.author?.id || (profile as unknown as {is_admin?:boolean})?.is_admin) && (
                    <button onClick={()=>handleDeleteZone(selected.id)} style={{ background:"none", border:"none", color:"#dc2626", cursor:"pointer", fontSize:12, padding:"2px 6px", borderRadius:5, opacity:0.7 }} title="Delete post">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  )}
                  <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:20, lineHeight:1, padding:0 }}>×</button>
                </div>
              </div>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:"0 0 6px", lineHeight:1.4 }}>{selected.title}</h3>
              {(selected.region||selected.country) && (
                <p style={{ fontSize:12.5, color:"#6b7280", margin:"0 0 8px" }}>📍 {[selected.region,selected.country].filter(Boolean).join(", ")}</p>
              )}
              {selected.brief && <p style={{ fontSize:13.5, color:"#374151", lineHeight:1.75, margin:"0 0 10px" }}>{selected.brief}</p>}
              {selected.tags?.length>0 && (
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                  {selected.tags.map(t=><span key={t} className="tag">#{t}</span>)}
                </div>
              )}
              {/* Votes */}
              <div style={{ display:"flex", gap:8, alignItems:"center", padding:"10px 0", borderTop:"1px solid #f3f4f6", borderBottom:"1px solid #f3f4f6", marginBottom:10 }}>
                <span style={{ fontSize:12, color:"#9ca3af" }}>Community opinion:</span>
                <button onClick={()=>handleVote(selected.id,1)}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 12px", border:`1px solid ${selected.myVote===1?"#059669":"#e5e7eb"}`, borderRadius:20, background:selected.myVote===1?"#f0fdf4":"#fff", color:selected.myVote===1?"#059669":"#6b7280", fontSize:12.5, cursor:"pointer", fontFamily:"inherit" }}>
                  ▲ {selected.upvotes}
                </button>
                <button onClick={()=>handleVote(selected.id,-1)}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 12px", border:`1px solid ${selected.myVote===-1?"#dc2626":"#e5e7eb"}`, borderRadius:20, background:selected.myVote===-1?"#fef2f2":"#fff", color:selected.myVote===-1?"#dc2626":"#6b7280", fontSize:12.5, cursor:"pointer", fontFamily:"inherit" }}>
                  ▼ {selected.downvotes}
                </button>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Link href={`/profile/${selected.author?.username}`} style={{ textDecoration:"none", flexShrink:0 }}>
                  <Avatar name={selected.author?.name||"U"} url={selected.author?.avatar_url} size={26} />
                </Link>
                <div>
                  <Link href={`/profile/${selected.author?.username}`} style={{ fontSize:12.5, fontWeight:600, color:"#111827", textDecoration:"none" }}>{selected.author?.name}</Link>
                  <p style={{ fontSize:11.5, color:"#9ca3af", margin:0 }}>{timeAgo(selected.created_at)} ago · {selected.category}</p>
                </div>
              </div>
            </div>
          )}

          {/* Zone list */}
          <div style={{ flex:1, overflowY:"auto" }}>
            <div style={{ padding:"10px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>{filtered.length} posts</p>
              <div style={{ display:"flex", gap:10, fontSize:11, color:"#9ca3af" }}>
                <span>● circle = zone</span>
                <span>◆ diamond = plot</span>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding:"48px 20px", textAlign:"center" }}>
                <p style={{ color:"#9ca3af", fontSize:13.5 }}>Nothing posted yet.</p>
                <p style={{ color:"#d1d5db", fontSize:12.5, marginTop:4 }}>Use the toolbar above to post a Point, Route, or Zone.</p>
              </div>
            ) : filtered.map(z => (
              <button key={z.id}
                onClick={()=>{ setSelected(z); setShowForm(false); if(z.geometry&&z.geometry.type!=="Point")fitGeometry(z.geometry); else flyTo(z.lat,z.lng,6); }}
                style={{ width:"100%", padding:"11px 20px", background:selected?.id===z.id?"#e6f7f8":"none", border:"none", borderBottom:"1px solid #f9fafb", borderLeft:selected?.id===z.id?`3px solid #0d7377`:"3px solid transparent", cursor:"pointer", textAlign:"left", transition:"background 0.1s" }}
                onMouseEnter={e=>{ if(selected?.id!==z.id)(e.currentTarget as HTMLElement).style.background="#f9fafb"; }}
                onMouseLeave={e=>{ if(selected?.id!==z.id)(e.currentTarget as HTMLElement).style.background="none"; }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ flexShrink:0, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                    {z.geometry?.type==="LineString" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SEV_COLOR[z.severity]} strokeWidth="2.5"><path d="M3 12h18M3 12l4-4m-4 4 4 4"/></svg>
                    ) : z.geometry?.type==="Polygon" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={SEV_COLOR[z.severity]+"44"} stroke={SEV_COLOR[z.severity]} strokeWidth="2"><path d="M12 2l9 7-3.5 11h-11L3 9z"/></svg>
                    ) : z.post_type==="plot" ? (
                      <div style={{ width:9, height:9, background:SEV_COLOR[z.severity], transform:"rotate(45deg)" }} />
                    ) : (
                      <div style={{ width:10, height:10, borderRadius:"50%", background:SEV_COLOR[z.severity], boxShadow:`0 0 5px ${SEV_COLOR[z.severity]}55` }} />
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"#111827", margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{z.title}</p>
                    <p style={{ fontSize:12, color:"#6b7280", margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {z.region||z.country||`${z.lat.toFixed(2)}°, ${z.lng.toFixed(2)}°`}
                    </p>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:11, color:"#059669" }}>▲ {z.upvotes}</span>
                      <span style={{ fontSize:11, color:"#dc2626" }}>▼ {z.downvotes}</span>
                      <span style={{ fontSize:11, color:"#9ca3af", background:"#f3f4f6", borderRadius:4, padding:"1px 5px" }}>{z.category}</span>
                      <span style={{ fontSize:11, color:"#d1d5db" }}>{timeAgo(z.created_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.2)}}
        @keyframes hlPulse{0%,100%{opacity:0.8;transform:scale(1)}50%{opacity:0.3;transform:scale(1.35)}}
      `}</style>
    </div>
  );
}
