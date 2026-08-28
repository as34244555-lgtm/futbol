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

GitHub reposu zaten Vercel projesine bağlı: [agelistirici/futbol](https://vercel.com/agelistirici/futbol).

Kalıcı adres (GitHub homepage): [https://futbol-ashen.vercel.app](https://futbol-ashen.vercel.app)

`main` hâlâ boş starter olduğu için production şu an oyunu göstermiyor. Bu PR merge edilince Liga Nova o adrese gelir; sonraki `main` push’ları otomatik yayınlanır.

1. Bu PR’yi GitHub’da **Merge** edin: https://github.com/as34244555-lgtm/futbol/pull/1
2. Vercel → [Deployment Protection](https://vercel.com/agelistirici/futbol/settings/deployment-protection) — Production korumasını kapatın. Açıksa site Vercel girişi ister, herkese açık olmaz.
3. Vercel → [Domains](https://vercel.com/agelistirici/futbol/settings/domains) — `futbol-ashen.vercel.app` (veya kendi alan adınız) Production’a bağlı olsun.
4. Environment Variable: `AUTH_SECRET` = uzun rastgele metin (oturum çerezi).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https://github.com/as34244555-lgtm/futbol)

Arkadaşlarınla **aynı ligin kaybolmaması** için ücretsiz [Supabase](https://supabase.com) projesi açıp `supabase/schema.sql` çalıştırın ve Vercel’e ekleyin: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Supabase yoksa site kalıcıdır ama lig soğuk başlangıçta sıfırlanabilir.

## API

- `GET /api/league` — paylaşılan anlık görüntü + çevrimiçi menajerler
- `POST /api/auth/register` `{ username, password, teamName }`
- `POST /api/auth/login` `{ username, password }`
- `POST /api/auth/logout`
- `POST /api/league/action` — kadro, taktik, transfer, maç
- `POST /api/simulate-match` — saf simülasyon motoru
- `POST /api/import-database` — JSON/CSV doğrulama
