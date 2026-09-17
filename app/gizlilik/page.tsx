import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-300">
      <h1 className="font-display text-4xl text-white">Gizlilik</h1>
      <p className="mt-4 text-sm leading-relaxed">
        Liga Nova menajer adı, şifre özeti ve kulüp kaydını lig odasında saklar. Reklam veya üçüncü taraf analitik
        yoktur. Bildirim izni yalnızca rakip hazır olduğunda cihazınızda uyarı göstermek içindir; sunucuya push anahtarı
        gönderilmez. Veriyi silmek için çıkış yapıp odayı bırakın veya işletmeciye yazın.
      </p>
      <p className="mt-4 text-sm">
        <Link className="text-neon" href="/">
          Ana sayfa
        </Link>
      </p>
    </main>
  );
}
