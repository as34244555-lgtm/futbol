"use client";

import { faceSeed } from "@/lib/portrait";

export function Portrait({ id, size = 48, kit }: { id: string; size?: number; kit?: string }) {
  const f = faceSeed(id);
  const shirt = kit ?? f.shirt;
  return (
    <svg width={size} height={size} viewBox="0 0 64 80" className="shrink-0 overflow-hidden rounded-lg" aria-hidden>
      <rect width="64" height="80" fill="#0b1220" />
      <rect y="48" width="64" height="32" fill={shirt} />
      <circle cx="32" cy="30" r="16" fill={f.skin} />
      {f.hairStyle === 0 && <ellipse cx="32" cy="18" rx="16" ry="8" fill={f.hair} />}
      {f.hairStyle === 1 && <path d="M16 28 C16 12 48 12 48 28 L48 22 C44 10 20 10 16 22 Z" fill={f.hair} />}
      {f.hairStyle === 2 && <rect x="18" y="12" width="28" height="10" rx="3" fill={f.hair} />}
      <circle cx="26" cy="30" r="1.6" fill="#1a120c" />
      <circle cx="38" cy="30" r="1.6" fill="#1a120c" />
      {f.beard && <ellipse cx="32" cy="40" rx="8" ry="5" fill={f.hair} opacity="0.7" />}
    </svg>
  );
}
