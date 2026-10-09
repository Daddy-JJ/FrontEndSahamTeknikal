# Plan: bahasa visual terminal untuk seluruh website

Tanggal: 2026-10-09 WIB. Status: IMPLEMENTED AND LOCALLY VERIFIED; commit/push/deployment acceptance pending. Permintaan owner: pertahankan arah visual landing/Scanner yang disukai, lalu terapkan secara konsisten ke seluruh halaman, tab dan state. Ini kelanjutan desain aplikasi sendiri yang terinspirasi terminal finansial; tidak memakai merek atau aset Bloomberg.

## Hasil yang dituju

Satu bahasa visual: latar gelap, informasi padat tetapi terbaca, angka sejajar, status jelas, navigasi ringkas, dan detail lengkap tersedia saat diperlukan. Konsisten berarti token, komponen dan perilaku interaksi yang sama; kepadatan halaman mengikuti tugasnya. Form entry/fill tetap memiliki ruang yang cukup untuk menghindari kesalahan input.

Ruang lingkup frontend. Rute, URL filter, autentikasi/RLS, RPC, ledger/CSV, rumus statistik, data mode, strategi, entry/exit dan histori tidak berubah. Tidak ada migrasi database, provider, framework atau dependency baru yang diperlukan untuk rencana ini. Jika ditemukan kebutuhan perubahan kontrak, pisahkan dan dokumentasikan sebelum implementasi.

## Inventaris halaman dan arah layout

| Halaman / tab / state | Penerapan visual dan UX |
| --- | --- |
| `/` live dan `/scanner`; Sinyal / Quality, filter, pagination, detail | Menjadi referensi. Pertahankan ringkasan run, batas 25 baris, RS/coverage, pane/drawer dan audit; konsistenkan token saat fondasi dibagikan. |
| `/journal` aktual | Toolbar filter ringkas, status dan daftar padat. Draft, entry/fill, koreksi, stop, catatan dan tag memakai field/action seragam. |
| `/journal?tab=paper`; Fixed 2R / SMA10 | Ringkasan dan daftar memakai visual sama, dengan label PAPER dan eksperimen terpisah; pending/open/closed/skipped/expired/hold/ambigu tetap dibedakan. |
| `/journal/[id]` aktual | Header ticker/status, ringkasan posisi/ledger, form tindakan, lalu riwayat; audit tambahan dapat diperluas. Tindakan finansial tetap membutuhkan konfirmasi yang sudah berlaku. |
| `/journal/paper/[id]` | Ringkasan entry/SL/lot/risiko/exit/fee/P&L lebih padat; event timeline dan snapshot konfigurasi dapat dibuka. Basis initial risk dan planned loss tetap terpisah. |
| `/analytics`; `tab=actual`, `paper`, `signals` | Tab dan filter sejajar, lalu KPI > kurva > matriks > rincian. Panel kosong ringkas. Closed-P&L tetap berlabel, bukan equity mark-to-market. Observasi 5/10 sesi tidak memicu exit. |
| `/journal/export` | Filter/cohort, ringkasan jumlah, batas halaman dan tombol unduh memakai toolbar/panel seragam. Format CSV dan cursor tetap. |
| `/operations` | Ringkasan kesehatan, run terbaru, coverage/freshness dan audit diagnostik; kegagalan provider dan paper tidak menjadi status sukses. |
| `/auth/check` | Status sesi/owner/mode dengan komponen status yang sama; logout dan probe development tetap mengikuti pembatasan yang ada. |
| `/login`, `/auth/error`, konfigurasi belum siap | Tema sama dengan form satu kolom yang terfokus. Copy penyebab/kembali/coba lagi tetap jelas; tidak perlu tabel atau kepadatan Scanner. |
| Global `loading.tsx`, `error.tsx`, 404 dan seluruh state kosong/ditolak/invalid | Shell, skeleton, alert dan aksi pemulihan seragam, tanpa menampilkan error sebagai no-signal atau data kosong berhasil. Tambahkan halaman 404 khusus bila dibutuhkan, tetap dengan status HTTP yang benar. |
| `/` fixture-only Workspace: Ringkasan, Scanner, Jurnal Paper/Aktual, Analitik, Operasional; modal/chart/preview development | Gunakan token bersama secara bertahap, pertahankan command palette, preview status, penanda fixture yang mencolok dan isolasi preview. Tidak mengaktifkan preview di produksi. |
| `/auth/callback`, `/api/export/journal` dan route handlers | Tidak memiliki tampilan halaman untuk di-theme. Pertahankan redirect, payload, header, cookie dan status HTTP; hanya halaman tujuan/error yang mengikuti tema. |

## Fondasi visual dan interaksi

- Warna dasar mengikuti Scanner: canvas `#0b1015`, panel `#111922`, batas `#293644`, teks `#dce4ed`, teks sekunder `#9aaaba`; cyan untuk aksi/fokus, amber untuk peringatan, hijau untuk hasil positif dan merah untuk kegagalan/hasil negatif. Status selalu memiliki teks, bukan warna saja. Validasi kontras sebelum menjadi token final.
- Font sistem sans-serif untuk UI; monospace/tabular numerals untuk angka, ticker dan ID. Body 13-14 px, isi tabel 12-13 px, teks sekunder minimal 11 px pada desktop; field mobile 16 px untuk keterbacaan dan menghindari auto-zoom. Nilai IDR/desimal tidak dipotong atau dibulatkan ulang untuk mengejar layout.
- Spacing skala 4/8/12/16/24 px, garis tipis, sudut kecil, tanpa hero besar atau bayangan dekoratif. Header aplikasi desktop sekitar 48 px; baris tabel 34-36 px untuk pointer presisi, target sentuh minimal 44 px.
- Header halaman ringkas: judul, status data/cohort, timestamp, aksi utama. Filter dan tab dekat konten yang dipengaruhi. Navigasi utama: Scanner, Jurnal, Analytics, Operasi, Akun; aktual/paper menjadi tab yang jelas di Jurnal.
- Pilihan tab/eksperimen/filter menggunakan URL yang sudah ada agar refresh, back dan deep-link tetap benar. Pemilihan rincian tidak menambah pembacaan data bila snapshot sudah tersedia. Audit panjang dibuka on-demand; informasi risiko dan hasil utama tetap terlihat.
- Desktop lebar dapat memakai pane rincian; tablet/mobile memakai dialog/drawer yang benar-benar modal, keyboard terperangkap, Escape/Tutup mengembalikan fokus. Tabel lebar hanya menggeser horizontal di dalam region matriks; halaman tidak overflow. Form di mobile satu kolom.
- Statistik tanpa sampel tetap `null`/dash dengan denominator. Scanner coverage terpisah dari kelengkapan jurnal/observasi. PAPER/AKTUAL/FIXTURE dan status stale/missing/partial/failed tetap eksplisit. Jangan menambahkan label LIVE yang menyiratkan harga real-time.

## Tahapan Action / Proof

### 1. Baseline dan inventaris state

Action: inventaris seluruh rute di atas, komponen bersama dan selector browser tests. Simpan screenshot baseline desktop 1366x768 dan mobile 390x844 untuk state normal, loading, empty, error, invalid, forbidden, partial, stale dan fixture. Bedakan screenshot lokal sintetis dari owner produksi.
Proof: checklist route/tab/state tanpa halaman terlewat; jumlah query serta alur autentikasi/form/export tercatat sebelum perubahan. Tidak memindahkan Server Components ke client hanya untuk styling.

### 2. Token dan komponen bersama

Action: generalisasikan tema opt-in `JournalShell` dari referensi Scanner; ekstrak token CSS dan primitive seperlunya untuk page header, toolbar, panel, tabs, badge, metric, table, field, alert serta dialog. Gunakan komponen yang sudah ada; jangan memaksa semua layar masuk ke satu komponen besar. Halaman yang dimigrasikan memakai tema lengkap pada seluruh state-nya.
Proof: halaman referensi tetap lolos geometry/focus/query tests; token punya contoh semua status, kontras WCAG AA, focus-visible, reduced-motion dan HTML semantik. Tidak ada selector global yang mengubah halaman belum dimigrasikan tanpa sengaja.

### 3. Jurnal paper dan aktual + rincian + ekspor

Action: migrasikan daftar dan detail paper dahulu, lalu aktual beserta semua form dan ekspor. Gunakan ringkasan padat dan disclosure audit; pertahankan nilai finansial dan urutan tindakan penting. Untuk daftar sempit, gunakan kartu berlabel dan uang utuh sesuai pola yang sudah terbukti.
Proof: manual fills/koreksi/stop/catatan/tag, invalid input, double submit, CAS/idempotency feedback, CSV, filter periode exit, drill-down, refresh dan back tetap lulus. Angka tidak overflow pada 320/390/901/1100/1101/1200/1280/1440 px. Tidak ada mutasi karena sekadar membuka rincian.

### 4. Analytics semua tab

Action: terapkan KPI ringkas (sekitar 64-88 px), kurva sekitar 180-240 px saat ada data, matriks dan rincian. Empty chart memakai state pendek, tidak menyisakan panel besar kosong. Pertahankan urutan ringkasan > kurva > matriks > rincian dan navigasi strategi ke transaksi sumber.
Proof: actual/paper/observasi terpisah; kedua exit tidak dijumlahkan; denominator/null/ambigu/data-hold/sensitivitas tetap benar. Filter exit berbeda dari filter tanggal sinyal. Tampilan hanya memformat hasil canonical; tidak ada perhitungan P&L baru atau tambahan RPC untuk dekorasi.

### 5. Operasi, akun, auth dan halaman sistem

Action: migrasikan operasi/akun, lalu login/auth error/loading/error/404/configuration dan fixture preview. Gunakan status/action yang sama dengan tingkat kepadatan sesuai tugas. Pertahankan isolasi development probe dan fixture.
Proof: owner/outsider/unauthenticated/session expiry, login/logout/error recovery, no-configuration, missing/stale/partial/failed dan error retry lulus. Cookie, callback, redirect, HTTP status dan guard data mode tidak berubah. Tidak ada data owner atau credential pada shell publik.

### 6. Audit konsistensi dan performa

Action: periksa seluruh navigasi dan state lintas halaman, responsive 320-1440 px, zoom 200%, keyboard, contrast, reduced-motion, breakpoint tengah dan token uang terpanjang. Rapikan style lama hanya setelah semua pemakai bermigrasi. Bandingkan request/query dan perpindahan halaman dengan baseline.
Proof: unit boundary, journal/scanner/reporting/workspace browser suites, typecheck, lint dan build PASS. Tidak ada hydration error, halaman overflow, fokus hilang, full-page flash tema lama, request baru yang tidak perlu, atau regresi autentikasi. Ukur performa; jangan menyimpulkan lebih cepat hanya dari layout lebih padat.

### 7. Rilis bertahap dan acceptance

Action: kelompokkan rilis per fase yang sudah lengkap; pertahankan jalur rollback ke release sebelumnya. Catat SHA dan deployment yang benar-benar terpasang, lakukan smoke publik serta verifikasi owner pada rute/tab/state yang berubah. Commit/push/deploy mengikuti otorisasi yang berlaku pada pekerjaan implementasi berikutnya.
Proof: exact-SHA deployment sukses, kontrak backend tetap kompatibel, visual/interaction desktop dan mobile diverifikasi dengan label bukti yang jelas. Jika akses owner produksi belum tersedia, statusnya NOT VERIFIED. Masalah kualitas feed scanner yang terpisah tetap tercatat dan tidak ditutupi oleh perubahan visual.

## Definition of done

Seluruh rute dan tab menggunakan token/komponen konsisten; state sistem sama lengkapnya dengan happy path; informasi utama mudah dipindai tanpa ruang kosong berlebihan; mobile/keyboard dapat dipakai; tidak ada regresi ledger, statistik, timing, auth, RLS, CSV atau fixture isolation; bukti lokal dan produksi dibedakan. Plan ini tidak mengimplementasikan perubahan UI tambahan.


## Implementasi dan bukti lokal - 2026-10-09 WIB

Action: terapkan shell JournalShell dan token terminal pada halaman journal, analytics seluruh tab, operations, account/auth, loading/error/404, serta Workspace fixture; pertahankan API, auth, query, data, ledger, statistik, dan aturan trading. Gunakan kartu transaksi hingga lebar 1300 px agar kolom tidak memotong nilai IDR.
Proof: unit 30/30; Playwright reporting 27/27, scanner 66/66, Workspace/auth 21/21; journal 60/60; typecheck, lint, git diff --check, build produksi PASS. Uji currency boundary pada 1440/1280/1200/1101/1100/901/390/320 px. Suite lokal memakai fixtures/doubles dan tidak membuktikan interaksi owner hosted. Tidak ada perubahan backend/dependency.

Action: commit ke main, push origin dan verifikasi deploy Vercel untuk SHA baru; smoke publik serta owner jika sesi login tersedia.
Proof: RELEASE PENDING sampai receipt remote dan verifikasi live dicatat. Rollback hanya jika smoke release gagal; jangan campur kegagalan feed scanner dengan perubahan visual.
