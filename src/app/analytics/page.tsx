import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner, type ActualAnalytics } from "@/lib/journal-server";
import { journalFilters, journalStrategies as strategies } from "@/lib/journal-filters";

export const dynamic="force-dynamic";
const decimal=(v:string|number|null|undefined,digits=2)=>v==null?"—":
  new Intl.NumberFormat("id-ID",{maximumFractionDigits:digits}).format(Number(v));

export default async function AnalyticsPage({searchParams}:{
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await journalOwner();
  if(context.kind!=="ready") return <JournalShell mode={null}>
    <section className="journal-hero"><h1>Analytics belum tersedia</h1>
      <p>Masuk dengan akun owner dan periksa konfigurasi Supabase.</p>
      <Link href="/login">Masuk</Link></section></JournalShell>;
  const query=await searchParams;
  const filters=journalFilters(query);
  if (!filters) return <JournalShell mode={context.mode}>
    <section className="journal-hero"><h1>Filter cohort tidak valid</h1></section>
    <p role="alert" className="journal-alert">Gunakan tanggal kalender, strategi, dan konfigurasi exit yang valid. Versi harus cocok jika snapshot persis dipilih.</p>
    <Link href="/analytics">Atur ulang filter</Link>
  </JournalShell>;
  const {from,to,strategy,exitVersion,exitSnapshotKey,exitSnapshot}=filters;
  const {data,error}=await context.supabase.rpc("actual_journal_analytics",{
    p_from:from,p_to:to,p_strategy:strategy,p_exit_version:exitVersion,
    p_exit_snapshot:exitSnapshot,
  });
  const a=data?.data_mode===context.mode && data?.mode==="actual" ? data as ActualAnalytics : null;
  const exportParams=new URLSearchParams();
  if(from) exportParams.set("from",from);
  if(to) exportParams.set("to",to);
  if(strategy) exportParams.set("strategy",strategy);
  if(exitVersion) exportParams.set("exit_version",exitVersion);
  if(exitSnapshotKey) exportParams.set("exit_snapshot",exitSnapshotKey);
  const exportHref="/journal/export"+(exportParams.size?"?"+exportParams.toString():"");
  return <JournalShell mode={context.mode}>
    <section className="journal-hero"><div><span className="eyebrow">ANALYTICS / ACTUAL</span>
      <h1>Performa yang bisa ditelusuri.</h1>
      <p>Cohort closed ditentukan oleh tanggal exit sesi Asia/Jakarta. P&amp;L tiap trade dihitung satu kali menurut strategi utama.</p>
    </div><div className="journal-hero-actions"><Link href="/journal">← Jurnal</Link>
      {!error && a && <Link href={exportHref}>Ekspor CSV cohort</Link>}</div></section>
    {context.mode==="fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — angka ini bukan performa live.</p>}
    <section className="journal-panel">
      <div className="journal-panel-heading"><div><span className="eyebrow">FILTER COHORT</span><h2>Tanggal exit &amp; konfigurasi</h2></div>
        <span className="badge neutral">Actual · basis IDR</span></div>
      <form className="journal-form journal-filter-form" method="get">
        <label>Dari tanggal exit<input type="date" name="from" defaultValue={from??""}/></label>
        <label>Sampai tanggal exit<input type="date" name="to" defaultValue={to??""}/></label>
        <label>Strategi utama<select name="strategy" defaultValue={strategy??""}>
          <option value="">Semua strategi</option>
          {strategies.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}
        </select></label>
        <label>Versi exit<input name="exit_version" maxLength={60} defaultValue={exitVersion??""}
          placeholder="Contoh: actual-fixed2r-v1"/></label>
        <label>Konfigurasi exit persis<select name="exit_snapshot" defaultValue={exitSnapshotKey??""}>
          <option value="">Semua konfigurasi</option>
          <option value="fixed2r">Fixed 2R · actual-fixed2r-v1</option>
          <option value="ma10">SMA10 close → next open · actual-ma10-v1</option>
          <option value="manual">Manual · actual-manual-v1</option>
        </select></label>
        <p className="journal-help">Pilihan ini mencocokkan seluruh snapshot exit, termasuk target atau periode MA. Kosongkan versi exit jika memakai pilihan ini.</p>
        <button className="journal-secondary" type="submit">Terapkan filter</button>
      </form>
    </section>
    {error || !a ? <section className="journal-panel"><h2>Statistik belum dapat dibaca</h2>
      <p>Migrasi jurnal/analytics M4 mungkin belum diterapkan pada proyek ini. Tidak ada angka rekaan yang ditampilkan.</p>
    </section> : <>
      <section className="journal-metrics" style={{marginTop:20}}>
        <div><span>Closed sample</span><strong>{a.closed}</strong><small>{a.wins} win · {a.losses} loss · {a.breakeven} breakeven</small></div>
        <div><span>Win rate</span><strong>{a.win_rate==null?"—":decimal(Number(a.win_rate)*100,1)+"%"}</strong><small>Semua closed di denominator</small></div>
        <div><span>Expectancy</span><strong>{decimal(a.expectancy_r,3)}{a.expectancy_r==null?"":"R"}</strong><small>R setelah biaya aktual/estimasi</small></div>
        <div><span>Net P&amp;L</span><strong>Rp{decimal(a.net_pnl_idr)}</strong><small>Basis IDR · closed only</small></div>
      </section>
      <div className="journal-columns">
        <section className="journal-panel"><span className="eyebrow">KUALITAS HASIL</span><h2>Risk &amp; reward</h2>
          <dl className="journal-facts">
            <div><dt>Closed dengan fee estimasi</dt><dd>{a.estimated_fee_trades ?? "Belum tersedia"}</dd></div>
            <div><dt>Profit factor · IDR</dt><dd>{a.profit_factor_status==="no_losses"?"Belum ada loss":decimal(a.profit_factor)}</dd></div>
            <div><dt>Payoff ratio · IDR</dt><dd>{a.payoff_status==="no_losses"?"Belum ada loss":
              a.payoff_status==="no_wins"?"Belum ada win":decimal(a.payoff_ratio)}</dd></div>
            <div><dt>Posisi open sekarang</dt><dd>{a.open}</dd></div>
            <div><dt>Draft sekarang</dt><dd>{a.draft}</dd></div>
          </dl>
          <p className="journal-help">P&amp;L dapat mengandung biaya estimasi. Open dan draft adalah posisi saat ini pada strategi/konfigurasi terpilih, di luar filter tanggal closed dan win rate. Ekspor dibagi per 200 trade dengan navigasi ke bagian berikutnya.</p>
        </section>
        <section className="journal-panel"><span className="eyebrow">BATAS INTERPRETASI</span><h2>Paper terpisah</h2>
          <p>Jurnal paper masih berupa preview engine, belum dipersistenkan ke Supabase. Karena itu tidak digabung ke grafik atau angka actual di sini.</p>
          <p>Drawdown portofolio dan CAGR belum ditampilkan sampai cash ledger dan EOD marks tersedia. Satu trade dengan banyak tag tetap dihitung sekali.</p>
        </section>
      </div>
    </>}
  </JournalShell>;
}
