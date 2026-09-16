"use client";

import { GameShell } from "@/components/GameShell";
import { Portrait } from "@/components/Portrait";
import { PositionChip } from "@/components/ui/Stats";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { flagUrl } from "@/lib/nations";
import { ABDULLAH_ID, botManagerName } from "@/lib/catalog";
import { mergeMarket, positionFilters } from "@/lib/market-pool";
import { SYSTEM_TEAM_ID } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";

export default function TransferPage() {
  const { world, userTeam, buyListing, cancelListing, makeOffer, respondOffer } = useGame();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [msg, setMsg] = useState<string | null>(null);
  const [bid, setBid] = useState<Record<string, number>>({});

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
          onChange={(e) => setQ(e.target.value)}
          placeholder="Oyuncu ara"
          className="rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm outline-none ring-neon focus:ring-2"
        />
        {positionFilters().map((p) => (
          <Button key={p.id} size="sm" variant={pos === p.id ? "primary" : "ghost" } onClick={() => setPos(p.id)}>
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
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Oyuncu</th>
              <th>Mevki</th>
              <th>OVR</th>
              <th>Satıcı</th>
              <th>Fiyat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {market.slice(0, 120).map((r) => (
              <tr key={r.listing.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.player.portrait ? (
                      <Image
                        src={flagUrl(r.player.nationality_code)}
                        alt=""
                        width={20}
                        height={14}
                        className="h-3.5 w-5 rounded-sm object-cover"
                        unoptimized
                      />
                    ) : (
                      <Portrait id={r.player.id} size={36} />
                    )}
                    <Image
                      src={flagUrl(r.player.nationality_code)}
                      alt=""
                      width={20}
                      height={14}
                      className="h-3.5 w-5 rounded-sm object-cover"
                      unoptimized
                    />
                    <div>
                      <p className="font-medium">
                        {r.player.name}
                        {r.player.id === ABDULLAH_ID ? <span className="ml-2 text-gold">Efsane</span> : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.player.age} yaş · {r.player.nationality}
                        {r.player.potential ? ` · tavan ${r.player.potential}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <PositionChip position={r.player.position} versatile={r.player.versatile} />
                </td>
                <td className="font-semibold">{r.player.overall}</td>
                <td className="text-slate-400">
                  {r.listing.seller_team_id === SYSTEM_TEAM_ID
                    ? "Lig Ajansı"
                    : `${world.teams.find((t) => t.id === r.listing.seller_team_id)?.name ?? "Kulüp"} · ${
                        world.teams.find((t) => t.id === r.listing.seller_team_id)?.user_id
                          ? "insan"
                          : botManagerName(world.teams.find((t) => t.id === r.listing.seller_team_id)?.name ?? "")
                      }`}
                </td>
                <td className="text-gold">{formatCoins(r.listing.price)} ₡</td>
                <td className="pr-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <input
                      type="number"
                      min={1}
                      value={bid[r.listing.id] ?? Math.round(r.listing.price * 0.9)}
                      onChange={(e) => setBid((b) => ({ ...b, [r.listing.id]: Number(e.target.value) }))}
                      className="w-24 rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-sm"
                    />
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
                      Satın al
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {market.length > 120 && (
          <p className="px-4 py-3 text-xs text-slate-500">
            {market.length - 120} oyuncu daha var — arama veya mevki ile daraltın. Toplam {all.length} satılık.
          </p>
        )}
      </div>
      )}
    </GameShell>
  );
}
