# Liga Nova — Futbol Menajerlik ve Transfer Oyunu

Telifsiz, istatistik tabanlı, 2D canlı saha simülasyonlu futbol menajerlik oyunu.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Lucide · Vercel-uyumlu
- **Veri:** Supabase PostgreSQL şeması hazır; yerel demo tarayıcı kaydı ile çalışır
- **Lisans:** Kurgusal oyuncu ve kulüp adları; ülkeler ve bayraklar kamuya açık veri

## Özellikler

- Menajer kariyeri, kulüp kurma, 10 AI rakip (Bosphorus FC, Anatolia United, …)
- 240+ kurgusal futbolcu kataloğu (KL / DEF / OS / FV)
- Formasyon (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2, 3-4-3) ve 5 oyun stili
- Transfer piyasası, enerji / form, lig puan tablosu
- Milisaniyelik maç motoru + 2D saha animasyonu ve canlı anlatım
- Community JSON/CSV içe aktarma (`/import`, `POST /api/import-database`)

## Geliştirme

```bash
npm install
cp .env.example .env.local   # isteğe bağlı — Supabase
npm run dev
```

Aç: [http://localhost:3000](http://localhost:3000)

## Supabase

1. `supabase/schema.sql` dosyasını SQL Editor’de çalıştırın.
2. `.env.local` içine proje URL ve anon key yazın.
3. Demo kayıt şu an `localStorage` (`futbol-save-v1`) üzerindedir; şema 7 tablo + RLS ile buluta taşınacak şekilde tasarlandı.

İsteğe bağlı kolonlar (`nationality_code`, `week`, `kit_*`, lig istatistikleri) spec’teki 7 tabloyu bozmadan genişletir.

## API

- `POST /api/simulate-match` — 11’e 11 kadro alır, 90 dk olay zincirini üretir (Vercel serverless).
- `POST /api/import-database` — JSON veya CSV oyuncu kataloğu doğrular.

Örnek dosyalar: `public/samples/players.json`, `public/samples/players.csv`.
