"use client";

import Image from "next/image";
import { useId } from "react";
import { faceSeed, shade, svgSafeId } from "@/lib/portrait";

export function CardArt({
  id,
  kit,
  portrait,
  name,
}: {
  id: string;
  kit?: string;
  portrait?: string;
  name?: string;
}) {
  const uid = svgSafeId(`${id}-${useId()}`);
  if (portrait) {
    return (
      <span className="absolute inset-0">
        <Image src={portrait} alt={name ?? ""} fill className="object-cover object-top" sizes="280px" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
      </span>
    );
  }
  const f = faceSeed(id);
  const shirt = kit ?? f.shirt;
  const dark = shade(shirt, -40);
  const light = shade(shirt, 28);
  const skinDark = shade(f.skin, -28);
  const cx = 90;
  const fw = 28 * f.faceW;
  return (
    <svg viewBox="0 0 180 240" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#243044" />
          <stop offset="55%" stopColor="#121820" />
          <stop offset="100%" stopColor="#07090d" />
        </linearGradient>
        <radialGradient id={`lit-${uid}`} cx="38%" cy="22%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`kit-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="45%" stopColor={shirt} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`skin-${uid}`} x1="0.3" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={shade(f.skin, 18)} />
          <stop offset="100%" stopColor={skinDark} />
        </linearGradient>
      </defs>
      <rect width="180" height="240" fill={`url(#sky-${uid})`} />
      <ellipse cx="28" cy="36" rx="18" ry="10" fill="#fff" opacity="0.07" />
      <ellipse cx="154" cy="48" rx="22" ry="12" fill="#fff" opacity="0.05" />
      <circle cx="22" cy="70" r="3" fill="#ffe9a8" opacity="0.35" />
      <circle cx="160" cy="64" r="2.4" fill="#ffe9a8" opacity="0.28" />
      <ellipse cx="90" cy="214" rx="72" ry="24" fill="#000" opacity="0.4" />
      <path d="M38 148 C42 118 70 108 90 108 C110 108 138 118 142 148 L150 238 H30 Z" fill={`url(#kit-${uid})`} />
      <path d="M62 112 L48 96 L28 112 L40 150" fill={dark} />
      <path d="M118 112 L132 96 L152 112 L140 150" fill={dark} />
      <path d="M78 108 C82 128 98 128 102 108" fill={shade(shirt, 10)} />
      <path d="M70 108 H110 L106 122 H74 Z" fill={f.hair} opacity="0.15" />
      <path d="M78 96 C80 112 100 112 102 96 L98 118 C94 124 86 124 82 118 Z" fill={`url(#skin-${uid})`} />
      <ellipse cx={cx - fw - 2} cy="78" rx="6" ry="9" fill={f.skin} />
      <ellipse cx={cx + fw + 2} cy="78" rx="6" ry="9" fill={f.skin} />
      <ellipse cx={cx} cy="76" rx={fw} ry="34" fill={`url(#skin-${uid})`} />
      <ellipse cx={cx - 10} cy="88" rx="7" ry="5" fill={skinDark} opacity="0.22" />
      <ellipse cx={cx + 10} cy="88" rx="7" ry="5" fill={skinDark} opacity="0.22" />
      {f.hairStyle === 0 && <ellipse cx={cx} cy="52" rx={fw + 2} ry="16" fill={f.hair} />}
      {f.hairStyle === 1 && (
        <path
          d={`M${cx - fw - 4} 78 C${cx - fw} 42 ${cx + fw} 42 ${cx + fw + 4} 78 L${cx + fw} 58 C${cx} 36 ${cx} 36 ${cx - fw} 58 Z`}
          fill={f.hair}
        />
      )}
      {f.hairStyle === 2 && <rect x={cx - fw + 2} y="42" width={fw * 2 - 4} height="14" rx="3" fill={f.hair} />}
      {f.hairStyle === 3 && (
        <>
          <ellipse cx={cx} cy="54" rx={fw + 4} ry="18" fill={f.hair} />
          <path d={`M${cx - fw} 70 Q${cx - fw - 10} 90 ${cx - fw + 4} 100`} stroke={f.hair} strokeWidth="7" fill="none" />
        </>
      )}
      {f.hairStyle === 4 && <path d={`M${cx - fw} 68 C${cx - 8} 40 ${cx + 8} 40 ${cx + fw} 68 L${cx} 48 Z`} fill={f.hair} />}
      {f.hairStyle === 5 && <ellipse cx={cx} cy="50" rx={fw - 6} ry="8" fill={f.hair} opacity="0.85" />}
      <path
        d={`M${cx - 16} ${68 - f.brow} Q${cx - 10} ${64 - f.brow} ${cx - 5} ${68 - f.brow}`}
        stroke={f.hair}
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d={`M${cx + 5} ${68 - f.brow} Q${cx + 10} ${64 - f.brow} ${cx + 16} ${68 - f.brow}`}
        stroke={f.hair}
        strokeWidth="2.2"
        fill="none"
      />
      <ellipse cx={cx - 11} cy="76" rx="5.2" ry="3.4" fill="#fff" />
      <ellipse cx={cx + 11} cy="76" rx="5.2" ry="3.4" fill="#fff" />
      <ellipse cx={cx - 11} cy="76" rx="2.6" ry="2.6" fill={f.eye} />
      <ellipse cx={cx + 11} cy="76" rx="2.6" ry="2.6" fill={f.eye} />
      <circle cx={cx - 10} cy="75" r="0.8" fill="#fff" />
      <circle cx={cx + 12} cy="75" r="0.8" fill="#fff" />
      <path d={`M${cx} 78 L${cx + f.nose * 2} 90 L${cx} 92 L${cx - f.nose * 2} 90 Z`} fill={skinDark} opacity="0.55" />
      <path d={`M${cx - 8} 100 Q${cx} 105 ${cx + 8} 100`} stroke={shade(f.skin, -45)} strokeWidth="1.6" fill="none" />
      {f.beard === 1 && <ellipse cx={cx} cy="104" rx="16" ry="10" fill={f.hair} opacity="0.28" />}
      {f.beard === 2 && (
        <path d={`M${cx - 18} 96 Q${cx} 124 ${cx + 18} 96 Q${cx} 110 ${cx - 18} 96`} fill={f.hair} opacity="0.7" />
      )}
      <rect fill={`url(#lit-${uid})`} width="180" height="240" />
    </svg>
  );
}

/** Küçük kafa — liste/ikon. */
export function Portrait({ id, size = 48, kit }: { id: string; size?: number; kit?: string }) {
  return (
    <span className="relative inline-block overflow-hidden rounded-lg" style={{ width: size, height: Math.round(size * 1.25) }}>
      <CardArt id={id} kit={kit} />
    </span>
  );
}
