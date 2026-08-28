"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const gone = /deploy/i.test(error.message) || /is not valid JSON/i.test(error.message);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Bağlantı</p>
      <h1 className="font-display mt-2 text-5xl">Sayfa açılamadı</h1>
      <p className="mt-4 text-slate-300">
        {gone
          ? "Geçici site kapanmış veya yenileniyor. Ana sayfayı açıp tekrar deneyin."
          : error.message || "Beklenmeyen bir hata oluştu."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => reset()}>Tekrar dene</Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/")}>
          Ana sayfa
        </Button>
      </div>
    </div>
  );
}
