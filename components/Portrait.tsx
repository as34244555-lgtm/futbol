"use client";

import Image from "next/image";
import { photoPortrait } from "@/lib/player-photo";

export function CardArt({
  id,
  kit,
  portrait,
  name,
  nation,
  age,
}: {
  id: string;
  kit?: string;
  portrait?: string;
  name?: string;
  nation?: string;
  age?: number;
}) {
  const src = photoPortrait({ id, portrait, nationality_code: nation, age });
  const tint = Boolean(kit) && !portrait;
  return (
    <span className="absolute inset-0">
      <Image src={src} alt={name ?? ""} fill className="object-cover object-top" sizes="280px" />
      {tint && (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] mix-blend-multiply opacity-75"
          style={{
            background: `linear-gradient(to top, ${kit} 42%, transparent)`,
            WebkitMaskImage: "linear-gradient(to top, black 55%, transparent)",
            maskImage: "linear-gradient(to top, black 55%, transparent)",
          }}
        />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
    </span>
  );
}

/** Küçük kafa — liste/ikon. */
export function Portrait({
  id,
  size = 48,
  kit,
  nation,
  age,
  portrait,
}: {
  id: string;
  size?: number;
  kit?: string;
  nation?: string;
  age?: number;
  portrait?: string;
}) {
  return (
    <span className="relative inline-block overflow-hidden rounded-lg" style={{ width: size, height: Math.round(size * 1.25) }}>
      <CardArt id={id} kit={kit} nation={nation} age={age} portrait={portrait} />
    </span>
  );
}
