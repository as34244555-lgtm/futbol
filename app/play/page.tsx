"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";

export default function PlayPage() {
  const { newGame } = useGame();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [teamName, setTeamName] = useState("");

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Yeni kariyer</p>
      <h1 className="font-display mt-2 text-5xl">Kulübünü adı koy</h1>
      <p className="mt-3 text-slate-400">
        Demo modunda kayıt tarayıcıda tutulur. Supabase anahtarları eklendiğinde aynı şema buluta bağlanır.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!username.trim() || !teamName.trim()) return;
          newGame(username, teamName);
          router.push("/dashboard");
        }}
      >
        <label className="block text-sm">
          Menajer adı
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ör. Deniz"
            required
          />
        </label>
        <label className="block text-sm">
          Takım adı
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="ör. Bosphorus FC"
            required
          />
        </label>
        <Button type="submit" size="lg" className="w-full">
          Sahaya çık
        </Button>
      </form>
    </div>
  );
}
