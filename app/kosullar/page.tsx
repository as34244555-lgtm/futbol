"use client";

import { useI18n } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-300">
      <h1 className="font-display text-4xl text-white">{t("terms.title")}</h1>
      <p className="mt-4 text-sm leading-relaxed">{t("terms.body")}</p>
    </main>
  );
}
