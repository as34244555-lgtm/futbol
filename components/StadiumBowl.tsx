import { cn } from "@/lib/utils";

export function StadiumBowl({
  children,
  className,
  caption,
}: {
  children: React.ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-white/10 bg-[#07140c]", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-zinc-800/90 via-zinc-700/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900/90 to-transparent" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-zinc-800/70 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-zinc-800/70 to-transparent" />
      <span className="pointer-events-none absolute left-[12%] top-1 h-16 w-1 rotate-12 bg-gradient-to-b from-amber-100/80 to-transparent blur-[1px]" />
      <span className="pointer-events-none absolute right-[12%] top-1 h-16 w-1 -rotate-12 bg-gradient-to-b from-amber-100/80 to-transparent blur-[1px]" />
      <span className="pointer-events-none absolute left-[28%] top-0 h-10 w-1 rotate-6 bg-gradient-to-b from-white/50 to-transparent" />
      <span className="pointer-events-none absolute right-[28%] top-0 h-10 w-1 -rotate-6 bg-gradient-to-b from-white/50 to-transparent" />
      <div className="relative p-2 sm:p-3">{children}</div>
      {caption && (
        <p className="relative z-10 truncate px-3 pb-2 text-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
          {caption}
        </p>
      )}
    </div>
  );
}
