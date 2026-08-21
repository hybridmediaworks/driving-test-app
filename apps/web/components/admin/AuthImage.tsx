"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

/**
 * Renders an image from an authenticated API endpoint. This app's auth is a Bearer token in
 * localStorage (not a cookie), so a plain `<img src>` to a protected route can't attach it — we
 * fetch the bytes with the header, turn them into an object URL, and revoke it on cleanup.
 */
export default function AuthImage({
  path,
  alt,
  className,
  onClick,
}: {
  path: string;
  alt: string;
  className?: string;
  onClick?: (src: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load image");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (failed) {
    return <div className={`flex items-center justify-center text-xs text-muted-foreground ${className ?? ""}`}>Failed to load</div>;
  }
  if (!src) {
    return <div className={`animate-pulse bg-muted ${className ?? ""}`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onClick={onClick ? () => onClick(src) : undefined} />;
}
