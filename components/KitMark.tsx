"use client";

import type { KitStyle } from "@/lib/types";

export function KitMark({
  primary,
  secondary,
  style = "solid",
  size = 40,
}: {
  primary: string;
  secondary: string;
  style?: KitStyle;
  size?: number;
}) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 60 70" className="shrink-0" aria-hidden>
      <path d="M12 18 L4 10 L16 8 L22 14 H38 L44 8 L56 10 L48 18 V62 H12 Z" fill={primary} stroke={secondary} strokeWidth="2" />
      {style === "stripes" && (
        <g fill={secondary} opacity="0.7">
          <rect x="20" y="16" width="6" height="44" />
          <rect x="34" y="16" width="6" height="44" />
        </g>
      )}
      {style === "hoops" && (
        <g fill={secondary} opacity="0.7">
          <rect x="12" y="28" width="36" height="6" />
          <rect x="12" y="44" width="36" height="6" />
        </g>
      )}
      {style === "sash" && <polygon points="12,18 48,62 40,62 12,30" fill={secondary} opacity="0.75" />}
    </svg>
  );
}
