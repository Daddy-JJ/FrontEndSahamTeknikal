> HISTORICAL / NOT AN ACTIVE TASK / NOT AUTHORIZATION
> Source: frontend PLAN.md at 513870f6020983ddb20ba022c946eaffd223fce6 (15 October 2026); archived 21 October 2026.
> Reason: relayout completed and released in the recorded 15 October receipts. Superseded by [active PLAN](../../PLAN.md).
> Open evidence/acceptance boundaries remain in [current status](../../IMPLEMENTATION_STATUS.md). Old approvals apply only to their original scope.

## Scanner workspace — rencana relayout tahap 1–4, 2026-10-15

Status: IMPLEMENTED AND VERIFIED LOCALLY, tahap 1-4 selesai. Jangan mengulang
implementasi yang sudah dibuktikan. Hasil, retest dan batas bukti ada di
[verifikasi relayout](../SCANNER_RELAYOUT_VERIFICATION_20261015.md).
Commit/push telah diotorisasi pemilik setelah pemeriksaan lokal; bukti pengiriman
dicatat di handoff bersama. Verifikasi lokal ini belum membuktikan deployment produksi.
Nomor tahap di bagian ini khusus relayout Scanner, bukan pengulangan tahap Chart V1.
Dokumen ini hanya memuat rencana aktif relayout tahap 1-4.
Riwayat sebelumnya tersedia di [arsip PLAN](PLAN_HISTORY_BEFORE_SCANNER_RELAYOUT_20261015.md).
Buka arsip hanya jika perlu menelusuri keputusan atau bukti lama; bukan prasyarat
membaca rencana relayout ini. Aturan AGENTS.md dan SOT tetap berlaku.

### Hasil dan batas cakupan

- Desktop viewport CSS >=1280px: daftar dan detail masing-masing 50% dari ruang tersedia
  setelah gap. Pembagian identik pada Alasan sinyal, Chart, dan Data & sumber.
- Sebelum memilih ticker dan setelah menutup detail: daftar memenuhi lebar workspace.
  Tidak memilih ticker atau membuka/mengambil chart secara otomatis.
- Tombol eksplisit Perbesar detail mengubah detail menjadi lebar penuh dalam workspace;
  Kembali 50:50 mengembalikan pembagian awal. Tab/ticker aktif tetap dipertahankan saat
  berganti ukuran. Tidak ada perubahan rasio otomatis berdasarkan isi tab.
- Mode perbesar adalah state UI lokal: bertahan ketika pindah tab/ticker, reset setelah
  Tutup detail atau refresh. Refresh/deep link tetap membuka ticker/tab dari URL dengan
  pembagian default 50:50. Tidak menambah parameter URL atau storage untuk rasio.
- Di bawah1280px: satu dialog detail hampir/penuh layar yang sama untuk seluruh tab,
  dengan Kembali ke daftar, native Escape, focus trap dan pengembalian fokus ke pemicu.
  Tidak menampilkan daftar dan detail berukuran setengah layar pada mobile/tablet.
- Filter, ringkasan run dan pemberitahuan kualitas tetap di atas workspace. Header tabel,
  pagination, header detail dan tab tetap tersedia ketika isi panel bergulir.
- Seluruh kolom dan field audit tetap tersedia. Angka, label basis harga, tanggal,
  hold/error/partial dan identitas sinyal tidak berubah karena peringkasan tampilan.
- Frontend saja: tidak memerlukan API/RPC/schema/dependency baru atau perubahan aturan
  sinyal, fill, fee, ledger, statistik, otorisasi maupun konfigurasi cloud.
- Drag splitter, penyimpanan rasio lintas sesi dan preset40:60 ditunda. Default50:50
  dan satu aksi perbesar cukup untuk lingkup pertama.

### Temuan source dan risiko

`src/app/globals.css` menetapkan `.has-detail` sebagai kanan320px dan `.has-chart`
sebagai1fr:2fr dengan minimum640px. `scanner-terminal.tsx` mengganti class berdasarkan
tab. Ini penyebab perubahan lebar yang terlihat pada lampiran pengguna.
Matrix dan aside juga memiliki batas tinggi berbeda; aside memakai sticky/scroll sendiri.
Toolbar chart flex-wrap dapat memakan tinggi saat panel menyempit. `chart-canvas.tsx`
sudah mengamati lebar melalui ResizeObserver, tetapi tinggi ditetapkan dari lebar awal.
Perubahan harus mencegah loop resize, chart terpotong, scroll bertumpuk, atau remount
yang memicu fetch baru saat hanya mode layout berubah.
Source saat ini memindahkan isi aside ke dialog saat breakpoint berubah, sehingga dapat
me-remount ChartPanel. Efek chart-canvas juga recreate renderer saat indikator berubah.
Ini pekerjaan lifecycle frontend yang perlu dibuktikan, bukan dianggap perubahan CSS saja.

### Tahap 1 — kerangka desktop dan kontrak interaksi

Action: tambahkan kasus browser RED untuk rasio dan perpindahan tiga tab, lalu gunakan
dua kolom `minmax(0,1fr)` yang sama. Lepaskan kaitan geometri dengan `.has-chart`.
Tentukan satu tinggi luar workspace berdasarkan ruang viewport yang tersisa; perubahan
header/filter/zoom ikut diperhitungkan. Kedua panel sejajar atas/bawah. Gunakan body
scroll internal dan jangan mengunci scroll halaman secara global. Pada layar pendek,
semua kontrol tetap dapat dicapai melalui scroll. Implementasikan perbesar/restore
eksplisit dengan satu instance detail; jangan menggandakan id atau chart mount.
Pertahankan URL detail/panel, history serta kontrak pemilihan ticker yang sudah ada.

Proof: desktop1280/1440/1920px dengan rasio kiri:kanan1:1, toleransi2px; selisih bounding
box kiri/kanan antar-tab <=2px pada viewport dan mode yang sama. Tutup mengembalikan
daftar penuh. Perbesar/restore tidak mengubah ticker/tab atau mengambil data baru.
Resize melewati breakpoint tidak menghilangkan pilihan atau menyisakan dialog terbuka.
Mode desktop yang dipilih dipertahankan saat kembali dari dialog, selama detail belum ditutup.

### Tahap 2 — daftar dan rincian yang terbaca pada setengah layar

Action: batasi overflow tabel di region tabel; buat ticker sticky saat geser horizontal
dan pertahankan penanda baris terpilih. Rapikan jarak/header tanpa mengurangi ketepatan
angka atau menghilangkan kolom. Header/pagination daftar serta header/tab detail berada
di luar body scroll. Susun informasi utama Alasan sinyal lebih dahulu; tempatkan metadata
audit panjang dalam disclosure yang jelas, dengan seluruh nilai asal tetap tersedia.
Gunakan struktur label/nilai yang mengikuti lebar panel dan wrap aman untuk digest/ID.

Proof: seluruh kolom dapat dijangkau dengan pointer dan keyboard; ticker/baris terpilih
tetap dikenali. Harga, nilai desimal dan tanggal tidak terpotong atau berubah. Disclosure
membuka seluruh audit sumber. Scroll daftar dan detail tidak saling menggeser. Verifikasi
tab Quality dan Sinyal, termasuk daftar kosong, hold dan25baris.

### Tahap 3 — chart responsif dan detail mobile yang konsisten

Action: kelompokkan toolbar menjadi konteks waktu/aksi, rentang, dan indikator berdasarkan
lebar container. Pertahankan touch target/fokus yang memadai; jelaskan perbedaan Tutup detail
dan aksi menutup chart agar tidak membingungkan. Gunakan ukuran canvas/pane yang mengikuti
ruang tersedia dengan minimum keterbacaan dan scroll untuk layar pendek. Resize dan toggle
indikator tidak boleh mengubah semantik snapshot/followup atau reset zoom tanpa alasan.
Pastikan lifecycle observer dibersihkan dan tidak membentuk loop resize.
Samakan lebar dialog Alasan/Chart/Sumber pada mobile/tablet; gunakan satu wadah navigasi
dan scroll. Tautan route Perbesar chart yang sudah ada tetap tersedia untuk analisis khusus.
Perbesar detail dalam workspace dan membuka route chart adalah dua aksi dengan label berbeda.

Proof: chart, volume, MACD dan kontrol terbaca pada desktop50:50 serta mobile375/390px,
tablet768/1024px dan landscape pendek. Loading/error/empty/partial tetap dalam wadah
yang stabil, tanpa fallback fixture. Alasan/Sumber tidak mengambil harga atau heavy chunk.
Resize dan perbesar/restore menambah0GET harga; fetch karena perubahan konteks/view/limit,
retry atau Muat ulang tetap mengikuti kontrak lama. Uji loading lambat dan perpindahan
ticker cepat agar hasil ticker sebelumnya tidak muncul pada pilihan baru.
Acceptance resize mencakup lintasan1279->1280->1279px tanpa GET harga tambahan untuk
konteks/view/limit yang sama, termasuk saat fetch sedang berlangsung. Utamakan satu
pemilik lifecycle data; jika perlu state sementara, batasi dalam sesi owner/mode/context
yang sama dan pertahankan purge saat auth berubah. Jangan menambah cache global data privat.
Setelah pan/zoom manual, toggle SMA10/EMA200/MACD dan perbesar/restore harus mempertahankan
rentang waktu terlihat. Aksi Reset zoom atau memilih rentang3/6/12bulan memang boleh
mengubahnya. Keberhasilan tidak cukup dinilai dari chart yang sekadar kembali tampil.

### Tahap 4 — regresi, bukti dan kesiapan rilis

Action: perluas suite scanner/chart yang ada, bukan membuat engine atau suite paralel.
Jalankan pengujian terarah sebelum/sesudah perubahan, unit yang relevan, typecheck, lint
dan production build. Browser cases mencakup tab/arrow keys/Home/End, Escape/focus return,
dialog, Back/refresh/deep link, filter/pagination, expand/restore, scroll restore dan
pergantian desktop/mobile. Periksa browser console/hydration, kontras dan zoom200%.
Catat request count terhadap baseline untuk interaksi yang sama. Tinjau dampak chart
bersama pada route mandiri, detail jurnal dan Workspace; fixture tetap ditandai.
Gunakan reviewer read-only setelah implementasi; perbarui status/handoff dengan bukti.

Proof: seluruh acceptance di atas lulus pada source final, tidak ada overflow horizontal
halaman (hanya region tabel), error hydration atau perubahan payload/angka finansial.
Dokumentasikan hasil PASS/FAIL/SKIPPED/NOT VERIFIED; bukti fixture lokal tidak menjadi
klaim owner produksi. Hasil tes/build lokal tercatat pada dokumen verifikasi relayout.
Commit/push/deploy merupakan langkah rilis setelah implementasi dan gate selesai, mengikuti
otorisasi rilis yang berlaku; belum dijalankan dalam bukti lokal ini. Setelah rilis,
verifikasi SHA Vercel, public smoke dan owner UI bila sesi login tersedia; laporkan batas
bukti terpisah. Rollback UI memakai versi sebelumnya tanpa mengubah state jurnal.

Urutan eksekusi: tahap1 ->2 ->3 ->4. Tiap tahap wajib memiliki bukti sebelum dinyatakan
selesai. Jika perlu logika sizing murni baru, uji batasnya sebelum implementasi; jangan
menambah abstraksi atau tes yang hanya menyalin CSS tanpa memeriksa perilaku nyata.
