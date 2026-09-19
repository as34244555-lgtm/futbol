"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useGame();
  const { t } = useI18n();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-5 py-10">
      <BrandLogo size={88} className="mb-6" showWord />
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("login.session")}</p>
      <h1 className="font-display mt-2 text-4xl sm:text-5xl">{t("login.title")}</h1>
      <form
        className="mt-8 space-y-4"
        autoComplete="off"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const err = await login(username, password, roomCode);
          setBusy(false);
          if (err) setError(err);
          else router.push("/dashboard");
        }}
      >
        <label className="block text-sm">
          {t("login.user")}
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            name="username"
            required
          />
        </label>
        <label className="block text-sm">
          {t("login.pass")}
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            name="password"
            required
          />
        </label>
        <label className="block text-sm">
          {t("login.room")}
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder={t("login.roomPh")}
            autoComplete="off"
            name="room"
          />
        </label>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? t("login.busy") : t("login.submit")}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        {t("login.new")}{" "}
        <Link href="/play" className="text-neon">
          {t("login.join")}
        </Link>
      </p>
    </div>
  );
}
