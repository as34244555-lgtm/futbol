# Liga Nova — Çoklu oyunculu futbol menajerliği

Telifsiz, istatistik tabanlı, 2D canlı saha simülasyonlu **çoklu oyuncu** ligi.
Vercel serverless API + (üretimde) Supabase paylaşılan durum.

## Nasıl çalışır?

- Tüm menajerler **aynı lige** girer (transfer pazarı, fikstür, puan durumu ortak).
- Kayıt/giriş httpOnly oturum çerezi ile yapılır.
- Maç ve transfer `POST /api/league/action` üzerinden Vercel fonksiyonunda atomik işlenir.
- İnsan vs insan: ligde bekleyen başka gerçek menajer varsa onunla eşleşirsiniz; yoksa bot menajerle oynarsınız.
- 18 bot kulüp pazarı ve fikstürü doldurur (her bot ~6 satış ilanı).
- Hafta, tüm insan maçları bitince kapanır; kalan bot–bot maçları o an çözülür.

## Yerel geliştirme

```bash
npm install
npm run dev
```

İki tarayıcı / gizli pencere açın:

1. `http://localhost:3000/play` — menajer A
2. `http://localhost:3000/play` — menajer B

Lig dosyası: `data/league.json` (git’e girmez).

## Vercel dağıtımı

1. Repo’yu Vercel’e bağlayın (framework: Next.js).
2. Supabase SQL Editor’de `supabase/schema.sql` çalıştırın.
3. Vercel Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
```

Service role anahtarı yalnızca sunucu fonksiyonlarında kullanılır. `AUTH_SECRET` oturum imzasıdır.

Supabase yoksa Vercel instance belleği kullanılır; bu, soğuk başlangıçta ligi sıfırlar. Üretim çoklu oyuncu için Supabase zorunludur.

## API

- `GET /api/league` — paylaşılan anlık görüntü + çevrimiçi menajerler
- `POST /api/auth/register` `{ username, password, teamName }`
- `POST /api/auth/login` `{ username, password }`
- `POST /api/auth/logout`
- `POST /api/league/action` — kadro, taktik, transfer, maç
- `POST /api/simulate-match` — saf simülasyon motoru
- `POST /api/import-database` — JSON/CSV doğrulama
