import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner, type ActualTrade } from "@/lib/journal-server";
import { JournalForm } from "@/components/journal-form";
import { journalPageNumber, journalPageSize } from "@/lib/journal-page";
import { parseActualAnalytics } from "@/lib/actual-analytics";
import { journalFilters, journalStrategies } from "@/lib/journal-filters";
import { PaperJournalPreview } from "@/components/paper-journal-preview";

export const dynamic = "force-dynamic";

const money = (v: string | number | null | undefined) => v == null ? "—" :
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(v));
const ratio = (v: string | number | null | undefined) => v == null ? "—" :
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(v));

const strategyNames: Record<string, string> = {
  MACD_EMA200_V1: "MACD + EMA200",
  FRACTAL_BREAKOUT_V1: "Fractal Breakout",
  RS_BREAKOUT_V1: "RS Breakout",
  PULLBACK_RECLAIM_V1: "Pullback Reclaim",
};

const errorCopy: Record<string, string> = {
  invalid_request: "Permintaan tidak lengkap. Muat ulang halaman dan coba lagi.",
  invalid_input: "Periksa ticker, harga, jumlah, tanggal, dan biaya.",
  "40001": "Data trade berubah. Muat ulang sebelum mengirim lagi.",
  PT412: "Data trade berubah. Muat ulang sebelum mengirim lagi.",
  "23514": "Aksi ditolak oleh aturan ledger. Periksa batas jumlah, risiko, atau status entry.",
  "22023": "Data yang dikirim tidak valid untuk trade ini.",
  "42501": "Sesi owner tidak memiliki izin untuk aksi ini.",
  unavailable: "Layanan jurnal belum siap. Periksa migrasi dan koneksi Supabase untuk environment ini.",
};

export default async function JournalPage({ searchParams }: {
  searchParams: Promise<Record<string,string | string[] | undefined>>;
}) {
  const context = await journalOwner();
  if (context.kind !== "ready") {
    return (
      <JournalShell mode={null}>
        <section className="journal-hero">
          <div>
            <span className="eyebrow">JURNAL TRANSAKSI</span>
            <h1>Jurnal belum dapat dibuka</h1>
            <p>
              {context.kind === "unconfigured" ? "Konfigurasi Supabase aplikasi belum tersedia."
                : context.kind === "unauthenticated" ? "Masuk dengan akun owner untuk melihat transaksi."
                : context.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif."
                : "Mode data proyek belum dapat diverifikasi."}
            </p>
          </div>
          <div className="journal-hero-actions">
            <Link className="primary-button" href="/login">Masuk sebagai owner</Link>
          </div>
        </section>
      </JournalShell>
    );
  }

  const query = await searchParams;
  const tab = query.tab === "paper" ? "paper" : "actual";
  if (tab === "paper") return (
    <JournalShell mode={context.mode}>
      <section className="journal-hero"><h1>Paper journal</h1><Link href="/journal">Jurnal aktual</Link><Link href="/analytics?tab=paper">Analitik paper</Link></section>
      <PaperJournalPreview mode={context.mode} view="journal" />
    </JournalShell>
  );
  const page = journalPageNumber(query.page);
  if (page === null) {
    return (
      <JournalShell mode={context.mode}>
        <section className="journal-hero">
          <div>
            <span className="eyebrow">NAVIGASI RIWAYAT</span>
            <h1>Halaman riwayat tidak valid</h1>
            <p>Nomor halaman harus berupa bilangan bulat positif.</p>
          </div>
          <div className="journal-hero-actions">
            <Link className="secondary-link" href="/journal">Kembali ke trade terbaru</Link>
          </div>
        </section>
      </JournalShell>
    );
  }

  let linkedSignal: {id:string;ticker:string;strategy:string} | null = null;
  if (query.signal_id !== undefined) {
    const validId=typeof query.signal_id === "string" && /^[0-9a-f]{64}$/.test(query.signal_id);
    const result=validId ? await context.supabase.from("signals")
      .select("id,ticker,strategy,data_mode,namespace").eq("id",query.signal_id!)
      .eq("data_mode",context.mode).eq("namespace","forward").maybeSingle() : null;
    const signal=result?.data;
    if (!signal || result?.error || signal.id !== query.signal_id || signal.data_mode !== context.mode
      || signal.namespace !== "forward" || !journalStrategies.includes(signal.strategy)
      || !/^[A-Z0-9]{2,12}$/.test(signal.ticker)) return (
      <JournalShell mode={context.mode}>
        <section className="journal-panel">
          <span className="eyebrow">DRAFT TRADE</span>
          <h1>Sinyal draft belum dapat diverifikasi</h1>
          <p style={{ marginTop: "8px" }}>Tidak ada draft atau fill yang dibuat. Pilih ulang sinyal dari scanner.</p>
          <div className="journal-actions">
            <Link className="secondary-link" href="/scanner">Kembali ke scanner</Link>
          </div>
        </section>
      </JournalShell>
    );
    linkedSignal=signal;
  }
  const [{ data: trades, error: tradesError }, analyticsResult] = await Promise.all([
    context.supabase.from("actual_trades")
      .select("id,ticker,data_mode,primary_strategy,status,revision,initial_stop,current_stop,initial_risk_idr,provisional_risk_idr,open_quantity,remaining_cost_idr,realized_pnl_idr,realized_r,fee_total_idr,exit_policy_snapshot,closed_at,created_at")
      .eq("data_mode", context.mode)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * journalPageSize, page * journalPageSize),
    page === 1 ? context.supabase.rpc("actual_journal_analytics") : Promise.resolve(null),
  ]);

  const summary = parseActualAnalytics(analyticsResult?.data,context.mode,journalFilters({})!);
  const ready = !tradesError && (page > 1 || (!analyticsResult?.error && summary !== null));
  const rows = ((trades ?? []) as ActualTrade[]).slice(0, journalPageSize);
  const hasMore = (trades?.length ?? 0) > journalPageSize;

  const error = typeof query.error === "string" ? query.error : null;

  return (
    <JournalShell mode={context.mode}>
      <section className="journal-hero">
        <div>
          <span className="eyebrow">JURNAL / AKTUAL / EOD</span>
          <h1>Catatan transaksi, satu ledger finansial.</h1>
          <p>
            Setiap fill dan biaya tercatat resmi. Partial exit tetap open; statistik performa hanya menghitung trade closed.
          </p>
        </div>
        <div className="journal-hero-actions">
          <Link href="/analytics">Buka Analytics →</Link>
          {ready && <Link href="/journal/export">Ekspor CSV Closed</Link>}
        </div>
      </section>

      {context.mode === "fixture" && (
        <p className="journal-banner">DATA UJI DEVELOPMENT — transaksi di sini tidak masuk jurnal production.</p>
      )}
      {error && <p className="journal-alert" role="alert">{errorCopy[error] ?? errorCopy.unavailable}</p>}

      {/* Subtab Selector: Jurnal Aktual vs Paper Journal */}
      <nav className="journal-history-tabs" aria-label="Pilih Mode Jurnal">
        <Link prefetch={false} aria-current={tab === "actual" ? "page" : undefined} href="/journal?tab=actual">
          Jurnal Aktual (Riil)
        </Link>
        <Link prefetch={false} aria-current={undefined} href="/journal?tab=paper">
          Paper Journal (Simulasi Sinyal)
        </Link>
      </nav>

      <>
          {!ready ? (
            <section className="journal-panel">
              <h2>Schema jurnal belum tersedia</h2>
              <p>Migrasi M4 belum diterapkan atau pembacaan owner sedang gagal. Tidak ada angka demo yang ditampilkan sebagai hasil aktual.</p>
            </section>
          ) : (
            <>
              {page === 1 ? (
                <section className="journal-metrics" aria-label="Ringkasan jurnal aktual">
                  <div><span>Closed</span><strong>{summary?.closed ?? 0}</strong><small>Sampel statistik</small></div>
                  <div><span>Posisi open</span><strong>{summary?.open ?? 0}</strong><small>Di luar win rate</small></div>
                  <div><span>Net P&amp;L closed</span><strong>Rp{money(summary?.net_pnl_idr)}</strong><small>Sesudah fee per fill</small></div>
                  <div><span>Win rate</span><strong>{summary?.win_rate == null ? "—" : ratio(Number(summary.win_rate) * 100) + "%"}</strong><small>Breakeven ikut denominator</small></div>
                </section>
              ) : (
                <p className="journal-footnote"><Link href="/journal">Ringkasan statistik ada pada halaman terbaru.</Link></p>
              )}

              {/* Collapsible Drawer for Creating New Trade Draft */}
              <details className="journal-drawer" open={linkedSignal !== null}>
                <summary>
                  <span>+ Buat Draft Transaksi Baru</span>
                  <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "normal" }}>Klik untuk membuka / menutup form</span>
                </summary>
                <div className="journal-drawer-body">
                  <JournalForm className="journal-form">
                    <input type="hidden" name="action" value="create"/>
                    <input type="hidden" name="request_id" value={crypto.randomUUID()}/>
                    {linkedSignal && <input type="hidden" name="signal_id" value={linkedSignal.id}/>}
                    <label>
                      Kode saham
                      <input name="ticker" defaultValue={linkedSignal?.ticker} readOnly={linkedSignal !== null} placeholder="BBCA" pattern="[A-Za-z0-9]{2,12}" required maxLength={12}/>
                    </label>
                    <label>
                      Strategi utama
                      <select name="primary_strategy" defaultValue={linkedSignal?.strategy} required>
                        <option value="MACD_EMA200_V1">MACD + EMA200</option>
                        <option value="FRACTAL_BREAKOUT_V1">Fractal breakout</option>
                        <option value="RS_BREAKOUT_V1">Relative strength breakout</option>
                        <option value="PULLBACK_RECLAIM_V1">Pullback reclaim</option>
                      </select>
                    </label>
                    <label>
                      Initial stop · Rp
                      <input name="initial_stop" type="number" min="0.0001" step="0.0001" required placeholder="95"/>
                    </label>
                    <label>
                      Rencana exit
                      <select name="exit_mode">
                        <option value="fixed_rr">Fixed 2R</option>
                        <option value="ma_close">SMA10 close → next open</option>
                        <option value="manual">Manual / tanpa target otomatis</option>
                      </select>
                    </label>
                    {linkedSignal && <p className="journal-help">Draft terkait sinyal terpilih. Konfirmasikan strategi dan stop; harga referensi bukan harga fill. Pencatatan draft tidak membuat transaksi broker.</p>}
                    <p className="journal-help">
                      Draft belum punya harga entry. Risiko awal dihitung dari buy fills dan dikunci saat entry difinalisasi.
                    </p>
                    <button className="primary-button" type="submit">Simpan Draft</button>
                  </JournalForm>
                </div>
              </details>

              {/* Full-Width Dense Financial Ledger Table */}
              <section className="journal-panel journal-full-panel">
                <div className="journal-toolbar">
                  <div>
                    <span className="eyebrow">BUKU BESAR AKTUAL</span>
                    <h2>Daftar Transaksi</h2>
                  </div>
                  <span className="muted small">Halaman {page} · {journalPageSize} baris per halaman</span>
                </div>

                {rows.length === 0 ? (
                  <div className="journal-empty">
                    <h3>{page === 1 ? "Belum ada transaksi aktual" : "Tidak ada trade pada halaman ini"}</h3>
                    <p>
                      {page === 1
                        ? "Buka drawer '+ Buat Draft Transaksi Baru' di atas untuk mencatat trade sesuai konfirmasi broker."
                        : "Kembali ke halaman sebelumnya untuk melanjutkan riwayat."}
                    </p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="dense-table">
                      <thead>
                        <tr>
                          <th className="text-left">Ticker</th>
                          <th className="text-left">Strategi</th>
                          <th className="text-center">Status</th>
                          <th className="text-right">Lot (Lembar)</th>
                          <th className="text-right">Initial SL</th>
                          <th className="text-right">Stop Terakhir</th>
                          <th className="text-right">Total Fee</th>
                          <th className="text-right">Realized P&amp;L (IDR)</th>
                          <th className="text-right">Realized R</th>
                          <th className="text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((t) => {
                          const lots = Math.floor(t.open_quantity / 100);
                          const isClosed = t.status === "closed";
                          const pnlNum = Number(t.realized_pnl_idr ?? 0);
                          return (
                            <tr key={t.id}>
                              <td className="text-left font-bold">
                                <Link href={"/journal/" + t.id} style={{ color: "var(--ink)", textDecoration: "none" }}>
                                  {t.ticker}
                                </Link>
                              </td>
                              <td className="text-left" style={{ fontSize: "11px" }}>
                                {strategyNames[t.primary_strategy] ?? t.primary_strategy}
                              </td>
                              <td className="text-center">
                                <span className={"subtle-badge " + (isClosed ? "emerald" : t.status === "open" ? "amber" : "gray")}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="text-right mono">
                                {isClosed ? (
                                  <span style={{ color: "var(--muted)" }}>0 lot (Closed)</span>
                                ) : t.open_quantity > 0 ? (
                                  `${lots} lot (${money(t.open_quantity)})`
                                ) : (
                                  <span style={{ color: "var(--muted)" }}>Menunggu fill</span>
                                )}
                              </td>
                              <td className="text-right mono">Rp{money(t.initial_stop)}</td>
                              <td className="text-right mono">Rp{money(t.current_stop)}</td>
                              <td className="text-right mono" style={{ color: "var(--muted)" }}>
                                Rp{money(t.fee_total_idr)}
                              </td>
                              <td className="text-right mono font-bold">
                                <span style={{ color: pnlNum > 0 ? "var(--green)" : pnlNum < 0 ? "var(--red)" : "inherit" }}>
                                  {pnlNum > 0 ? "+" : ""}Rp{money(t.realized_pnl_idr)}
                                </span>
                              </td>
                              <td className="text-right mono font-bold">
                                {isClosed && t.realized_r !== null ? (
                                  <span style={{ color: Number(t.realized_r) > 0 ? "var(--green)" : Number(t.realized_r) < 0 ? "var(--red)" : "inherit" }}>
                                    {Number(t.realized_r) > 0 ? "+" : ""}{ratio(t.realized_r)} R
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="text-center">
                                <Link
                                  href={"/journal/" + t.id}
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--line)",
                                    background: "#f9faf6",
                                    color: "var(--green)",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                  }}
                                >
                                  Kelola →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {(page > 1 || hasMore) && (
                  <nav className="journal-pagination" aria-label="Halaman riwayat trade" style={{ marginTop: "16px" }}>
                    {page > 1 && <Link href={page === 2 ? "/journal" : "/journal?page=" + (page - 1)}>← Lebih baru</Link>}
                    {hasMore && <Link href={"/journal?page=" + (page + 1)}>Lebih lama →</Link>}
                  </nav>
                )}
              </section>

              <p className="journal-footnote">
                Angka ini hanya jurnal aktual. Partial exit belum menjadi win/loss; initial risk tetap setelah stop digeser. Tampilan ini tidak menghitung return portofolio fiktif.
              </p>
            </>
          )}
      </>
    </JournalShell>
  );
}
