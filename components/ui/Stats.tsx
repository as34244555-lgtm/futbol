import { cn } from "@/lib/utils";

export function StatBar({
  value,
  label,
  color = "bg-neon",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export function OverallBadge({ overall }: { overall: number }) {
  const legend = overall >= 100;
  const tone = legend
    ? "bg-gold text-ink-950 shadow-gold"
    : overall >= 85
      ? "bg-gold text-ink-950"
      : overall >= 75
        ? "bg-neon text-ink-950"
        : "bg-slate-700 text-white";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-black",
        legend ? "h-8 min-w-[2.75rem] px-1 text-xs" : "h-8 w-8 text-sm",
        tone,
      )}
    >
      {overall}
    </span>
  );
}

export function PositionChip({ position, versatile }: { position: string; versatile?: boolean }) {
  if (versatile) {
    return (
      <span className="rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gold">
        TÜM
      </span>
    );
  }
  const map: Record<string, string> = {
    KL: "bg-amber-500/20 text-amber-300",
    DEF: "bg-sky-500/20 text-sky-300",
    OS: "bg-emerald-500/20 text-emerald-300",
    FV: "bg-rose-500/20 text-rose-300",
  };
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider", map[position] ?? "bg-white/10")}>
      {position}
    </span>
  );
}
