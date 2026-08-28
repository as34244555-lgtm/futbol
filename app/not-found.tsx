import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="font-display text-5xl text-neon">404</p>
      <p className="text-slate-400">Sayfa yok.</p>
      <Link href="/" className="text-sm text-gold">
        Ana sayfa
      </Link>
    </div>
  );
}
