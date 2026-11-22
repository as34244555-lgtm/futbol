"use client";

import { GameShell } from "@/components/GameShell";
import { Portrait } from "@/components/Portrait";
import { useGame } from "@/lib/game-context";
import { mergeMarket, positionFilters } from "@/lib/market-pool";
import { formatCoins } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function TransferPage() {
  const { world, userTeam, buyListing, makeOffer } = useGame();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [msg, setMsg] = useState<string | null>(null);
  const [shown, setShown] = useState(24);

  const all = useMemo(() => mergeMarket(world), [world]);
  const rows = useMemo(() => {
    return all
      .filter((x) => (pos === "ALL" ? true : x.player.position === pos))
      .filter((x) => x.player.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.player.overall - a.player.overall);
  }, [all, q, pos]);
  const market = rows.filter((r) => r.listing.seller_team_id !== userTeam?.id).slice(0, shown);

  return (
    <GameShell flush>
      <div className="flex h-[calc(100dvh-6.2rem)] w-full flex-col px-[clamp(0.75rem,2vw,1.5rem)]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl text-[#e7c56a] sm:text-4xl">Standart Oyuncu</h1>
          <p className="text-sm text-white/60">Oyuncu sayısı: {formatCoins(all.length)}</p>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Oyuncu ara"
            className="min-w-[180px] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          {positionFilters().map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPos(p.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${pos === p.id ? "bg-[#1f8fff] text-white" : "bg-white/5 text-white/70"}`}
            >
              {p.label}
            </button>
          ))}
          <button type="button" className="ml-auto rounded-lg border border-white/20 px-3 py-2 text-xs">Sırala</button>
          <button type="button" className="rounded-lg border border-white/20 px-3 py-2 text-xs">Filtre</button>
        </div>
        {msg && <p className="mb-2 text-sm text-[#e7c56a]">{msg}</p>}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {market.map((r) => (
            <div key={r.listing.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141a24]/95 px-3 py-2">
              <div className="relative flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                <Portrait
                  id={r.player.id}
                  size={48}
                  nation={r.player.nationality_code}
                  age={r.player.age}
                  portrait={r.player.portrait}
                />
                <span className="absolute bottom-0 left-0 rounded-tr bg-black/70 px-1 text-[10px] font-bold text-[#e7c56a]">
                  {r.player.overall}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.player.name}</p>
                <p className="text-xs text-white/50">
                  {r.player.position} · Seviye 1/22 · {r.player.nationality}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[#7eb6ff]">{formatCoins(r.listing.price)}</p>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs"
                onClick={async () => {
                  const err = await makeOffer(r.listing.id, Math.round(r.listing.price * 0.9));
                  setMsg(err ?? `${r.player.name} için teklif gitti.`);
                }}
              >
                Teklif
              </button>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-[#1f8fff] px-3 py-2 text-xs font-bold text-white"
                onClick={async () => {
                  const err = await buyListing({
                    listingId: r.listing.id,
                    playerId: r.player.id,
                    sellerTeamId: r.listing.seller_team_id,
                    price: r.listing.price,
                  });
                  setMsg(err ?? `${r.player.name} kadroya katıldı.`);
                }}
              >
                Al
              </button>
            </div>
          ))}
          {rows.length > shown && (
            <button type="button" className="w-full rounded-xl border border-white/15 py-3 text-sm" onClick={() => setShown((n) => n + 24)}>
              Daha fazla ({rows.length - shown})
            </button>
          )}
        </div>
      </div>
    </GameShell>
  );
}
