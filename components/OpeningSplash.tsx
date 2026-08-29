"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const SESSION_KEY = "liga-nova-opened";

export function OpeningSplash({ children }: { children: React.ReactNode }) {
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
    const fade = window.setTimeout(() => setPhase("out"), 2400);
    const end = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setPhase("done");
    }, 3100);
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
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-ink-950"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "out" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            aria-label="Liga Nova açılış"
          >
            <Image
              src="/liga-nova-splash.webp"
              alt=""
              fill
              priority
              className="object-cover opacity-70"
              sizes="100vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/80" />
            <motion.div
              className="relative z-10 flex flex-col items-center px-6 text-center"
              initial={{ opacity: 0, scale: 0.86, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <span className="splash-pulse inline-flex rounded-[2rem] shadow-gold">
                <Image
                  src="/liga-nova-logo.png"
                  alt="Liga Nova"
                  width={220}
                  height={220}
                  priority
                  className="h-[min(42vw,220px)] w-[min(42vw,220px)] rounded-[2rem] object-cover ring-1 ring-gold/40"
                />
              </span>
              <p className="mt-6 font-display text-5xl tracking-[0.18em] text-gold sm:text-6xl">LIGA NOVA</p>
              <p className="mt-2 text-xs uppercase tracking-[0.42em] text-neon">Futbol menajerlik</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
