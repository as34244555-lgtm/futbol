"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { SeasonTitle } from "@/lib/types";
import { CHAMPION_PRIZE } from "@/lib/titles";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

export function ChampionBanner({ title }: { title: SeasonTitle }) {
  const { t } = useI18n();
  return (
    <div className="rounded-3xl border border-gold/40 bg-gold/10 p-5 shadow-gold">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("champ.cup")}</p>
      <div className="mt-2 flex items-start gap-3">
        <Trophy className="mt-1 h-8 w-8 shrink-0 text-gold" />
        <div>
          <h2 className="font-display text-3xl text-gold">{t("champ.season", { n: title.season })}</h2>
          <p className="mt-1 text-lg font-semibold">{title.teamName}</p>
          <p className="mt-1 text-sm text-slate-400">
            {title.points} puan · {title.won} galibiyet · {title.played} maç · av {title.goalDiff > 0 ? "+" : ""}
            {title.goalDiff}
            {title.cupWinner ? ` · kupa ${title.cupWinner}` : ""}
          </p>
          {title.shareText && (
            <button
              type="button"
              className="mt-2 text-xs text-gold underline-offset-2 hover:underline"
              onClick={() => void navigator.clipboard.writeText(title.shareText ?? "")}
            >
              {t("champ.copy")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChampionOverlay({
  title,
  mine,
  onClose,
}: {
  title: SeasonTitle;
  mine: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-[2rem] border border-gold/50 bg-ink-900 p-6 text-center shadow-gold"
      >
        <Trophy className="mx-auto h-14 w-14 text-gold" />
        <p className="mt-4 text-xs uppercase tracking-[0.35em] text-gold">{t("game")}</p>
        <h2 className="font-display mt-2 text-4xl text-gold">{t("champ.champion")}</h2>
        <p className="mt-3 text-xl font-semibold">{title.teamName}</p>
        <p className="mt-2 text-sm text-slate-400">
          Sezon {title.season} · {title.points} puan · {title.won}G
        </p>
        {mine && (
          <p className="mt-4 text-sm text-neon">
            {t("champ.you")} +{formatCoins(CHAMPION_PRIZE)} ₡
          </p>
        )}
        {!mine && <p className="mt-4 text-sm text-slate-400">{t("champ.other")}</p>}
        {title.shareText && (
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void navigator.clipboard.writeText(title.shareText ?? "")}
          >
            {t("champ.copy")}
          </Button>
        )}
        <Button className="mt-6" variant="gold" onClick={onClose}>
          {t("champ.continue")}
        </Button>
      </motion.div>
    </div>
  );
}
