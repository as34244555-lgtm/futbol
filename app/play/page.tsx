"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Crest } from "@/components/Crest";
import { KitMark } from "@/components/KitMark";
import { useGame } from "@/lib/game-context";
import { HUMAN_KITS } from "@/lib/world";
import type { KitStyle } from "@/lib/types";
import { enableNotifications } from "@/lib/notify";

const PICKS = HUMAN_KITS.slice(0, 3);

export default function PlayPage() {
  const { register } = useGame();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [career, setCareer] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [kit, setKit] = useState<[string, string, KitStyle]>(PICKS[0]!);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">
        {step === 1 ? "Mod" : step === 2 ? "Kulüp" : "Forma"}
      </p>
      <h1 className="font-display mt-2 text-5xl">
        {step === 1 ? "Nasıl oynarsın?" : step === 2 ? "Menajer ol" : "Formanı seç"}
      </h1>

      {step === 1 && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => setCareer(true)}
            className={`w-full rounded-2xl border p-4 text-left ${career ? "border-neon bg-neon/10" : "border-white/10 bg-ink-800"}`}
          >
            <p className="font-semibold">Tek kişilik kariyer</p>
            <p className="mt-1 text-sm text-slate-400">Kendi odan, 18 bot, istediğin zaman dur. Mağaza hissi.</p>
          </button>
          <button
            type="button"
            onClick={() => setCareer(false)}
            className={`w-full rounded-2xl border p-4 text-left ${!career ? "border-neon bg-neon/10" : "border-white/10 bg-ink-800"}`}
          >
            <p className="font-semibold">Arkadaş ligi</p>
            <p className="mt-1 text-sm text-slate-400">Aynı oda kodunu paylaşın. İnsan-insan maç aynı skorla izlenir.</p>
          </button>
          <Button size="lg" className="w-full" onClick={() => setStep(2)}>
            Devam
          </Button>
        </div>
      )}

      {step === 2 && (
        <form
          className="mt-8 space-y-4"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(3);
          }}
        >
          <Field label="Menajer adı" value={username} onChange={setUsername} placeholder="ör. Deniz" />
          <Field label="Şifre" value={password} onChange={setPassword} placeholder="en az 4 karakter" type="password" />
          <Field label="Takım adı" value={teamName} onChange={setTeamName} placeholder="ör. Pera FC" />
          {!career && (
            <Field
              label="Arkadaş odası (isteğe bağlı)"
              value={roomCode}
              onChange={setRoomCode}
              placeholder="ör. K4M7PX — boşsa NOVA"
              required={false}
            />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Geri
            </Button>
            <Button type="submit" className="flex-1">
              Formayı seç
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="mt-8 space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-800 p-4">
            <Crest name={teamName || "Liga Nova"} primary={kit[0]} secondary={kit[1]} size={56} />
            <div>
              <p className="font-display text-2xl">{teamName || "Kulüp"}</p>
              <p className="text-sm text-slate-400">Arma isminden üretilir. Abdullah pazarda satılık — kadroda değil.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PICKS.map((k) => (
              <button
                key={k[0]}
                type="button"
                onClick={() => setKit(k)}
                className={`rounded-2xl border p-3 ${kit[0] === k[0] ? "border-neon bg-neon/10" : "border-white/10 bg-ink-800"}`}
              >
                <KitMark primary={k[0]} secondary={k[1]} style={k[2]} size={48} />
                <p className="mt-2 text-[10px] uppercase text-slate-400">{k[2]}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Geri
            </Button>
            <Button
              className="flex-1"
              size="lg"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                void enableNotifications();
                const err = await register(username, password, teamName, career ? "" : roomCode, {
                  career,
                  kit_primary: kit[0],
                  kit_secondary: kit[1],
                  kit_style: kit[2],
                });
                setBusy(false);
                if (err) setError(err);
                else router.push("/dashboard");
              }}
            >
              {busy ? "Kuruluyor…" : "Lige katıl"}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-slate-500">
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-neon focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </label>
  );
}
