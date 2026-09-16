"use client";

import { crestSeed } from "@/lib/portrait";

export function Crest({ name, primary, secondary, size = 48 }: { name: string; primary: string; secondary: string; size?: number }) {
  const c = crestSeed(name);
  return (
    <svg width={size} height={size} viewBox="0 0 80 90" className="shrink-0" aria-hidden>
      <path d="M40 4 L72 16 V44 C72 68 56 82 40 88 C24 82 8 68 8 44 V16 Z" fill={primary} stroke={secondary} strokeWidth="3" />
      {c.motif === 0 && <polygon points="40,22 50,48 30,48" fill={secondary} />}
      {c.motif === 1 && <circle cx="40" cy="40" r="12" fill={secondary} />}
      {c.motif === 2 && <rect x="28" y="28" width="24" height="24" fill={secondary} transform="rotate(45 40 40)" />}
      {c.motif === 3 && (
        <path d="M40 24 L44 36 L56 36 L46 44 L50 56 L40 48 L30 56 L34 44 L24 36 L36 36 Z" fill={secondary} />
      )}
      <text x="40" y="78" textAnchor="middle" fontSize="16" fontWeight="800" fill={secondary}>
        {c.letter}
      </text>
    </svg>
  );
}
