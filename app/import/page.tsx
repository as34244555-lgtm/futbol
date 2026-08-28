"use client";

import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { parseCommunityCsv, parseCommunityJson, SAMPLE_CSV, SAMPLE_JSON } from "@/lib/community-import";
import { useGame } from "@/lib/game-context";
import { useState } from "react";

export default function ImportPage() {
  const { importPlayers } = useGame();
  const [text, setText] = useState(SAMPLE_JSON);
  const [kind, setKind] = useState<"json" | "csv">("json");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [log, setLog] = useState<string>("");

  return (
    <GameShell>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Community Database</p>
      <h1 className="font-display mb-2 text-5xl">Özel kadro içe aktar</h1>
      <p className="mb-6 max-w-2xl text-slate-400">
        JSON veya CSV ile kendi oyuncu listenizi yükleyin. Şema <code>players</code> tablosu ile aynıdır:
        name, nationality, position (KL/DEF/OS/FV), age, attack, defense. overall ve base_value isteğe bağlıdır.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={kind === "json" ? "primary" : "ghost"} onClick={() => { setKind("json"); setText(SAMPLE_JSON); }}>
          JSON
        </Button>
        <Button size="sm" variant={kind === "csv" ? "primary" : "ghost"} onClick={() => { setKind("csv"); setText(SAMPLE_CSV); }}>
          CSV
        </Button>
        <Button size="sm" variant={mode === "merge" ? "gold" : "ghost"} onClick={() => setMode("merge")}>
          Birleştir
        </Button>
        <Button size="sm" variant={mode === "replace" ? "danger" : "ghost"} onClick={() => setMode("replace")}>
          Kataloğu değiştir
        </Button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[280px] w-full rounded-2xl border border-white/10 bg-ink-800 p-4 font-mono text-sm outline-none ring-neon focus:ring-2"
      />
      <div className="mt-4 flex gap-3">
        <Button
          onClick={async () => {
            const parsed = kind === "csv" ? parseCommunityCsv(text) : parseCommunityJson(text);
            if (!parsed.ok) {
              setLog(parsed.errors.join("\n") || "Hata");
              return;
            }
            const res = await fetch("/api/import-database", {
              method: "POST",
              headers: { "content-type": kind === "json" ? "application/json" : "text/csv" },
              body: kind === "json" ? text : text,
            });
            const json = await res.json();
            if (!res.ok) {
              setLog((json.errors ?? [json.error]).join?.("\n") ?? "API hatası");
              return;
            }
            importPlayers(json.players, mode);
            setLog(`${json.players.length} oyuncu içe aktarıldı (${mode}).`);
          }}
        >
          Doğrula ve aktar
        </Button>
      </div>
      {log && <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm text-slate-300">{log}</pre>}
    </GameShell>
  );
}
