## Remediation release verified - 2026-10-10

Action: completed the authorized release after the backup/restore gate; applied the additive backend migration before the compatible frontend and verified the released runtime's recovery and retry behavior.
Proof: local checks recorded below passed. Production deployment, public HTTP/asset checks, hosted reporting contract validation, SQL-role access-denial checks and recovery idempotency were verified. Detailed operator receipts and financial reconciliation are intentionally retained locally and are not published in this repository.

Limits: authenticated owner-browser interaction, real outsider JWT and subsequent-session operational stability remain unverified. Continue monitoring scheduled sessions. Trading rules, historical configuration and the actual ledger remain preserved. Earlier local/historical evidence follows.

## Incident repair - implemented and verified locally (2026-10-10)

Approved G01-G17 remediation is implemented across both independent repositories. SQL011 adds economic/evaluation integrity, immutable job health, reporting eligibility and IDR/holding/paired metrics; frontend shares canonical exit filters and displays checkpoint/held-data/read errors honestly. Entry/exit rules, actual ledger/CSV and historical activation/config/book are preserved. See [PLAN.md](PLAN.md) for local proof and release gates. Commit/push, migration, deployment and production recovery remain pending separate release authorization; the current production incident has not been recovered by this local work.

# Compact Scanner terminal and independent coverage - 2026-10-08

Scanner routes `/` (live mode) and `/scanner` use a compact dark terminal workspace: run/session/coverage/RS summary, inline filters, bounded 25-row matrix, and a selected ticker pane or mobile dialog. Full diagnostics and source audit remain available on demand. Journal, analytics and authentication retain their existing shell. There are no new market-data queries, canonical calculations or dependencies.

Reporting accepts additive `scanner_coverage` from backend SQL010 and displays it separately from journal/observation coverage. SQL009 responses remain compatible, with unavailable scanner metadata labelled explicitly. Actual reporting never uses scanner coverage. Currency tokens remain unbroken in responsive trade rows.

Local browser previews use labelled synthetic HTTP fixtures; they do not prove owner-authenticated production behavior. Current release verification and remote receipts are recorded in `PLAN.md`. Earlier implementation notes follow.

---

# Journal reporting v1 — 2026-10-08

The owner-only frontend now reads persistent paper and actual reporting through `read_trade_reporting_v1`, signal observations through `read_signal_evaluation_v1`, and paper audit details through `read_paper_trade_v1`. Backend migration `202610080009_persistent_paper_reporting.sql` must precede this frontend release. No schema fallback or fixture substitution is used when the contract is unavailable.

Routes: `/analytics?tab=paper|actual|signals`, `/journal?tab=paper&exit_key=fixed2r|ma10`, and `/journal/paper/[id]`. Paper exit experiments stay separate; journal cohorts use exit sessions, signal cohorts use signal sessions. The 5/10-session observations never trigger exits. SMA10 requires confirmed close below SMA10 and then exits next-open; the initial technical SL remains active. Existing actual fill forms and CSV contract are unchanged.

Checks: `npm.cmd run test:unit`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test:reporting`, and the existing journal/scanner suites. Reporting browser tests use local synthetic HTTP doubles only. Remote migration, authenticated hosted integration and deployment remain NOT VERIFIED in this implementation.

---

# FrontEndSahamTeknikal

Next.js frontend untuk IDX Night Scanner. Vercel dapat deploy repository ini dengan root directory `.` karena package.json dan next.config.ts berada di root.

## Lokal

Runtime Node.js 22.23.2 dan npm 12.0.2.

```powershell
npm.cmd ci
npm.cmd run dev
```

Buka http://localhost:3050. DATA_MODE=fixture dengan izin preview eksplisit menampilkan snapshot sintetis berlabel; angka demo bukan harga pasar maupun anggota KOMPAS100. DATA_MODE=live memakai scanner owner/RLS tanpa fallback fixture. Konfigurasi, data yang belum tersedia, kegagalan dan coverage parsial ditampilkan terpisah.

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

## Status koreksi frontend — 2026-10-04

Perubahan audit masih lokal dan belum dirilis. Jurnal aktual memakai ledger/RPC
backend, termasuk partial realized P&L. Analytics memvalidasi response dan exact
cohort exit Asia/Jakarta; filter penuh dipertahankan pada CSV. Kurva R dan
atribusi strategi belum memiliki canonical read model dan tidak dihitung ulang
oleh frontend. Export tetap closed, 200 baris per halaman dan seluruh cursor.

Paper fixture hanya tersedia pada mode fixture yang diizinkan. Paper live belum
terhubung ke persistence backend dan tidak memakai demo. Detail scanner memakai
snapshot immutable/rules/provenance yang tersedia, membedakan pivot dan available
session, mempertahankan hold RS dan menyatakan next-open belum diketahui.
Filter tanggal/strategi dan halaman terikat run dibatasi. Draft terkait signal
memerlukan konfirmasi stop dan owner/context validation; tidak membuat fill.
/operations hanya membuka GitHub Actions milik owner, tanpa PAT atau dispatch.

Tes browser default tidak mencakup jurnal/scanner; jalankan dua dedicated suite.
Semua suite otomatis memakai HTTP double lokal, bukan bukti hosted production.
test:scanner:release membangun dist test terpisah dengan key/URL lokal sintetis
dan menguji Next production server tanpa mengganti file environment.
Lihat docs/FRONTEND_REMEDIATION_REPORT_20261004.md dan
 docs/BACKEND_REMEDIATION_HANDOFF_20261004.md untuk batas fitur dan urutan rilis.
Full MVP dan acceptance pada exact Vercel release masih terbuka; hasil deployment
lama tidak mengesahkan perubahan lokal ini. Commit/push/deploy memerlukan izin.

## Kontrak backend

Backend API, scanner Python, schema kontrak, migrasi Supabase, dan dokumentasi aturan trading dipelihara di:
https://github.com/Daddy-JJ/BackendSahamTeknikal

Dashboard fixture di `src/generated/demo.json` adalah snapshot turunan scanner Python. Jika snapshot/schema berubah, sinkronkan perubahan dari backend secara terkontrol. Jangan membuat kalkulasi sinyal atau metrik resmi terpisah di frontend.

## Login GitHub untuk aplikasi (development)

Login GitHub ke Dashboard Supabase tidak otomatis menjadi login aplikasi. Alur aplikasi di /login memakai Supabase Auth PKCE; /auth/callback menyimpan sesi pada cookie; /auth/check memverifikasi pengguna dan tabel app_members lewat RLS. Halaman terakhir memverifikasi identitas Auth dan owner enabled pada environment aktif. Dashboard fixture di / tetap demo; /scanner membaca run forward lewat owner/RLS, dan / live memakai adapter yang sama tanpa fallback demo.

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
