// Small inline blue checkmark badge shown next to names when admin_verified is true.
// Usage: <VerifiedBadge />  — place right after the name element.

export default function VerifiedBadge() {
  return (
    <span
      title="Verified by IMS"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#1d4ed8",
        flexShrink: 0,
        verticalAlign: "middle",
        marginLeft: 3,
      }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}
