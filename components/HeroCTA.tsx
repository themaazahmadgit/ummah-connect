"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

export default function HeroCTA() {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (profile) {
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/feed" className="btn btn-primary btn-lg">Go to feed</Link>
        <Link href={`/profile/${profile.username}`} className="btn btn-secondary btn-lg">My profile</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
      <Link href="/auth" className="btn btn-primary btn-lg">Create account</Link>
      <Link href="/feed" className="btn btn-secondary btn-lg">Browse the feed</Link>
    </div>
  );
}
