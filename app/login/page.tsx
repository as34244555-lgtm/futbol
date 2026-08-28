"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";

export default function LoginPage() {
  const { login } = useGame();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Oturum</p>
      <h1 className="font-display mt-2 text-5xl">Giriş yap</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const err = await login(username, password);
          setBusy(false);
          if (err) setError(err);
          else router.push("/dashboard");
        }}
      >
        <label className="block text-sm">
          Menajer adı
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Şifre
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Giriş…" : "Giriş yap"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Yeni misiniz?{" "}
        <Link href="/play" className="text-neon">
          Lige katılın
        </Link>
      </p>
    </div>
  );
}
