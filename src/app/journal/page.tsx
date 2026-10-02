import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner, type ActualTrade, type ActualAnalytics } from "@/lib/journal-server";
import { JournalForm } from "@/components/journal-form";
import { journalPageNumber, journalPageSize } from "@/lib/journal-page";

export const dynamic = "force-dynamic";

const money = (v:string|number|null|undefined) => v==null ? "—" :
  new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(Number(v));
const ratio = (v:string|number|null|undefined) => v==null ? "—" :
  new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(Number(v));
const errorCopy:Record<string,string>={
  invalid_request:"Permintaan tidak lengkap. Muat ulang halaman dan coba lagi.",
  invalid_input:"Periksa ticker, harga, jumlah, tanggal, dan biaya.",
  "40001":"Data trade berubah. Muat ulang sebelum mengirim lagi.",
  PT412:"Data trade berubah. Muat ulang sebelum mengirim lagi.",
  "23514":"Aksi ditolak oleh aturan ledger. Periksa batas jumlah, risiko, atau status entry.",
  "22023":"Data yang dikirim tidak valid untuk trade ini.",
  "42501":"Sesi owner tidak memiliki izin untuk aksi ini.",
  unavailable:"Layanan jurnal belum siap. Periksa migrasi dan koneksi Supabase untuk environment ini.",
};

export default async function JournalPage({searchParams}:{
  searchParams:Promise<{error?:string;page?:string|string[]}>;
}) {
  const context=await journalOwner();
  if (context.kind!=="ready") {
    return <JournalShell mode={null}><section className="journal-hero">
      <span className="eyebrow">JURNAL AKTUAL</span>
      <h1>Jurnal belum dapat dibuka</h1>
      <p>{context.kind==="unconfigured"?"Konfigurasi Supabase aplikasi belum tersedia."
        :context.kind==="unauthenticated"?"Masuk dengan akun owner untuk melihat transaksi."
        :context.kind==="forbidden"?"Akun ini tidak memiliki keanggotaan owner aktif."
        :"Mode data proyek belum dapat diverifikasi."}</p>
      <Link className="primary-button" href="/login">Masuk sebagai owner</Link>
    </section></JournalShell>;
  }
  const query=await searchParams;
  const page=journalPageNumber(query.page);
  if (page===null) return <JournalShell mode={context.mode}>
    <section className="journal-hero"><h1>Halaman riwayat tidak valid</h1>
      <p>Nomor halaman harus berupa bilangan bulat positif.</p>
      <Link href="/journal">Kembali ke trade terbaru</Link></section>
  </JournalShell>;
  const [{data:trades,error:tradesError},analyticsResult]=await Promise.all([
    context.supabase.from("actual_trades")
      .select("id,ticker,data_mode,primary_strategy,status,revision,initial_stop,current_stop,initial_risk_idr,provisional_risk_idr,open_quantity,remaining_cost_idr,realized_pnl_idr,realized_r,fee_total_idr,exit_policy_snapshot,closed_at,created_at")
      .eq("data_mode",context.mode).order("created_at",{ascending:false})
      .order("id",{ascending:false})
      .range((page-1)*journalPageSize,page*journalPageSize),
    page===1 ? context.supabase.rpc("actual_journal_analytics") : Promise.resolve(null),
  ]);
  const analytics=analyticsResult?.data;
  const ready=!tradesError && (page>1 || (!analyticsResult?.error
    && analytics?.data_mode===context.mode && analytics?.mode==="actual"));
  const rows=((trades ?? []) as ActualTrade[]).slice(0,journalPageSize);
  const hasMore=(trades?.length??0)>journalPageSize;
  const summary=analytics as ActualAnalytics|null;
  const error=query.error;
  return <JournalShell mode={context.mode}>
    <section className="journal-hero">
      <div><span className="eyebrow">JURNAL / AKTUAL / EOD</span>
        <h1>Catatan transaksi, satu ledger.</h1>
        <p>Setiap fill dan biaya tercatat. Partial exit tetap open; statistik menang/kalah hanya memakai trade closed.</p>
      </div>
      <div className="journal-hero-actions">
        <Link href="/analytics">Buka analytics →</Link>
        {ready && <Link href="/journal/export">Ekspor CSV closed</Link>}
      </div>
    </section>
    {context.mode==="fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — transaksi di sini tidak masuk jurnal production.</p>}
    {error && <p className="journal-alert" role="alert">{errorCopy[error] ?? errorCopy.unavailable}</p>}
    {!ready
      ? <section className="journal-panel"><h2>Schema jurnal belum tersedia</h2>
          <p>Migrasi M4 belum diterapkan atau pembacaan owner sedang gagal. Tidak ada angka demo yang ditampilkan sebagai hasil aktual.</p>
        </section>
      : <>
        {page===1 ? <section className="journal-metrics" aria-label="Ringkasan jurnal aktual">
          <div><span>Closed</span><strong>{summary?.closed ?? 0}</strong><small>Sampel statistik</small></div>
          <div><span>Posisi open</span><strong>{summary?.open ?? 0}</strong><small>Di luar win rate</small></div>
          <div><span>Net P&amp;L closed</span><strong>Rp{money(summary?.net_pnl_idr)}</strong><small>Sesudah fee per fill</small></div>
          <div><span>Win rate</span><strong>{summary?.win_rate==null?"—":ratio(Number(summary.win_rate)*100)+"%"}</strong><small>Breakeven ikut denominator</small></div>
        </section> : <p className="journal-footnote"><Link href="/journal">Ringkasan statistik ada pada halaman terbaru.</Link></p>}
        {page===1 && <p className="journal-footnote">Trade closed dengan biaya estimasi: {summary?.estimated_fee_trades ?? "belum tersedia"}. P&amp;L mengikuti status biaya yang dicatat, bukan jaminan biaya terverifikasi.</p>}
        <div className="journal-columns">
          <section className="journal-panel">
            <div className="journal-panel-heading"><div><span className="eyebrow">BUAT DRAFT</span><h2>Transaksi baru</h2></div><span className="badge neutral">Belum masuk statistik</span></div>
            <JournalForm className="journal-form">
              <input type="hidden" name="action" value="create"/>
              <input type="hidden" name="request_id" value={crypto.randomUUID()}/>
              <label>Kode saham<input name="ticker" placeholder="BBCA" pattern="[A-Za-z0-9]{2,12}" required maxLength={12}/></label>
              <label>Strategi utama<select name="primary_strategy" required>
                <option value="MACD_EMA200_V1">MACD + EMA200</option>
                <option value="FRACTAL_BREAKOUT_V1">Fractal breakout</option>
                <option value="RS_BREAKOUT_V1">Relative strength breakout</option>
                <option value="PULLBACK_RECLAIM_V1">Pullback reclaim</option>
              </select></label>
              <label>Initial stop · Rp<input name="initial_stop" type="number" min="0.0001" step="0.0001" required placeholder="95"/></label>
              <label>Rencana exit<select name="exit_mode">
                <option value="fixed_rr">Fixed 2R</option><option value="ma_close">SMA10 close → next open</option>
                <option value="manual">Manual / tanpa target otomatis</option>
              </select></label>
              <p className="journal-help">Draft belum punya harga entry. Risiko awal dihitung dari buy fills dan dikunci saat entry difinalisasi.</p>
              <button className="primary-button" type="submit">Buat draft</button>
            </JournalForm>
          </section>
          <section className="journal-panel journal-list">
            <div className="journal-panel-heading"><div><span className="eyebrow">RIWAYAT</span><h2>Trade aktual</h2></div><span className="muted small">Halaman {page} · 100 per halaman</span></div>
            {rows.length===0
              ? <div className="journal-empty"><h3>{page===1?"Belum ada transaksi aktual":"Tidak ada trade pada halaman ini"}</h3>
                  <p>{page===1?"Buat draft lalu catat buy fill sesuai konfirmasi broker. Jurnal paper tetap terpisah.":"Kembali ke halaman sebelumnya untuk melanjutkan riwayat."}</p></div>
              : <div className="journal-trades">{rows.map(t=><Link key={t.id} href={"/journal/"+t.id} className="journal-trade">
                  <div><strong>{t.ticker}</strong><span>{t.primary_strategy.replaceAll("_"," ")}</span></div>
                  <div><span className={"badge "+(t.status==="closed"?"green":t.status==="open"?"amber":"neutral")}>{t.status}</span>
                    <small>{t.status==="closed"?"Net Rp"+money(t.realized_pnl_idr)+" · "+ratio(t.realized_r)+"R":
                      t.open_quantity>0?t.open_quantity+" saham tersisa"+(t.status==="draft"?" · entry belum final":""):"Menunggu buy fill"}</small></div>
                </Link>)}</div>}
            {(page>1 || hasMore) && <nav className="journal-pagination" aria-label="Halaman riwayat trade">
              {page>1 && <Link href={page===2?"/journal":"/journal?page="+(page-1)}>← Lebih baru</Link>}
              {hasMore && <Link href={"/journal?page="+(page+1)}>Lebih lama →</Link>}
            </nav>}
          </section>
        </div>
        <p className="journal-footnote">Angka ini hanya jurnal aktual. Partial exit belum menjadi win/loss; initial risk tetap setelah stop digeser. Tampilan ini tidak menghitung hasil paper atau return portofolio.</p>
      </>}
  </JournalShell>;
}
