"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const SESSION_KEY = "ml-opened";

export function OpeningSplash({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"boot" | "show" | "out" | "done">("boot");

  useEffect(() => {
    let skip = false;
    try {
      skip = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      skip = false;
    }
    if (skip) {
      setPhase("done");
      return;
    }
    setPhase("show");
    const fade = window.setTimeout(() => setPhase("out"), 2800);
    const end = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setPhase("done");
    }, 3500);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(end);
    };
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "out" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            aria-label={`${t("studio")} ${t("studioPresents")} ${t("game")}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(40,70,180,0.12),transparent_55%)]" />
            <motion.div
              className="relative z-10 flex flex-col items-center px-6 text-center"
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Image
                src="/a-studio-logo.jpg"
                alt={t("studio")}
                width={720}
                height={392}
                priority
                className="h-auto w-[min(88vw,520px)] object-contain"
              />
              <p className="mt-4 text-[11px] uppercase tracking-[0.48em] text-slate-500">{t("studioPresents")}</p>
              <p className="mt-2 font-display text-4xl tracking-[0.14em] text-[#1a2a6c] sm:text-5xl">{t("game")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
