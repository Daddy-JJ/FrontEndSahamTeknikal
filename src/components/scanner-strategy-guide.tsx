import styles from "./scanner-strategy-guide.module.css";

// Static baseline copy: SOT sections 7/8/8A/8B/9. Per-run snapshots stay authoritative.
const strategies = [
  {
    id: "MACD_EMA200_V1",
    title: "MACD + EMA200",
    entry: "Close > EMA200; histogram MACD(12,26,9) sebelumnya ≤ 0 dan hari ini > 0. Tidak mensyaratkan MACD line > 0.",
    stop: "Pivot low terkonfirmasi terbaru, 2 bar kiri / 2 bar kanan, lookback 60 sesi; tanpa buffer. Pivot tidak tersedia atau stop invalid berarti tidak eligible untuk entry.",
    details: [
      "Daily, long-only; minimal 600 bar valid kontinu untuk warm-up indikator. EMA200 tidak memerlukan slope positif; tidak ada syarat minimum volume, breakout swing high, atau durasi histogram merah.",
      "Pivot j memenuhi low[j] ≤ low pada j−2, j−1, j+1, dan j+2; baru diketahui setelah close j+2. Pilih pivot terbaru dalam rentang t−60 sampai t−2, termasuk batasnya; bila seri, pilih j terbaru.",
      "SL = low pivot terbaru. Jika pivot terbaru invalid terhadap close, jangan mencari pivot alternatif. Stop harus positif dan di bawah close sinyal; validasi diulang terhadap harga entry.",
    ],
  },
  {
    id: "FRACTAL_BREAKOUT_V1",
    title: "Fractal Breakout",
    entry: "Close sebelumnya ≤ ceiling terbaru F dan close hari ini > F; keduanya dibandingkan terhadap F yang sama. Satu sinyal per upper-fractal ID / versi strategi.",
    stop: "Floor fractal terakhir pada snapshot sinyal, tanpa buffer; harus tersedia dan 0 < SL < close. Level berlaku sejak available-at, bukan pivot date.",
    details: [
      "Minimal 6 bar untuk perhitungan level; ceiling dan floor yang diperlukan harus tersedia. Pada sesi t, pivot berada di t−3, dibandingkan dengan t−5, t−4, t−2, dan t−1. Equality diperbolehkan; bar t tidak mengonfirmasi pivot.",
      "Ceiling memakai high pivot yang ≥ kedua high kiri dan kedua high kanan; floor memakai low pivot yang ≤ keempat low pembanding. Level bertahan sampai pivot baru; pivot date = t−3, available-at = t, tanpa backplot ketersediaan.",
      "F adalah ceiling terbaru menurut waktu, bukan level terdekat secara harga. Wick di atas F tanpa close di atasnya bukan breakout. Sinyal skipped tetap mengonsumsi ID; pivot baru mendapat ID baru walaupun harganya sama.",
      "Floor null, nonpositif, atau ≥ close membuat entry tidak eligible; tidak memilih floor alternatif. Tidak ada syarat EMA200, MACD, RVOL, atau buffer breakout. Port level berasal dari Fractal Channel / FracChan_v2, © NielsG, MPL-2.0.",
    ],
  },
  {
    id: "RS_BREAKOUT_V1",
    title: "RS Breakout",
    entry: "Close > EMA50 > EMA200; return60 masuk top 20% universe eligible dengan cross-section lengkap. Close > high tertinggi 20 sesi sebelumnya, tanpa memasukkan hari sinyal.",
    stop: "Low terendah 5 bar termasuk hari sinyal, dikurangi 0,25 × ATR14. Stop snapshot harus positif dan di bawah close sinyal.",
    details: [
      "Daily, long-only; minimal 600 bar valid. Relative strength adalah ranking return60 = close[t] / close[t−60] − 1, bukan RSI; memakai basis provider yang sama.",
      "Ranking menurun atas seluruh anggota efektif dengan histori return60 valid, sebelum filter trend dan entry. Tie dipecahkan ticker ascending; ambil ceil(0,20 × N). Anggota yang kurang histori dikecualikan dan jumlahnya dicatat.",
      "Jika data anggota yang seharusnya eligible stale, missing, atau corporate action belum selesai, cross-section tidak lengkap dan publikasi RS baru ditahan; jangan memakai batch parsial sebagai top 20%.",
      "Breakout strict terhadap tepat 20 high sebelum t; equality bukan breakout. SL = min(low[t−4..t]) − 0,25 × ATR14[t]. ATR14 memakai Wilder: seed rata-rata 14 TR pertama, lalu (13 × ATR sebelumnya + TR) / 14; bukan SMA rolling TR.",
      "Stop dibekukan dan divalidasi ulang terhadap entry. Setiap qualifying close dapat menjadi sinyal harian; aturan satu posisi aktif per eksperimen mencegah pyramiding. Tidak ada filter volume, slope, regime IHSG, atau gap cap tersembunyi.",
    ],
  },
  {
    id: "PULLBACK_RECLAIM_V1",
    title: "Pullback Reclaim",
    entry: "Close > EMA50 > EMA200. Dalam 3 sesi sebelumnya pernah close < EMA20 dan semuanya close > EMA50. Close sebelumnya ≤ EMA20; close hari ini > EMA20 dan > high sebelumnya.",
    stop: "Low terendah 4 bar termasuk hari sinyal, dikurangi 0,25 × ATR14. Stop snapshot harus positif dan di bawah close sinyal.",
    details: [
      "Daily, long-only; minimal 600 bar valid. Tiga sesi sebelumnya tepat t−3, t−2, t−1: setidaknya satu close di bawah EMA20 pada sesinya, dan ketiganya close di atas EMA50 pada masing-masing sesi.",
      "Sesi t−1 harus close ≤ EMA20[t−1]. Pada t, close strict di atas EMA20[t] dan high[t−1], serta close[t] > EMA50[t] > EMA200[t].",
      "SL = min(low[t−3..t]) − 0,25 × ATR14[t]. ATR14 memakai Wilder: seed rata-rata 14 TR pertama, lalu (13 × ATR sebelumnya + TR) / 14; ATR pada t boleh memakai bar sinyal t.",
      "Stop dibekukan dan divalidasi ulang terhadap entry; stop nonpositif atau ≥ close tidak eligible. Tidak memerlukan ranking RS, volume, atau MACD.",
    ],
  },
] as const;

function ExitRules() {
  return <>
    <p><strong>Fixed 2R:</strong> TP = entry + 2 × (entry − SL awal); SL awal tetap aktif.</p>
    <p><strong>SMA10:</strong> tanpa TP tetap. Close harian terkonfirmasi &lt; SMA10 memicu exit pada open sesi berikutnya (next-open). Wick atau close sama dengan SMA10 tidak memicu exit MA. SL teknikal awal tetap aktif intraday; SMA10 bukan harga fill atau pengganti SL awal.</p>
  </>;
}

function StrategyCard({ strategy }: { strategy: typeof strategies[number] }) {
  return <article className={styles.card} data-strategy={strategy.id}>
    <header className={styles.cardHeader}>
      <h3>{strategy.title}</h3>
      <code>{strategy.id}</code>
    </header>
    <dl className={styles.rules}>
      <div><dt>Pemicu entry</dt><dd>{strategy.entry}</dd></div>
      <div><dt>SL awal</dt><dd>{strategy.stop}</dd></div>
      <div><dt>Exit · dua eksperimen terpisah</dt><dd><ExitRules /></dd></div>
    </dl>
    <details className={styles.details}>
      <summary>Aturan lengkap dan syarat data</summary>
      <ul>{strategy.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
    </details>
  </article>;
}

export function ScannerStrategyGuide() {
  return <section id="scanner-strategy-guide" className={styles.guide} aria-label="Panduan strategi baseline V1 saat ini">
    <header className={styles.heading}>
      <span className={styles.eyebrow}>PANDUAN STRATEGI</span>
      <h2>Baseline V1 saat ini</h2>
      <p>Aturan teknikal pada close harian, bukan sinyal baru atau status kelulusan ticker. Panduan ini bukan konfigurasi persis run historis atau custom; snapshot pada Detail / Data &amp; sumber tetap menjadi acuan run terpilih.</p>
    </header>
    <div className={styles.grid} data-strategy-cards="">
      {strategies.map(strategy => <StrategyCard key={strategy.id} strategy={strategy} />)}
    </div>
    <div className={styles.notes}>
      <p><strong>Entry paper:</strong> sesi bursa berikutnya, dengan fill simulasi sebesar close hari sinyal yang dibekukan. Sinyal teknikal dan execution eligibility berbeda; ini bukan order broker atau harga open berikutnya. Actual journal memakai fills dan fee aktual pengguna.</p>
      <p><strong>Biaya dan risiko rencana:</strong> maksimal Rp1.000.000 pada SL termasuk fee beli 0,15% dan jual 0,25%. Lot 100 saham dibulatkan turun; lot nol dilewati. Slippage baseline nol. Gap dapat membuat loss simulasi melebihi risiko rencana; hasil ini bukan return portofolio.</p>
      <p><strong>Urutan dan batas evaluasi:</strong> open teramati diperiksa lebih dahulu. Dual-hit SL / TP tanpa urutan intraday tetap ambigu dan dikeluarkan dari statistik utama model ini; sensitivitas SL-first dan TP-first dilihat terpisah. Evaluasi 5 / 10 sesi bukan auto-close atau time exit; posisi dapat tetap open. Missing data ditahan untuk replay, bukan dianggap fill atau exit.</p>
      <p>RS Breakout dan Pullback Reclaim adalah setup riset; aturan baseline tidak membuktikan profitabilitas.</p>
    </div>
  </section>;
}
