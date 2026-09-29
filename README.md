# FrontEndSahamTeknikal

Next.js frontend untuk IDX Night Scanner. Vercel dapat deploy repository ini dengan root directory `.` karena package.json dan next.config.ts berada di root.

## Lokal

Runtime Node.js 22.23.2 dan npm 12.0.2.

```powershell
npm.cmd ci
npm.cmd run dev
```

Buka http://localhost:3050. Dashboard saat ini menampilkan snapshot **fixture** sintetis. Angka demo bukan harga pasar maupun anggota KOMPAS100. Production build default menampilkan status koneksi live belum diatur dan tidak mengganti feed live dengan data demo.

Variabel development dicontohkan di `.env.example`. Jangan commit `.env.local`. Kunci Supabase yang diawali `NEXT_PUBLIC_` hanya untuk URL proyek dan publishable key; jangan pernah menaruh secret key, EODHD key, atau service role key di frontend.

## Perintah

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Kontrak backend

Backend API, scanner Python, schema kontrak, migrasi Supabase, dan dokumentasi aturan trading dipelihara di:
https://github.com/Daddy-JJ/BackendSahamTeknikal

Dashboard fixture di `src/generated/demo.json` adalah snapshot turunan scanner Python. Jika snapshot/schema berubah, sinkronkan perubahan dari backend secara terkontrol. Jangan membuat kalkulasi sinyal atau metrik resmi terpisah di frontend.

## Login GitHub untuk aplikasi (development)

Login GitHub ke Dashboard Supabase tidak otomatis menjadi login aplikasi. Alur aplikasi di /login memakai Supabase Auth PKCE; /auth/callback menyimpan sesi pada cookie; /auth/check memverifikasi pengguna dan tabel app_members lewat RLS. Halaman terakhir hanya membaca jumlah run/sinyal namespace fixture development. Dashboard fixture di / tetap demo, dan dashboard live belum terhubung ke data scan.

Siapkan provider di proyek DEVELOPMENT vgmkpsestahkfahzdtae:

1. Buat GitHub OAuth App di GitHub Developer Settings → OAuth Apps. Untuk pengujian lokal, isi Homepage URL http://localhost:3050 dan Authorization callback URL https://vgmkpsestahkfahzdtae.supabase.co/auth/v1/callback. Callback GitHub menuju Supabase, bukan langsung ke Next.js.
2. Di Supabase development → Authentication → Sign In / Providers → GitHub, aktifkan provider lalu isi Client ID dan Client Secret langsung di Dashboard. Jangan tempel secret di chat atau repository.
3. Di Authentication → URL Configuration, set Site URL http://localhost:3050 dan tambahkan Redirect URLs http://localhost:3050/auth/callback serta http://127.0.0.1:3050/auth/callback.
4. Pastikan file lokal yang diabaikan Git, .env.development.local, berisi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY untuk development. Jalankan npm.cmd run dev, lalu buka http://localhost:3050/login.
5. Setelah GitHub login, halaman /auth/check menampilkan UID Auth aplikasi. Jika UID itu berbeda dari owner development yang ada di app_members, akses tetap ditolak sampai keanggotaan diperbarui secara terkontrol. Jangan menganggap email yang sama selalu menautkan identitas otomatis.

Production Supabase tidak digunakan untuk pengujian OAuth/fixture ini. Jangan menggunakan Dashboard Personal Access Token atau secret key sebagai token login aplikasi. Bukti owner RLS baca telah diperoleh lewat login nyata dan halaman /auth/check. Uji owner action pada fixture development juga berhasil: satu watchlist revisi 1, satu request idempotensi, satu audit event, dan dua sinyal fixture tetap. Tombol tidak muncul pada production atau akun non-owner, dan tidak membuat trade/fill. Pengujian ini tidak membuktikan scanner live maupun jurnal transaksi.

## Vercel production status

Frontend is deployed at https://sahamteknikal.vercel.app/ from this
repository. A read-only HTTP check on 2026-09-29 returned 200 for both /
and /login. At that check, the Vercel environment lacked the app's
Supabase URL/publishable key, and no live scanner data was connected.
The production shell now uses a neutral unavailable state and hides
the login button until the public Auth configuration is present.

For future production setup, configure these Vercel Environment Variables
for Production, using values from the production Supabase project only:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- DATA_MODE=live

Do not set ALLOW_FIXTURE_PREVIEW in Production. Do not place Supabase secret
key, EODHD token, or GitHub OAuth Client Secret in this frontend project.
Production GitHub provider and redirect URLs require separate verification,
followed by a fresh Vercel deployment and owner-login check. This shell is
not a live scanner release.


## Development market revision access check

On localhost:3050/auth/check, an authenticated owner on the allowlisted dev
project in fixture mode gets a read-only revision probe. It reads two receipts
under dev_market_revision_m2 and calls read_market_series with the user's JWT.
Success shows "2 revisi fixture terbaca melalui RPC owner". The owner confirmed
this result on 2026-09-29. Missing/error states remain explicit; production does
not invoke the dev probe. No privileged key or copied JWT is needed.
