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
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function OverallBadge({ overall }: { overall: number }) {
  const tone =
    overall >= 85 ? "bg-gold text-ink-950" : overall >= 75 ? "bg-neon text-ink-950" : "bg-slate-700 text-white";
  return (
    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black", tone)}>
      {overall}
    </span>
  );
}

export function PositionChip({ position }: { position: string }) {
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
