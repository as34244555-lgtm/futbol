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

## Kalıcı site (Vercel)

Adres: [https://futbol-ashen.vercel.app](https://futbol-ashen.vercel.app)

Repo Vercel projesine bağlı: [agelistirici/futbol](https://vercel.com/agelistirici/futbol).

İki cihazın **aynı para, puan ve transferi** görmesi için Vercel’de ücretsiz KV (Upstash Redis) gerekir. Yoksa her sunucu örneği ayrı lig tutar.

1. Vercel → proje **futbol** → **Storage** → **Create Database** → **KV**.
2. Projeye bağlayın (environment variables otomatik gelir: `KV_REST_API_URL`, `KV_REST_API_TOKEN`).
3. **Deployments** → son production → **Redeploy**.
4. İki telefonda da aynı oda kodunu kullanın (boşsa `NOVA`).

İsterseniz kendi alan adınızı [Domains](https://vercel.com/agelistirici/futbol/settings/domains) ile ekleyin. `AUTH_SECRET` = uzun rastgele metin.

Supabase hâlâ isteğe bağlı alternatif: `supabase/schema.sql` + `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.

## API

- `GET /api/league` — paylaşılan anlık görüntü + çevrimiçi menajerler
- `POST /api/auth/register` `{ username, password, teamName }`
- `POST /api/auth/login` `{ username, password }`
- `POST /api/auth/logout`
- `POST /api/league/action` — kadro, taktik, transfer, maç
- `POST /api/simulate-match` — saf simülasyon motoru
- `POST /api/import-database` — JSON/CSV doğrulama
