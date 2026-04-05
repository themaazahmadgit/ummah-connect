interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  radius?: number;
  fontSize?: number;
}

export default function Avatar({ name, url, size = 32, radius = 8, fontSize }: AvatarProps) {
  const fs = fontSize ?? Math.round(size * 0.38);

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0, display: "block" }}
      />
    );
  }

  return (
    <div
      className="avatar avatar-emerald"
      style={{ width: size, height: size, fontSize: fs, borderRadius: radius, flexShrink: 0 }}
    >
      {name?.[0] || "?"}
    </div>
  );
}
