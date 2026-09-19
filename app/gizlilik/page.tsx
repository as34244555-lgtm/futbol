"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-300">
      <h1 className="font-display text-4xl text-white">{t("privacy.title")}</h1>
      <p className="mt-4 text-sm leading-relaxed">{t("privacy.body")}</p>
      <p className="mt-4 text-sm">
        <Link className="text-neon" href="/">
          {t("privacy.home")}
        </Link>
      </p>
    </main>
  );
}
