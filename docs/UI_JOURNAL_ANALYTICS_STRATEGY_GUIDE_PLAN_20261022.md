# Plan gabungan UI Jurnal, Analytics, panduan Scanner dan overlay chart

Tanggal: 22 Oktober 2026. Status: **A/B/C/D selesai dan teruji lokal; belum commit/push/deploy**.
Scope frontend. B sudah selesai dan teruji lokal, belum commit/push/deploy.
Plan ini menggabungkan permintaan A/B/C/D; tidak mengaktifkan kembali pekerjaan historis.

## Hasil yang dituju

- **A - Jurnal/Analytics:** header, tab dan filter ringkas/konsisten; lebar layar digunakan;
  angka finansial mudah dibaca; kurva dan strategi berdampingan pada desktop; mobile nyaman.
- **B - Jurnal Paper:** ringkasan dan transaksi mendahului panel Pemrosesan yang paling bawah.
- **C - Scanner:** empat kartu aturan entry, SL awal dan exit, di bawah hasil Sinyal diterbitkan.
  Kartu merupakan panduan baseline V1, bukan sinyal baru atau status kelulusan ticker.
- **D - Overlay chart:** klik biasa pada tautan chart di daftar jurnal/reporting membuka chart
  di atas halaman asal, dengan konteks benar, penutupan aksesibel dan scroll yang tetap.

## A. Layout Jurnal dan Analytics

1. Satukan pola header ringkas, tab aktual/paper dan aksi Analytics/CSV. Pertahankan URL/query,
   submit GET, autentikasi, validasi dan return context. Jangan menambah request data.
2. Filter desktop mengalir dalam satu baris bila muat; wrap pada laptop/tablet. Pengaturan
   versi/snapshot tambahan boleh memakai disclosure berlabel, tetapi filter aktif tetap terlihat.
   Periode jurnal tetap periode exit; evaluasi sinyal tetap periode sinyal.
3. Gunakan lebar penuh khusus area reporting; hilangkan pembatas 900px yang tidak sesuai
   untuk filter dan ledger. Jangan melonggarkan form transaksi sensitif atau halaman Akun.
4. KPI dan status ringkas berada sebelum tabel. Angka memakai tabular numerals, rata kanan
   dan tidak terpecah di tengah nominal. Null, nol, positif dan negatif tetap dibedakan.
5. Tabel tetap tabel pada laptop; hindari perubahan otomatis menjadi kartu panjang pada 1300px.
   Horizontal scroll hanya dalam pembungkus tabel, tanpa body overflow. Header/kolom ticker
   dapat sticky dengan batas tinggi yang wajar; label dan keyboard focus tetap terlihat.
6. Analytics: KPI/status di atas, lalu kurva dan performa strategi dalam dua kolom pada
   layar cukup lebar; satu kolom pada layar sempit. Tabel transaksi di bawahnya. Kurva tetap
   closed-P&L canonical, bukan equity mark-to-market. Tidak ada metrik/chart baru pada scope ini.
7. Jaga akses ke eligibility, alasan pengecualian, sensitivitas ambigu, pembandingan eksperimen,
   chart/detail/CSV, freshness, loading/empty/error/partial. Informasi tidak dihapus agar muat.

## B. Panel Pemrosesan - sudah selesai lokal

- `TradeDashboard` merender panel setelah tabel dan footnote hanya pada `/journal?tab=paper`.
  Analytics paper dan evaluasi sinyal mempertahankan urutan saat ini.
- Isi, status kesehatan, alert kegagalan, data backend dan jumlah panel tetap sama.
- Bukti 22 Oktober: reproduksi RED sebelum perubahan; GREEN setelah perubahan;
  desktop/mobile 6/6, unit 111/111, typecheck, full ESLint dan build PASS; review React/a11y
  tanpa HIGH/CRITICAL. Bukti lokal/fixture, bukan verifikasi Production.
- Pertahankan perubahan di `src/components/trade-reporting.tsx` dan regresi
  `tests/reporting.spec.ts`. Jangan mengerjakan ulang B; uji regresi saat A menyentuh layout.

## C. Empat kartu panduan strategi

Urutan: MACD + EMA200, Fractal Breakout, RS Breakout, Pullback Reclaim.
Setiap kartu memiliki judul, ID versi, **Pemicu entry**, **SL awal**, dan **Exit**.
Aturan lengkap boleh di disclosure; syarat utama dan kedua pilihan exit terlihat langsung.

| Kartu | Pemicu entry teknikal pada close harian | SL awal dari snapshot |
| --- | --- | --- |
| MACD + EMA200 | Close > EMA200; histogram MACD sebelumnya <=0 dan hari ini >0. MACD(12,26,9); bukan syarat MACD line >0 | Pivot low terkonfirmasi terbaru, 2 bar kiri/2 kanan, lookback 60 sesi; tanpa buffer. Tidak ada pivot/stop invalid berarti tidak eligible untuk entry |
| Fractal Breakout | Close sebelumnya <= ceiling terbaru F, close hari ini > F, dibandingkan terhadap F yang sama; satu sinyal per upper-fractal ID/versi | Floor fractal terakhir saat sinyal; harus tersedia dan 0<SL<close. Level hanya boleh dipakai sejak available-at, bukan pivot date |
| RS Breakout | Close > EMA50 > EMA200; return60 masuk top 20% universe eligible, ranking atas cross-section lengkap; close > high tertinggi 20 sesi sebelumnya, tidak termasuk hari sinyal | Low terendah 5 bar termasuk hari sinyal, dikurangi 0,25 x ATR14 |
| Pullback Reclaim | Close > EMA50 > EMA200; dalam 3 sesi sebelumnya pernah close < EMA20, seluruhnya close > EMA50; close sebelumnya <= EMA20, close hari ini > EMA20 dan > high sebelumnya | Low terendah 4 bar termasuk hari sinyal, dikurangi 0,25 x ATR14 |

### Entry paper dan exit yang ditampilkan

Semua kartu memakai dua eksperimen exit yang sama; jangan mengarang exit berbeda per strategi.
Tampilkan ringkasan berikut pada setiap kartu, dengan penjelasan biaya/model bersama di bawah grid:

- **Entry paper:** sesi bursa berikutnya, fill simulasi sebesar close hari sinyal yang dibekukan.
  Sinyal teknikal dan execution eligibility berbeda; ini bukan order/fill broker.
- **Fixed 2R:** TP = entry + 2 x (entry-SL awal); SL awal tetap aktif.
- **SMA10:** tanpa TP tetap. Close harian terkonfirmasi < SMA10 memicu exit next-open;
  wick intraday atau close sama dengan SMA10 tidak memicu MA exit. SL teknikal awal tetap
  aktif dan dapat tersentuh intraday; SMA10 bukan harga fill atau stop yang menggantikan SL awal.
- Catatan bersama: risiko rencana pada SL maksimal Rp1 juta termasuk fee beli 0,15%/jual 0,25%,
  lot dibulatkan turun. Gap dapat membuat loss aktual simulasi melebihi risiko rencana.
  Open teramati diperiksa lebih dahulu; dual-hit SL/TP tanpa urutan tetap ambigu.
  Evaluasi 5/10 sesi bukan auto-close. Actual journal memakai fills/fee aktual pengguna.

Dasar konten: [SOT snapshot frontend](../SOT.md), bagian 7/8/8A/8B/9 dan evaluasi sinyal.
Cross-check read-only dilakukan terhadap backend `scanner/src/idx_scanner/strategies.py`
dan default `models.py`: MACD/RS/Pullback memerlukan 600 bar; fractal level minimal 6 bar.
Persyaratan data/stop lengkap berada dalam panduan detail, tanpa filter baru volume/slope/RSI.
Klaim entry paper menggunakan model aktif di bagian 9; teks lama entry next-open di definisi
strategi bukan alasan untuk mengganti model close-sinyal yang disetujui owner.

Panduan diberi label **baseline V1 saat ini**. Hash konfigurasi saja tidak cukup untuk menebak
parameter run historis/custom. Snapshot pada Detail/Data & sumber tetap otoritatif bagi run
terpilih; panduan tidak dilabeli sebagai konfigurasi historis persis jika tidak tersedia.

### Penempatan dan responsivitas

- Panduan hanya pada tab Sinyal diterbitkan; empat kartu tetap tersedia saat filter strategi
  dipilih atau hasil nol. Status failed/partial/empty tetap tampil jujur, terpisah dari panduan.
- Mode tanpa detail: tinggi tabel sinyal mengikuti jumlah baris sampai batas scroll yang
  wajar; hilangkan min-height 340px khusus kondisi ini agar ruang kosong tidak menghalangi kartu.
- Tempatkan grid setelah pagination dan **setelah `.terminal-workspace` sebagai sibling alur
  normal**, bukan anak grid ketiga. Empat kolom pada desktop lebar, dua pada tablet, satu pada
  mobile. Tidak ada carousel, posisi floating, atau area scroll tambahan khusus kartu.
- Saat detail dibuka, workspace tetap 50:50 dan tinggi/scroll chart tetap. Grid fullwidth berada
  di bawah workspace. Quality matrix, drawer mobile, expand/close dan chart return tidak berubah.

Sketsa desktop tanpa panel detail:

```text
[ Header / filter / tab / status run                         ]
[ Sinyal diterbitkan: tabel mengikuti isi + pagination        ]
[ MACD + EMA200 ][ Fractal BO ][ RS Breakout ][ Pullback       ]
[ Catatan model entry paper, biaya dan batas evaluasi         ]
```

## D. Overlay chart dari daftar Jurnal dan Analytics

### Scope dan perilaku

- Prioritas utama: tautan **Chart** dan **Saat sinyal** pada baris `/journal?tab=paper`.
  Terapkan perilaku konsisten pada tautan bersama yang sudah ada di Analytics Paper/Aktual
  dan Evaluasi Sinyal. Ledger aktual `/journal` saat ini belum memiliki Chart per baris;
  D tidak otomatis menambah entry point baru di sana.
- Klik kiri biasa atau Enter membuka overlay. URL, tab, filter, halaman, posisi vertikal
  dan scroll horizontal tabel asal tetap. Menutup overlay tidak memanggil router.refresh,
  tidak memuat ulang ledger, dan tidak mengubah hasil/filter yang sedang dibaca.
- Pertahankan href canonical `/chart/[ticker]?...` dari helper tervalidasi. Ctrl/Cmd-click,
  Shift-click, klik tengah, menu browser, dan fallback tanpa JavaScript tetap membuka halaman
  chart. Dalam overlay tersedia aksi eksplisit **Buka halaman penuh** untuk analisis panjang.
- Scope tidak mencakup perubahan chart inline pada detail trade, Scanner split 50:50,
  kontrak API/chart, data canonical, indikator engine, RLS, atau aturan entry/exit.

### Arsitektur kecil yang dipilih

1. Satu host overlay client pada area Jurnal/Analytics, bukan satu chart tersembunyi per baris.
   Gunakan native `<dialog>` dan trigger tipis pada factory `TradeChartLinks`/`SignalChartLink`.
   Data page/RPC tetap server-side; host menerima context request/indikator/mode yang diperlukan.
   Jangan membungkus ulang semua halaman menjadi client component atau mengimplementasikan chart baru.
2. Reuse `ChartPanel` dan renderer Lightweight Charts yang sudah ada. Mount hanya ketika
   overlay benar-benar dibuka dan container dapat diukur; renderer/data tidak di-prefetch
   saat daftar dimuat. Gunakan import lazy yang ada, bukan iframe atau library modal baru.
3. Simpan request lengkap: ticker, context kind, context_id, view, timeframe, limit, indikator
   dan returnTo. **Chart** trade tetap paper/actual + followup; **Saat sinyal** tetap signal +
   snapshot. Jangan mengganti request dengan ticker/latest atau mencampur dua trade ticker sama.
4. Key instance memisahkan owner/session scope, mode, context ID dan view. Satu pilihan aktif;
   klik ganda tidak membuat dialog/request ganda. Pergantian konteks membersihkan chart lama
   sebelum loading baru, tanpa flash data ticker/trade sebelumnya.
5. Pada close/unmount/sumber berubah, gunakan cleanup abort/generation guard yang sudah ada
   di ChartPanel; hapus timer, observer, listener dan instance canvas. Respons terlambat tidak
   boleh membuka overlay lagi atau menimpa pilihan baru. Tutup dan kosongkan saat route,
   cohort, owner/session atau mode berubah; jangan mempertahankan data lintas akun.

### Navigasi dan posisi asal

- Pilihan V1: state overlay lokal, **tanpa menambah entry history atau query baru**. Refresh
  menampilkan kembali halaman/cohort asal dengan overlay tertutup. Back/Forward tetap mengikuti
  navigasi browser normal; jika halaman/cohort berubah, overlay ditutup dan resource dibersihkan.
  V1 tidak menjebak Back untuk sekadar menutup modal. Close/Escape adalah cara kembali langsung
  ke daftar yang sama. Perilaku ini harus eksplisit diuji, bukan diasumsikan dari native dialog.
- Halaman `/chart/[ticker]` dan deep link lama tetap bekerja, termasuk returnTo yang aman.
  Aksi halaman penuh mempertahankan view/indikator/konteks aktif dan menyimpan posisi daftar.
- Khusus **Buka halaman penuh dari overlay**: simpan koordinat halaman/tabel asal sebelum
  modal dibuka, lalu gunakan snapshot tersebut untuk record return. Jangan mengambil
  `window.scrollY` saat body sudah terkunci atau memasukkan tabel OHLC modal ke indeks tabel
  daftar asal. Jalur ini perlu koordinasi capture/handler tersendiri, bukan mengandalkan
  capture generik yang berjalan lebih dahulu. Pulihkan style/scroll lock saat navigasi.
- Koordinasikan listener capture `ChartReturnPosition`: saat ini ia merekam klik `/chart` sebelum
  handler tautan. Tandai trigger overlay secara eksplisit sehingga klik modal tidak meninggalkan
  record return yang stale. Jalur fullpage/modifier tetap memakai mekanisme return yang sesuai.
  Jangan menghapus record return lain secara global; storage dibatasi halaman/mode yang benar.

### Layout, fokus dan gerakan

- Desktop: modal besar terpusat, lebar sekitar `min(96vw, 1440px)` dan tinggi dibatasi viewport.
  Header ringkas menampilkan ticker/konteks dan kontrol Tutup yang selalu terlihat. Isi chart
  mengisi ruang tersisa; toolbar wrap teratur, bukan melebar keluar layar.
- Mobile/tablet sempit: overlay fullscreen berbasis `100dvh`, safe-area, kontrol sentuh minimal
  44px. Header/Tutup terjangkau pada orientasi landscape, layar pendek dan zoom 200%.
  Hindari tumpukan scroll; body background terkunci, isi modal memiliki satu scroll utama,
  sementara tabel OHLC boleh scroll lokal. Resize tidak mereset zoom/indikator tanpa alasan.
- Kunci dan pulihkan scroll body tanpa loncatan, termasuk ketika scrollbar desktop menghilang.
  Catat scroll tabel/halaman sebelum focus berpindah, lalu pulihkan saat close.
- Dialog memiliki judul aksesibel, fokus awal pada kontrol yang masuk akal, background inert,
  Tab/Shift+Tab tetap dalam dialog, Escape dan tombol Tutup menuju satu controller idempotent.
  Hindari penanganan Escape ganda antara dialog dan ChartPanel. Kembalikan fokus ke link pembuka
  dengan preventScroll; jika baris hilang, gunakan fallback heading daftar yang masih ada.
- Klik backdrop tidak menutup pada V1 untuk mencegah penutupan saat drag/pan chart. Tidak ada
  auto-close saat pointer keluar. Hormati reduced-motion; transisi opacity singkat boleh dipakai,
  tanpa animasi ukuran canvas yang membuat ukuran nol, blur berat, atau layout shift.
- Pertahankan attribution Lightweight Charts/TradingView dan alternatif tabel OHLC yang aksesibel.

### State, batas data dan pengujian D

- Tampilkan skeleton/loading dalam modal; bedakan kosong, missing/partial/stale, snapshot/revision
  unavailable, backend belum siap, koneksi gagal dan limit baca. Error tidak menjadi chart demo.
  Aksi retry mengikuti cooldown yang ada, bukan loop polling otomatis.
- Respons 401/403 membersihkan data terlindungi dan menampilkan login/akses ditolak yang aman.
  Error raw/HTML tidak dirender; kegagalan chunk/canvas menyediakan error dan alternatif data
  canonical yang tersedia. Tidak ada fallback dari konteks yang gagal ke latest.
- RED->GREEN: klik row Chart membuka satu dialog pada URL asal, request context/ID/view tepat,
  dan tidak melakukan navigasi halaman penuh. Sebelum klik: nol chart request/renderer mount.
- Uji open/close berulang, klik ganda, ticker/trade sama dengan ID berbeda, snapshot/followup,
  cepat buka A-tutup-buka B, close saat loading, abort yang terlambat, error/retry/rate-limit,
  auth expiry/logout, pergantian filter/page/mode, refresh, Back/Forward dan storage disabled.
- Browser desktop/tablet/mobile, layar 320px/390px, landscape/short viewport, resize/zoom 200%,
  reduced-motion, keyboard focus/Escape, pan/zoom yang tidak menutup modal, body/tabel scroll
  restoration, header/Tutup tetap terlihat, dan tidak ada hydration/page error.
- Regresi khusus: scroll halaman dan tabel asal, buka overlay, pilih halaman penuh, lalu kembali.
  Periode/strategi/page serta posisi vertikal dan horizontal harus sama dengan sebelum modal
  dibuka; uji juga body lock aktif dan disclosure tabel OHLC modal sedang terbuka.
- Pertahankan test roundtrip fullpage di `tests/chart-journal-integration.spec.ts` untuk aksi
  halaman penuh/fallback; tambahkan test overlay. Jangan membuang bukti context/return-scroll
  lama agar test hijau. Bandingkan request count (tanpa prefetch/duplikasi), cleanup renderer
  sesudah close, dan ukur open-to-visible pada fixture tetap tanpa SLA produksi yang dikarang.

## Tahapan implementasi - Action / Proof

| Tahap | Action | Proof / status |
| --- | --- | --- |
| 1 | Review plan gabungan, kunci copy strategi, scope overlay dan navigasi V1 | A, kemudian C dan D disetujui 22 Oktober untuk implementasi lokal. Konten strategi ditelusuri ke SOT/backend |
| 2 | Implementasi A: shell/filter/tabel reporting dan dua kolom Analytics; integrasikan B yang sudah ada | COMPLETE LOCALLY. RED->GREEN navigasi/warna, fullwidth/table/grid/responsive dan regresi data/CSV/chart-return PASS; unit 111/111, lint/typecheck/build PASS. Bukti rinci dan koreksi timing test di status |
| 3 | Implementasi C: komponen panduan baseline statis berversi + grid, rapikan tinggi tabel sinyal tanpa detail | COMPLETE LOCALLY. Browser RED->GREEN; final panduan desktop/mobile6/6 PASS. Full Scanner/chart68 PASS/6 skip viewport, termasuk split/expand/quality/return/fokus/filter/akses; unit111/111, lint/typecheck/build PASS. Empat kartu SSR tanpa request/indikator baru |
| 4 | Implementasi D: host dialog tunggal + trigger link; reuse chart, cleanup/fokus/scroll dan fallback fullpage | COMPLETE LOCALLY. Satu context host + thin links, dialog native, key owner/mode/route, auth subscription hanya saat terbuka, pre-open scroll snapshot dan reuse ChartPanel cleanup. Overlay/fullpage24/24 PASS; final fallback/keyboard/read-count rechecks PASS; unit111/111, lint/typecheck/build PASS. Lihat status untuk run gagal dan batas JS-off awal |
| 5 | Review React/a11y/security dan verifikasi lokal gabungan | A/B/C/D selesai lokal, tanpa HIGH/CRITICAL. D diuji desktop/mobile, 320/390/landscape/720x450, fokus/scroll, error/auth/rate limit, respons terlambat dan fallback native. C: 4/2/1 kolom pada1440/1024/390/320 sesuai SOT. Toolbar zoom native/owner Production belum diverifikasi |

Kriteria selesai lokal: A/C/D terpenuhi, B tetap paling bawah, empat strategi lengkap dan
sesuai sumber, filter/back/refresh/drill-down/Escape berfungsi, state gagal tidak hilang,
data/request reporting tetap sama, chart hanya dibaca setelah dibuka tanpa duplikasi,
review tanpa HIGH/CRITICAL dan pemeriksaan relevan PASS. Catat batas bukti; tidak menjanjikan
bebas bug tanpa pengujian atau menyebut hasil fixture sebagai acceptance owner Production.

## Batas dan handoff

- Fase penyusunan plan hanya mengubah Markdown. Owner kemudian mengizinkan implementasi A
  lebih dahulu, C, kemudian D pada 22 Oktober. A/B/C/D selesai lokal.
  Perubahan source/test B yang sudah ada dipertahankan. Cleanup dokumentasi lain tidak dicampur.
- Tidak ada perubahan backend/database/API/auth/dependency, perhitungan indikator/ledger,
  sinyal, entry/exit, backfill atau produksi yang termasuk implementasi visual ini.
- Owner mengizinkan commit/push/deploy paket UI ini pada 22 Oktober setelah QA. Gunakan bukti
  lokal yang sudah selesai; commit scoped, push, verifikasi SHA Vercel dan smoke live.
  Verifikasi owner-browser tetap terpisah bila tersedia; jangan mencampur cleanup Markdown lain.
- [Status](../IMPLEMENTATION_STATUS.md) memegang bukti B dan rilis sebelumnya; jangan menyebut
  hasil lokal sebagai live atau menjalankan ulang reset/backfill dari dokumen historis.
- Batas yang ditemukan saat D: initial load dengan JavaScript dimatikan tetap menunjukkan
  loading streaming Next pada halaman detail lama tanpa provider overlay, walaupun HTML hasil
  akhirnya sudah attached. Ini bukan PASS dukungan aplikasi penuh tanpa JS dan tidak diperbaiki
  melalui perubahan framework di scope ini. Tautan yang sudah tampil terbukti tetap menuju
  URL canonical setelah JS dimatikan; native modifier/new-tab dan fullpage return juga PASS.
