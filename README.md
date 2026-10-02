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
npm.cmd run test:unit
npm.cmd run test:journal
npm.cmd run test:scanner
npm.cmd run build
```

## Kontrak backend

Backend API, scanner Python, schema kontrak, migrasi Supabase, dan dokumentasi aturan trading dipelihara di:
https://github.com/Daddy-JJ/BackendSahamTeknikal

Dashboard fixture di `src/generated/demo.json` adalah snapshot turunan scanner Python. Jika snapshot/schema berubah, sinkronkan perubahan dari backend secara terkontrol. Jangan membuat kalkulasi sinyal atau metrik resmi terpisah di frontend.

## Login GitHub untuk aplikasi (development)

Login GitHub ke Dashboard Supabase tidak otomatis menjadi login aplikasi. Alur aplikasi di /login memakai Supabase Auth PKCE; /auth/callback menyimpan sesi pada cookie; /auth/check memverifikasi pengguna dan tabel app_members lewat RLS. Halaman terakhir hanya membaca jumlah run/sinyal namespace fixture development. Dashboard fixture di / tetap demo; /scanner membaca run forward lewat owner/RLS, dan / live memakai adapter yang sama tanpa fallback demo.

Siapkan provider di proyek DEVELOPMENT vgmkpsestahkfahzdtae:

1. Buat GitHub OAuth App di GitHub Developer Settings → OAuth Apps. Untuk pengujian lokal, isi Homepage URL http://localhost:3050 dan Authorization callback URL https://vgmkpsestahkfahzdtae.supabase.co/auth/v1/callback. Callback GitHub menuju Supabase, bukan langsung ke Next.js.
2. Di Supabase development → Authentication → Sign In / Providers → GitHub, aktifkan provider lalu isi Client ID dan Client Secret langsung di Dashboard. Jangan tempel secret di chat atau repository.
3. Di Authentication → URL Configuration, set Site URL http://localhost:3050 dan tambahkan Redirect URLs http://localhost:3050/auth/callback serta http://127.0.0.1:3050/auth/callback.
4. Pastikan file lokal yang diabaikan Git, .env.development.local, berisi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY untuk development. Jalankan npm.cmd run dev, lalu buka http://localhost:3050/login.
5. Setelah GitHub login, halaman /auth/check menampilkan UID Auth aplikasi. Jika UID itu berbeda dari owner development yang ada di app_members, akses tetap ditolak sampai keanggotaan diperbarui secara terkontrol. Jangan menganggap email yang sama selalu menautkan identitas otomatis.

Production Supabase tidak digunakan untuk pengujian OAuth/fixture ini. Jangan menggunakan Dashboard Personal Access Token atau secret key sebagai token login aplikasi. Bukti owner RLS baca telah diperoleh lewat login nyata dan halaman /auth/check. Uji owner action pada fixture development juga berhasil: satu watchlist revisi 1, satu request idempotensi, satu audit event, dan dua sinyal fixture tetap. Tombol tidak muncul pada production atau akun non-owner, dan tidak membuat trade/fill. Pengujian ini tidak membuktikan scanner live maupun jurnal transaksi.

## Vercel production status

Frontend shell is deployed at https://sahamteknikal.vercel.app/ from this
repository. A read-only HTTP check on 2026-10-01 returned 200 for both `/`
and `/login`. This proves shell availability only. At the earlier configuration
check, the Vercel environment lacked the app's
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

The concrete preparation sequence, environment matrix, Auth URLs, smoke checks,
and rollback evidence are in
[docs/VERCEL_DEPLOYMENT_CHECKLIST.md](docs/VERCEL_DEPLOYMENT_CHECKLIST.md).


## Development market revision access check

On localhost:3050/auth/check, an authenticated owner on the allowlisted dev
project in fixture mode gets a read-only revision probe. It reads two receipts
under dev_market_revision_m2 and calls read_market_series with the user's JWT.
Success shows "2 revisi fixture terbaca melalui RPC owner". The owner confirmed
this result on 2026-09-29. Missing/error states remain explicit; production does
not invoke the dev probe. No privileged key or copied JWT is needed.

## Actual journal dan analytics M4

`npm.cmd test` menjalankan smoke workspace/auth fixture terisolasi di loopback
3054 dengan output `.next-workspace-smoke`. Environment proses tes menimpa
konfigurasi lokal menggunakan URL loopback dummy dan key sintetis; suite ini
tidak memakai ulang server production lokal3050 atau membuktikan RLS hosted.
Suite jurnal tetap memakai server/test double terpisah3052/3053. Jangan memasukkan
JWT atau secret ke konfigurasi tes. `.env.local` development dan
`.env.production.local` pengguna tetap dipertahankan.

Route `/journal`, `/journal/[id]`, `/analytics`, dan `/journal/export` memakai
sesi owner; mode data Supabase harus cocok dengan `DATA_MODE` aplikasi. Mode
fixture hanya dapat dibuka saat preview fixture diizinkan. Ketidakcocokan mode
menutup pembacaan ledger dan ekspor sebelum RPC jurnal dipanggil.
`/api/export/journal` menggunakan RPC ekspor
migration 005, CSV canonical backend, dan cursor maksimal 200 trade per bagian.
Tidak ada perhitungan ledger atau metrik resmi kedua di browser.

Analytics dan CSV memakai filter snapshot exit yang sama persis untuk tiga
konfigurasi yang dibuat form frontend (fixed 2R, SMA10, manual). Daftar trade
menampilkan 100 per halaman; halaman lanjutan tidak menghitung ulang ringkasan
analytics. Fill, koreksi, stop, catatan, dan tag masing-masing
50 per halaman. Hanya jenis riwayat yang dipilih yang diminta pada setiap
navigasi. Halaman fill meminta satu koreksi terbaru per fill yang ditampilkan,
tanpa mengunduh seluruh riwayat. Urutan halaman fill mengikuti nomor
pencatatan; waktu di baris fill tetap waktu efektif setelah koreksi.

Backend menerapkan migration 005 dan migration 006 pada Supabase development
ber-mode fixture. Smoke frontend dengan login GitHub owner nyata pada 2026-09-30
dan retest konflik pada 2026-10-01 berhasil membuat
trade TEST, empat fill, finalisasi, partial exit, perubahan stop, dan koreksi fee.
CSV closed cocok dengan ledger: risk 1200, total fee 100, net 1000, R
0.833333333333. Replay request identik via sesi owner menghasilkan satu note dan
satu receipt. Setelah migration 006 memetakan konflik ke `PT412`/HTTP 412, smoke
dua tab owner menunjukkan request stale ditolak segera dengan pesan konflik,
tanpa note atau revision tambahan. Ekspor frontend fixture hanya satu closed
trade; backend telah membuktikan cursor 200+1 dalam transaksi development yang
di-rollback, tetapi alur unduh frontend multi-bagian belum teruji dengan dataset
persistent. Lihat status dan audit untuk batas bukti. Tidak ada data production
yang dipakai sebagai fixture atau bukti live.

Lihat [audit dan kontrak M4](docs/JOURNAL_AUDIT.md) serta
[hasil verifikasi frontend](IMPLEMENTATION_STATUS.md) untuk rincian perubahan,
perintah test, batas pengujian, dan langkah sesudah migrasi development.

Persiapan deployment terbaru tetap **NO-GO**. Lima probe Yahoo dan smoke Auth/HTTP
backend disposable lokal sudah lulus sesuai evidence backend, tetapi bukan
bukti scanner full-universe atau lifecycle production hosted. Homepage live
menampilkan persiapan bila belum ada run; adapter membaca hasil terbit melalui owner/RLS. Lihat
[checklist deployment](docs/VERCEL_DEPLOYMENT_CHECKLIST.md) untuk kontrak quality
skip/coverage/RS hold dan gates yang harus ditutup sebelum otorisasi terpisah.

Lihat [audit adapter scanner](docs/SCANNER_ADAPTER_AUDIT.md) untuk query terbatas,
Windows teardown, hasil tes dan batas freshness/hosted evidence. Server custom
hanya untuk tes; command development/production dan deployment Vercel tetap Next.js standar.
