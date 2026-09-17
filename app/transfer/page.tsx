"use client";

import { GameShell } from "@/components/GameShell";
import { PlayerCard } from "@/components/PlayerCard";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { ABDULLAH_ID, botManagerName } from "@/lib/catalog";
import { mergeMarket, positionFilters } from "@/lib/market-pool";
import { SYSTEM_TEAM_ID } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import { useMemo, useState } from "react";

const PAGE = 36;

export default function TransferPage() {
  const { world, userTeam, buyListing, cancelListing, makeOffer, respondOffer } = useGame();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [msg, setMsg] = useState<string | null>(null);
  const [bid, setBid] = useState<Record<string, number>>({});
  const [shown, setShown] = useState(PAGE);

  const all = useMemo(() => mergeMarket(world), [world]);
  const rows = useMemo(() => {
    return all
      .filter((x) => (pos === "ALL" ? true : x.player.position === pos))
      .filter((x) => x.player.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => Number(b.player.id === ABDULLAH_ID) - Number(a.player.id === ABDULLAH_ID) || b.player.overall - a.player.overall);
  }, [all, q, pos]);

  const mine = world.listings
    .filter((l) => l.status === "active" && l.seller_team_id === userTeam?.id)
    .map((l) => {
      const tp = world.teamPlayers.find((t) => t.id === l.team_player_id);
      const player = tp ? world.players.find((p) => p.id === tp.player_id) : undefined;
      return { listing: l, player };
    })
    .filter((x) => x.player);
  const market = rows.filter((r) => r.listing.seller_team_id !== userTeam?.id);
  const visible = market.slice(0, shown);

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pazar</p>
      <h1 className="font-display mb-2 text-5xl">Transfer piyasası</h1>
      <p className="mb-6 text-slate-400">
        Pazarda {all.length} oyuncu. Botlar teklifi listenin %85’i ve üstündeyse kabul eder, altını reddeder. Abdullah
        100.000 ₡.
      </p>
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Oyuncu ara"
          className="rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm outline-none ring-neon focus:ring-2"
        />
        {positionFilters().map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={pos === p.id ? "primary" : "ghost"}
            onClick={() => {
              setPos(p.id);
              setShown(PAGE);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-gold">{msg}</p>}
      {userTeam && (world.offers ?? []).some((o) => o.status === "pending" && o.sellerTeamId === userTeam.id) && (
        <div className="mb-6 space-y-2 rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-xs uppercase tracking-wider text-gold">Gelen teklifler</p>
          {(world.offers ?? [])
            .filter((o) => o.status === "pending" && o.sellerTeamId === userTeam.id)
            .map((o) => {
              const p = world.players.find((x) => x.id === o.playerId);
              const buyer = world.teams.find((t) => t.id === o.buyerTeamId);
              return (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {buyer?.name} → {p?.name} · {formatCoins(o.price)} ₡
                  </span>
                  <span className="flex gap-2">
                    <Button size="sm" onClick={() => void respondOffer(o.id, true)}>
                      Kabul
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void respondOffer(o.id, false)}>
                      Red
                    </Button>
                  </span>
                </div>
              );
            })}
        </div>
      )}
      {mine.length > 0 && (
        <>
          <h2 className="font-display mb-3 text-2xl">Sizin ilanlarınız</h2>
          <div className="mb-8 space-y-2">
            {mine.map((r) => (
              <div key={r.listing.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-800 px-4 py-3">
                <span>
                  {r.player!.name} · {formatCoins(r.listing.price)} ₡
                </span>
                <Button size="sm" variant="ghost" onClick={() => void cancelListing(r.listing.id)}>
                  Geri çek
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      {market.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-800 px-4 py-8 text-center text-slate-400">
          Bu filtrede oyuncu yok. Mevkiyi Tümü yapın veya aramayı silin — pazarda her zaman en az 1000 isim durur.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((r) => {
              const seller =
                r.listing.seller_team_id === SYSTEM_TEAM_ID
                  ? "Lig Ajansı"
                  : `${world.teams.find((t) => t.id === r.listing.seller_team_id)?.name ?? "Kulüp"} · ${
                      world.teams.find((t) => t.id === r.listing.seller_team_id)?.user_id
                        ? "insan"
                        : botManagerName(world.teams.find((t) => t.id === r.listing.seller_team_id)?.name ?? "")
                    }`;
              const kit = world.teams.find((t) => t.id === r.listing.seller_team_id)?.kit_primary;
              return (
                <PlayerCard
                  key={r.listing.id}
                  player={r.player}
                  kit={kit}
                  compact
                  featured={r.player.id === ABDULLAH_ID}
                  footer={
                    <div className="mt-2 space-y-1.5">
                      <p className="truncate text-[10px] text-slate-500">{seller}</p>
                      <p className="text-sm font-semibold text-gold">{formatCoins(r.listing.price)} ₡</p>
                      <input
                        type="number"
                        min={1}
                        value={bid[r.listing.id] ?? Math.round(r.listing.price * 0.9)}
                        onChange={(e) => setBid((b) => ({ ...b, [r.listing.id]: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm"
                      />
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const err = await makeOffer(r.listing.id, bid[r.listing.id] ?? Math.round(r.listing.price * 0.9));
                            setMsg(err ?? `${r.player.name} için teklif gitti.`);
                          }}
                        >
                          Teklif
                        </Button>
                        <Button
                          size="sm"
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
                        </Button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
          {market.length > shown && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                Daha fazla kart ({market.length - shown} kaldı)
              </Button>
              <p className="mt-2 text-xs text-slate-500">Toplam {all.length} satılık.</p>
            </div>
          )}
        </>
      )}
    </GameShell>
  );
}
