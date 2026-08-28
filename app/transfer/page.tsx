"use client";

import { GameShell } from "@/components/GameShell";
import { PositionChip } from "@/components/ui/Stats";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { flagUrl } from "@/lib/nations";
import { botManagerName } from "@/lib/catalog";
import { SYSTEM_TEAM_ID } from "@/lib/types";
import { formatCoins } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";

export default function TransferPage() {
  const { world, userTeam, buyListing, cancelListing } = useGame();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [msg, setMsg] = useState<string | null>(null);

  const rows = useMemo(() => {
    const players = new Map(world.players.map((p) => [p.id, p]));
    const tps = new Map(world.teamPlayers.map((t) => [t.id, t]));
    const teams = new Map(world.teams.map((t) => [t.id, t]));
    return world.listings
      .filter((l) => l.status === "active")
      .map((l) => {
        const tp = tps.get(l.team_player_id);
        const player = tp ? players.get(tp.player_id) : undefined;
        const seller = teams.get(l.seller_team_id);
        return { listing: l, tp, player, seller };
      })
      .filter((x) => x.player && x.tp)
      .filter((x) => (pos === "ALL" ? true : x.player!.position === pos))
      .filter((x) => x.player!.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.player!.overall - a.player!.overall);
  }, [world, q, pos]);

  const mine = rows.filter((r) => r.listing.seller_team_id === userTeam?.id);
  const market = rows.filter((r) => r.listing.seller_team_id !== userTeam?.id);

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pazar</p>
      <h1 className="font-display mb-2 text-5xl">Transfer piyasası</h1>
      <p className="mb-6 text-slate-400">
        Lig ajansı serbest futbolcuları listeler. Bot kulüpler kadro dışı oyuncularını satar; gerçek menajer
        ilanları da burada görünür.
      </p>
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Oyuncu ara"
          className="rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm outline-none ring-neon focus:ring-2"
        />
        {["ALL", "KL", "DEF", "OS", "FV"].map((p) => (
          <Button key={p} size="sm" variant={pos === p ? "primary" : "ghost"} onClick={() => setPos(p)}>
            {p === "ALL" ? "Tümü" : p}
          </Button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-gold">{msg}</p>}
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
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
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
            {market.slice(0, 80).map((r) => (
              <tr key={r.listing.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={flagUrl(r.player!.nationality_code)}
                      alt=""
                      width={20}
                      height={14}
                      className="h-3.5 w-5 rounded-sm object-cover"
                      unoptimized
                    />
                    <div>
                      <p className="font-medium">{r.player!.name}</p>
                      <p className="text-xs text-slate-500">
                        {r.player!.age} yaş · {r.player!.nationality}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <PositionChip position={r.player!.position} />
                </td>
                <td className="font-semibold">{r.player!.overall}</td>
                <td className="text-slate-400">
                  {r.seller?.id === SYSTEM_TEAM_ID
                    ? "Lig Ajansı"
                    : r.seller?.user_id
                      ? `${r.seller.name} · insan`
                      : r.seller
                        ? `${r.seller.name} · ${botManagerName(r.seller.name)}`
                        : "—"}
                </td>
                <td className="text-gold">{formatCoins(r.listing.price)} ₡</td>
                <td className="pr-4 text-right">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const err = await buyListing(r.listing.id);
                      setMsg(err ?? `${r.player!.name} kadroya katıldı.`);
                    }}
                  >
                    Satın al
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GameShell>
  );
}
