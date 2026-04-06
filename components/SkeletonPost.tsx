export default function SkeletonPost() {
  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <span className="skeleton" style={{ width: 34, height: 34, borderRadius: "22%", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <span className="skeleton" style={{ width: 100, height: 13 }} />
            <span className="skeleton" style={{ width: 50, height: 13 }} />
          </div>
          <span className="skeleton" style={{ width: "100%", height: 14, marginBottom: 6, display: "block" }} />
          <span className="skeleton" style={{ width: "85%", height: 14, marginBottom: 6, display: "block" }} />
          <span className="skeleton" style={{ width: "60%", height: 14, marginBottom: 14, display: "block" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <span className="skeleton" style={{ width: 44, height: 24, borderRadius: 6 }} />
            <span className="skeleton" style={{ width: 44, height: 24, borderRadius: 6 }} />
            <span className="skeleton" style={{ width: 44, height: 24, borderRadius: 6, marginLeft: "auto" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
