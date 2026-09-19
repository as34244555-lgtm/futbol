"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { paintPlayerCard } from "@/lib/face-paint";

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
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (portrait) return;
    const c = ref.current;
    if (c) paintPlayerCard(c, id, kit);
  }, [id, kit, portrait]);

  if (portrait) {
    return (
      <span className="absolute inset-0">
        <Image src={portrait} alt={name ?? ""} fill className="object-cover object-top" sizes="280px" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
      </span>
    );
  }
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/** Küçük kafa — liste/ikon. */
export function Portrait({ id, size = 48, kit }: { id: string; size?: number; kit?: string }) {
  return (
    <span className="relative inline-block overflow-hidden rounded-lg" style={{ width: size, height: Math.round(size * 1.25) }}>
      <CardArt id={id} kit={kit} />
    </span>
  );
}
