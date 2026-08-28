import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function catalogId(index: number): string {
  const hex = index.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

export function teamId(index: number): string {
  const hex = (index + 0x100000).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}
