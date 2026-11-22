"use client";

import { GameShell } from "@/components/GameShell";
import { PlayerCard } from "@/components/PlayerCard";
import { TacticsPitch } from "@/components/TacticsPitch";
import { Button } from "@/components/ui/Button";
import { FORMATION_SLOTS } from "@/lib/formations";
import { useGame } from "@/lib/game-context";
import { POSITION_LABEL, POSITIONS } from "@/lib/types";
import { isInjured, teamWageBill } from "@/lib/career";
import { cardLiveOverall, filterPlayers, squadChemistry } from "@/lib/meta";
import { rosterOf } from "@/lib/world";
import { useMemo, useState } from "react";

export default function SquadPage() {
  const { world, userTeam, assignSlot, autoPick, listForSale, upgradeCard } = useGame();
  const roster = useMemo(() => (userTeam ? rosterOf(world, userTeam.id) : []), [world, userTeam]);
  const [slot, setSlot] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [compare, setCompare] = useState<string | null>(null);
  const [price, setPrice] = useState(1000);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [tier, setTier] = useState<"all" | "standard" | "special" | "legend">("all");
  const [sort, setSort] = useState<"ovr" | "name" | "level">("ovr");

  const chem = useMemo(() => squadChemistry(roster, userTeam?.nation), [roster, userTeam?.nation]);
  const filtered = useMemo(
    () => filterPlayers(roster, { q, pos, tier, sort }),
    [roster, q, pos, tier, sort],
  );
  const selectedRow = roster.find((r) => r.id === selected);
  const compareRow = roster.find((r) => r.id === compare);

  if (!userTeam) return null;
  const slots = FORMATION_SLOTS[userTeam.formation];
  const listed = new Set(
    world.listings.filter((l) => l.status === "active").map((l) => l.team_player_id),
  );

  return (
    <GameShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kadro</p>
          <h1 className="font-display text-4xl sm:text-5xl">İlk 11 ve yedekler</h1>
          <p className="mt-1 text-sm text-slate-400">
            Haftalık maaş {teamWageBill(world, userTeam.id)} ₡ · sakat {roster.filter((r) => isInjured(r)).length} · Chemistry {chem.score}
          </p>
        </div>
        <Button onClick={() => void autoPick()} variant="outline">
          Otomatik diziliş
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara…"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
        />
        <select value={pos} onChange={(e) => setPos(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm">
          <option value="ALL">Mevki</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm">
          <option value="all">Tüm kartlar</option>
          <option value="standard">Standart</option>
          <option value="special">Özel</option>
          <option value="legend">Efsane</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm">
          <option value="ovr">OVR</option>
          <option value="name">İsim</option>
          <option value="level">Seviye</option>
        </select>
      </div>
      {selectedRow && compareRow && (
        <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 sm:grid-cols-2">
          {[selectedRow, compareRow].map((r) => (
            <div key={r.id} className="text-sm">
              <p className="font-semibold">{r.player.name}</p>
              <p className="text-slate-400">
                OVR {cardLiveOverall(r.player, r)} · Lv {r.level ?? 1} · Boost +{r.boost ?? 0}
              </p>
              <p className="text-slate-500">
                ATK {r.player.attack} · DEF {r.player.defense} · {r.player.nationality}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TacticsPitch
          formation={userTeam.formation}
          roster={roster}
          selectedId={roster.find((r) => r.squad_position === slot)?.id}
          onSelectSlot={setSlot}
          kit={userTeam.kit_primary}
        />
        <div>
          <p className="mb-3 text-sm text-slate-400">
            {slot
              ? `Saha noktası: ${slots.find((s) => s.key === slot)?.label}. Bir oyuncu seçin.`
              : "Oyuncu yerleştirmek için sahadaki bir noktaya tıklayın."}
          </p>
          {msg && <p className="mb-3 text-sm text-gold">{msg}</p>}
          <div className="grid max-h-[720px] grid-cols-2 gap-3 overflow-y-auto pr-1">
            {!roster.some((r) => r.player.position === "KL") && (
              <p className="col-span-2 rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                Kadroda kaleci yok. 24 standart oyuncu saha oyuncusu. Özel kaleciler pazarda.
              </p>
            )}
            {filtered.map((r) => (
              <div key={r.id} className="space-y-2">
                <PlayerCard
                  player={r.player}
                  row={r}
                  kit={userTeam.kit_primary}
                  kitSecondary={userTeam.kit_secondary}
                  kitStyle={userTeam.kit_style}
                  compact
                  selected={selected === r.id}
                  featured={Boolean(r.player.legend)}
                  onClick={() => {
                    setSelected(r.id);
                    if (slot) {
                      void assignSlot(slot, r.id);
                      setSlot(null);
                    }
                  }}
                  footer={
                    <p className="mt-1 text-[10px] text-slate-500">
                      Lv {r.level ?? 1} · +{r.boost ?? 0} · OVR {cardLiveOverall(r.player, r)}
                      {isInjured(r) ? ` · Sakat` : r.is_starter ? ` · İlk 11` : " · Yedek"}
                      {listed.has(r.id) ? " · Listede" : ""}
                    </p>
                  }
                />
                {selected === r.id && (
                  <div className="flex flex-col gap-2 px-1">
                    <div className="grid grid-cols-3 gap-1">
                      <Button size="sm" variant="outline" onClick={async () => setMsg((await upgradeCard(r.id, "level")) ?? "Seviye +1")}>
                        Lv
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => setMsg((await upgradeCard(r.id, "boost")) ?? "Boost +1")}>
                        Boost
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => setMsg((await upgradeCard(r.id, "train")) ?? "Antrenman OK")}>
                        Ant.
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setCompare(r.id)}>
                      Karşılaştır
                    </Button>
                    <input
                      type="number"
                      min={1}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-ink-800 px-2 py-1 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={async () => {
                        const err = await listForSale(r.id, price);
                        setMsg(err ?? `${r.player.name} transfer listesine eklendi.`);
                      }}
                    >
                      Satışa çıkar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-500">
        {(["KL", "STP", "SLB", "SĞB", "MOS", "KANAT", "FV"] as const).map((p) => (
          <span key={p} className="rounded-full bg-white/5 px-3 py-1">
            {POSITION_LABEL[p]}: {roster.filter((r) => r.player.position === p).length}
          </span>
        ))}
      </div>
    </GameShell>
  );
}
