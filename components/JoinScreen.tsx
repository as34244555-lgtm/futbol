"use client";

import { Button } from "@/components/ui/Button";
import { rememberPassword } from "@/lib/credentials";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import { NATIONS, flagUrl } from "@/lib/nations";
import { useRouter } from "next/navigation";
import { useState } from "react";

export { lastSavedUser, rememberPassword, savedPassword } from "@/lib/credentials";

export function JoinScreen() {
  const { register } = useGame();
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [nation, setNation] = useState("tr");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="ef-home relative flex h-[100dvh] w-[100vw] overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,#0a1524,#071018_42%,#0b1830)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(90deg,transparent_0%,#000_8%,#000_92%,transparent_100%)]">
        <div className="absolute -left-[10%] top-[-12%] h-[70%] w-[38%] rotate-[-16deg] bg-[#1e5fa866]" />
        <div className="absolute -right-[8%] bottom-[-14%] h-[72%] w-[36%] rotate-[14deg] bg-[#184a8866]" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2vh,1.5rem)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">{t("join.kicker")}</p>
        <h1 className="font-display mt-1 text-4xl sm:text-5xl">{t("join.title")}</h1>

        <form
          className="mt-4 flex min-h-0 flex-1 flex-col"
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
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(280px,0.9fr)_1.4fr]">
            <label className="block text-sm">
              {t("join.name")}
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-[#5aa8ff] focus:ring-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("join.namePh")}
                autoComplete="off"
                required
                minLength={2}
              />
              {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
              <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy || name.trim().length < 2}>
                {busy ? t("join.busy") : t("join.go")}
              </Button>
            </label>

            <div className="flex min-h-0 flex-col">
              <p className="mb-2 text-sm">{t("join.flag")}</p>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                {NATIONS.map((item) => {
                  const on = item.code === nation;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setNation(item.code)}
                      className={`flex items-center gap-2 rounded-xl border px-2 py-2.5 text-left text-sm ${on ? "border-[#5aa8ff] bg-[#5aa8ff]/15" : "border-white/10 bg-black/30"}`}
                      aria-pressed={on}
                    >
                      <img src={flagUrl(item.code, 80)} alt="" className="h-5 w-8 rounded-sm object-cover" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
