import type { MatchLog, MatchSimulationResult, TimelineEvent } from "./types";

const FILL = [
  "Top orta sahada dolaşıyor, tempo yükseliyor.",
  "İki kanat da geniş açıldı, takımlar pozisyon arıyor.",
  "Pres sıkı; ikinci top savaşı kızıştı.",
  "Oyuncular nefesleniyor, hakem oyunu devam ettiriyor.",
  "Uzun pas denemesi sonuçsuz kaldı, yeniden kurulum.",
  "Savunma hattı önde, ofsayt tuzağı kuruluyor.",
  "Kanat değişimi geldi, tribün ritmi artırdı.",
  "Orta saha düellosu: top bir o yana bir bu yana.",
];

function filler(minute: number, home: string, away: string): string {
  if (minute === 1) return `Hakem düdüğü çaldı! ${home} — ${away} karşılaşması başladı.`;
  if (minute === 45) return `İlk yarı sona erdi.`;
  if (minute === 90) return `Maç sona erdi!`;
  return FILL[minute % FILL.length]!;
}

function fromLogs(logs: MatchLog[]): TimelineEvent[] {
  const hs = 0;
  const as = 0;
  return logs.map((l) => {
    const isGoal = l.event_type === "goal";
    // logs don't say which side; keep last known from description if possible
    return {
      minute: l.minute,
      second: 0,
      eventType: l.event_type,
      description: l.description,
      ball: { x: 50, y: 50 },
      team: "neutral" as const,
      score: [hs, as] as [number, number],
      ...(isGoal ? {} : {}),
    };
  });
}

/** Her dakika en az bir anlatım satırı olsun; seyir 90 dakika sürsün. */
export function densifyTimeline(
  result: MatchSimulationResult,
  homeName: string,
  awayName: string,
): TimelineEvent[] {
  const raw =
    result.timeline?.length > 0
      ? result.timeline
      : result.logs?.length
        ? fromLogs(result.logs)
        : [];
  const byMinute = new Map<number, TimelineEvent[]>();
  for (const ev of raw) {
    const m = Math.max(1, Math.min(90, Math.round(ev.minute) || 1));
    const list = byMinute.get(m) ?? [];
    list.push({ ...ev, minute: m });
    byMinute.set(m, list);
  }

  const out: TimelineEvent[] = [];
  let score: [number, number] = [0, 0];
  for (let minute = 1; minute <= 90; minute++) {
    const hits = byMinute.get(minute);
    if (hits?.length) {
      const pick =
        hits.find((e) => e.eventType === "goal") ??
        hits.find((e) => e.eventType === "shot") ??
        hits.find((e) => e.eventType === "chance") ??
        hits[hits.length - 1]!;
      score = [pick.score[0], pick.score[1]];
      out.push(pick);
      continue;
    }
    const whistle = minute === 45 || minute === 90;
    let description = filler(minute, homeName, awayName);
    if (minute === 45) description = `İlk yarı sona erdi. Skor ${homeName} ${score[0]} - ${score[1]} ${awayName}`;
    if (minute === 90) description = `Maç sona erdi! ${homeName} ${score[0]} - ${score[1]} ${awayName}`;
    out.push({
      minute,
      second: 0,
      eventType: whistle ? "whistle" : "pass",
      description,
      ball: { x: 40 + (minute % 20), y: 30 + (minute % 40) },
      team: "neutral",
      score: [score[0], score[1]],
    });
  }

  const last = out[out.length - 1];
  const wantH = result.match.home_score;
  const wantA = result.match.away_score;
  if (last && (last.score[0] !== wantH || last.score[1] !== wantA)) {
    out[out.length - 1] = {
      ...last,
      score: [wantH, wantA],
      description: `Maç sona erdi! ${homeName} ${wantH} - ${wantA} ${awayName}`,
      eventType: "whistle",
    };
  }
  return out;
}

export function delayForEvent(event: TimelineEvent, _prev: TimelineEvent | null, speed: number): number {
  if (event.eventType === "goal") return Math.max(2200, 2600 / speed);
  if (event.eventType === "whistle") return Math.max(1200, 1600 / speed);
  // Tam 90 tik: 1x ≈ 1.7 sn/dk → maç ~2.5 dakika
  return Math.max(1500, 1700 / speed);
}
