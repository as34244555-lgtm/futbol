"use client";

import { motion } from "framer-motion";
import { Flag, Radio, Swords, Users } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";

const FEATURES = [
  {
    icon: Users,
    title: "Kurgusal Kadro",
    text: "Gerçek isim yok — Lucas Silva, Erlung Haland ve yüzlerce telifsiz futbolcu.",
  },
  {
    icon: Flag,
    title: "Gerçek Uluslar",
    text: "Memleket ve bayraklar kamuya açık ülke verilerinden gelir.",
  },
  {
    icon: Swords,
    title: "2D Canlı Saha",
    text: "Milisaniyelik istatistik motoru 90 dakikayı anında üretir, sahada izlersiniz.",
  },
  {
    icon: Radio,
    title: "Çoklu oyuncu ligi",
    text: "Az insan olsa da bot menajerler ligi doldurur. İki gerçek menajer varsa onlar birbirleriyle eşleşir.",
  },
];

export default function LandingPage() {
  const { ready, userTeam, humans, bots, backend } = useGame();
  const hasSave = ready && Boolean(userTeam);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:28px_28px]" />
      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <BrandLogo size={48} />
        <div className="flex gap-2">
          {hasSave ? (
            <Link href="/dashboard">
              <Button variant="ghost">Panele dön</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost">Giriş</Button>
            </Link>
          )}
          <Link href="/play">
            <Button>Lige katıl</Button>
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-gold">
            Çoklu oyuncu · Vercel · {humans} insan · {bots} bot
          </p>
          <h1 className="font-display text-4xl leading-[0.95] sm:text-7xl">
            Aynı lige gir.
            <span className="block text-neon">Rakibini yen.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Paylaşılan Liga Nova sunucusunda diğer menajerlerle transfer yapın. Gerçek oyuncu azsa 18 bot
            menajer ligi doldurur; ikinci insan girince onunla eşleşirsiniz.
            {backend === "memory" ? " Üretimde Supabase servis anahtarı ekleyin." : ""}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/play">
              <Button size="lg">Menajer ol</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Giriş yap
              </Button>
            </Link>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-800 p-4 shadow-glow"
        >
          <div className="pitch-stripes relative aspect-[105/68] overflow-hidden rounded-2xl">
            <div className="absolute inset-2 rounded-lg border border-white/40" />
            <div className="absolute left-1/2 top-2 h-[calc(100%-16px)] w-px bg-white/40" />
            <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
            {[
              [12, 50],
              [28, 22],
              [28, 50],
              [28, 78],
              [48, 35],
              [48, 65],
              [62, 50],
              [78, 22],
              [82, 50],
              [78, 78],
              [22, 50],
            ].map(([x, y], i) => (
              <span
                key={i}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon shadow-glow"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            ))}
            <span className="absolute left-[62%] top-[42%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
          <div className="mt-4 flex items-center justify-between px-2 text-sm">
            <span>Bosphorus FC</span>
            <span className="font-display text-3xl">2 — 1</span>
            <span>Anatolia United</span>
          </div>
        </motion.div>
      </main>
      <section className="relative z-10 mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-ink-800/70 p-5">
            <f.icon className="mb-3 h-5 w-5 text-neon" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
