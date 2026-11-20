"use client";

import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { NATIONS, flagUrl } from "@/lib/nations";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PASS_KEY = "ml-pass";

function rememberPassword(name: string, password: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(PASS_KEY) || "{}") as Record<string, string>;
    saved[name.trim().toLowerCase()] = password;
    localStorage.setItem(PASS_KEY, JSON.stringify(saved));
  } catch {
    /* ignore */
  }
}

export function savedPassword(name: string): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PASS_KEY) || "{}") as Record<string, string>;
    return saved[name.trim().toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

export function JoinScreen() {
  const { register } = useGame();
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [nation, setNation] = useState("tr");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 py-6 text-white">
      <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">{t("join.kicker")}</p>
      <h1 className="font-display mt-2 text-4xl sm:text-5xl">{t("join.title")}</h1>
      <form
        className="mt-6 flex flex-1 flex-col"
        onSubmit={async (e) => {
          e.preventDefault();
          const player = name.trim();
          if (player.length < 2 || !nation) return;
          setBusy(true);
          setError(null);
          const password = `ml-${Math.random().toString(36).slice(2, 10)}`;
          rememberPassword(player, password);
          const err = await register(player, password, player, "", { career: true, nation });
          setBusy(false);
          if (err) setError(err);
          else router.push("/dashboard");
        }}
      >
        <label className="block text-sm">
          {t("join.name")}
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-[#d4af37] focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("join.namePh")}
            autoComplete="off"
            required
            minLength={2}
          />
        </label>
        <p className="mb-2 mt-5 text-sm">{t("join.flag")}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {NATIONS.map((item) => {
            const on = item.code === nation;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setNation(item.code)}
                className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-sm ${on ? "border-[#d4af37] bg-[#d4af37]/15" : "border-white/10 bg-black/30"}`}
                aria-pressed={on}
              >
                <img src={flagUrl(item.code, 80)} alt="" className="h-5 w-8 rounded-sm object-cover" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy || name.trim().length < 2}>
          {busy ? t("join.busy") : t("join.go")}
        </Button>
      </form>
    </div>
  );
}
