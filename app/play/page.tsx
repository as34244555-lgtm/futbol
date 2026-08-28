"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/game-context";

export default function PlayPage() {
  const { register } = useGame();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Paylaşılan lig</p>
      <h1 className="font-display mt-2 text-5xl">Lige katıl</h1>
      <p className="mt-3 text-slate-400">
        Aynı sunucudaki diğer menajerlerle transfer ve maç yaparsınız. Gerçek oyuncu yoksa bot menajerlerle
        oynarsınız; ikinci insan girince onunla eşleşirsiniz.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const err = await register(username, password, teamName);
          setBusy(false);
          if (err) setError(err);
          else router.push("/dashboard");
        }}
      >
        <Field label="Menajer adı" value={username} onChange={setUsername} placeholder="ör. Deniz" />
        <Field label="Şifre" value={password} onChange={setPassword} placeholder="en az 4 karakter" type="password" />
        <Field label="Takım adı" value={teamName} onChange={setTeamName} placeholder="ör. Pera FC" />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Katılıyor…" : "Lige katıl"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Zaten kulübünüz var mı?{" "}
        <Link href="/login" className="text-neon">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
    </label>
  );
}
