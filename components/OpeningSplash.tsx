"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const SESSION_KEY = "ml-opened-black";

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
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "out" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            aria-label={`${t("studio")} ${t("studioPresents")} ${t("game")}`}
          >
            <motion.div
              className="relative z-10 flex items-center justify-center px-10"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Image
                src="/a-studio-logo.png"
                alt="Abdullah Studio"
                width={900}
                height={490}
                priority
                className="h-auto w-[min(70vw,640px)] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
