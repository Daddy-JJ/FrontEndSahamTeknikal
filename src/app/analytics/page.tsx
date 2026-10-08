import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { PersistentReporting, ReportingTabs, TradeDashboard, reportingFilters } from "@/components/trade-reporting";
import { journalOwner } from "@/lib/journal-server";
import { parseActualAnalytics } from "@/lib/actual-analytics";
import { parseTradeReporting, strategyLabels } from "@/lib/trade-reporting";
import { journalFilterParams, journalFilters, journalStrategies } from "@/lib/journal-filters";
export const dynamic = "force-dynamic";
const ratio = (v: string | number | null) => v === null ? "—" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(v));
export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await journalOwner();
  if (context.kind !== "ready") return <JournalShell mode={null}>
    <section className="journal-hero"><div><span className="eyebrow">ANALYTICS / PERFORMA</span><h1>Analitik belum dapat dibuka</h1>
      <p>{context.kind === "unconfigured" ? "Konfigurasi Supabase aplikasi belum tersedia."
        : context.kind === "unauthenticated" ? "Masuk dengan akun owner untuk melihat analisis performa."
        : context.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif." : "Mode data proyek belum dapat diverifikasi."}</p>
    </div><div className="journal-hero-actions"><Link className="primary-button" href="/login">Masuk sebagai owner</Link></div></section>
  </JournalShell>;
  const query = await searchParams;
  if (query.tab === "paper" || query.tab === "signals") return <JournalShell mode={context.mode}>
    <section className="journal-hero"><div><span className="eyebrow">ANALYTICS / PAPER / EOD</span><h1>{query.tab === "signals" ? "Kualitas sinyal, dengan sampel yang jelas." : "Performa paper, dari rencana sampai exit."}</h1><p>{query.tab === "signals" ? "Evaluasi sinyal terpisah dari hasil transaksi. Tidak ada auto-close pada sesi ke-5 atau ke-10." : "Fixed 2R dan SMA10 dilihat terpisah. Hasil net dihitung setelah kedua fee."}</p></div><Link href="/journal?tab=paper">Jurnal paper →</Link></section>
    <ReportingTabs tab={query.tab} />
    <PersistentReporting supabase={context.supabase} mode={context.mode} query={query} tab={query.tab === "signals" ? "signals" : "paper"} />
  </JournalShell>;
  const filters = journalFilters(query);
  const f = reportingFilters(query);
  if (!filters || !f || query.tab !== undefined && query.tab !== "actual") return <JournalShell mode={context.mode}>
    <ReportingTabs tab="actual" /><section className="journal-panel"><span className="eyebrow">FILTER COHORT</span><h1>Filter cohort tidak valid</h1>
      <p>Tanggal, strategi, halaman, atau konfigurasi exit tidak valid. Statistik tidak dimuat agar cohort tidak berubah tanpa persetujuan.</p><div className="journal-actions"><Link href="/analytics">Hapus filter</Link></div>
    </section></JournalShell>;
  const args = { p_from: filters.from, p_to: filters.to, p_strategy: filters.strategy, p_exit_version: filters.exitVersion, p_exit_snapshot: filters.exitSnapshot };
  const [legacy, reporting] = await Promise.all([
    context.supabase.rpc("actual_journal_analytics", args),
    context.supabase.rpc("read_trade_reporting_v1", { ...args, p_mode: "actual", p_exit_key: null, p_page: f.page }),
  ]);
  const summary = legacy.error ? null : parseActualAnalytics(legacy.data, context.mode, filters);
  const report = reporting.error ? null : parseTradeReporting(reporting.data, context.mode, "actual", f);
  if (!summary || !report) return <JournalShell mode={context.mode}><ReportingTabs tab="actual" />
    <section className="journal-panel" role="alert"><h1>Statistik belum dapat dibaca</h1>
      <p>Permintaan statistik gagal atau respons tidak cocok dengan mode dan cohort yang dipilih. Nilai performa tidak ditampilkan. Kontrak reporting versi baru memerlukan migrasi backend.</p>
      <Link prefetch={false} href={"/analytics?" + journalFilterParams(filters)}>Coba lagi</Link></section>
  </JournalShell>;
  const exportParams = journalFilterParams(filters).toString();
  return <JournalShell mode={context.mode}>
    <section className="journal-hero"><div><span className="eyebrow">ANALYTICS / AKTUAL / EOD</span><h1>Ukur proses, baca hasil deterministik.</h1>
      <p>Performa trade closed berdasarkan tanggal exit Asia/Jakarta dan biaya pada ledger. Posisi open terpisah dari win rate.</p></div>
      <div className="journal-hero-actions"><Link href="/journal">← Kembali ke Jurnal</Link><Link href={"/journal/export" + (exportParams ? "?" + exportParams : "")}>Ekspor CSV cohort</Link></div></section>
    {context.mode === "fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — bukan performa akun trading riil.</p>}
    <ReportingTabs tab="actual" />
    <section className="journal-panel" aria-label="Filter cohort statistik"><form className="journal-form" action="/analytics" method="get">
      <input type="hidden" name="tab" value="actual" />
      <label>Dari sesi exit<input type="date" name="from" defaultValue={filters.from ?? ""} /></label>
      <label>Sampai sesi exit<input type="date" name="to" defaultValue={filters.to ?? ""} /></label>
      <label>Strategi<select name="strategy" defaultValue={filters.strategy ?? ""}><option value="">Semua strategi</option>{journalStrategies.map(s => <option key={s} value={s}>{strategyLabels[s]}</option>)}</select></label>
      <label>Konfigurasi exit persis<select name="exit_snapshot" defaultValue={filters.exitSnapshotKey ?? ""}>
        <option value="">Semua konfigurasi</option><option value="fixed2r">Fixed 2R · actual-fixed2r-v1</option><option value="ma10">SMA10 · actual-ma10-v1</option><option value="manual">Manual · actual-manual-v1</option>
      </select></label>
      <label>Versi exit (opsional)<input name="exit_version" defaultValue={filters.exitVersion ?? ""} maxLength={60} pattern="[A-Za-z0-9_-]{1,60}" /></label>
      <button className="primary-button" type="submit">Terapkan cohort</button><Link href="/analytics?tab=actual">Hapus semua filter</Link>
    </form><p className="panel-note">Tanggal membatasi trade closed. Jumlah open dan draft memakai filter strategi/exit, tanpa batas tanggal exit.</p></section>
    <nav className="analytics-filter-row" aria-label="Filter cepat strategi">{[null, ...journalStrategies].map(s => <Link key={s ?? "all"} prefetch={false}
      href={"/analytics?tab=actual&" + journalFilterParams({ ...filters, strategy: s })} aria-current={filters.strategy === s ? "page" : undefined}>{s ? strategyLabels[s] : "Semua strategi"}</Link>)}</nav>
    <TradeDashboard report={report} f={f} />
    <section className="journal-panel" style={{ marginTop: 20 }}><h2>Kualitas ledger dan rasio tambahan</h2><dl className="journal-facts">
      <div><dt>Profit Factor</dt><dd>{summary.profit_factor_status === "no_losses" ? "Belum ada loss" : ratio(summary.profit_factor)}</dd></div>
      <div><dt>Payoff Ratio</dt><dd>{summary.payoff_status === "no_losses" ? "Belum ada loss" : summary.payoff_status === "no_wins" ? "Belum ada win" : ratio(summary.payoff_ratio)}</dd></div>
      <div><dt>Trade dengan Biaya Estimasi</dt><dd>{summary.estimated_fee_trades} trade</dd></div>
      <div><dt>Status Kualitas Fee</dt><dd>{summary.fee_quality === "actual" ? "Aktual dari broker" : summary.fee_quality === "includes_estimates" ? "Termasuk estimasi" : "Belum ada closed"}</dd></div>
    </dl><p className="panel-note">Profit factor dan payoff memakai net IDR canonical. Filter statistik dan CSV memakai cohort yang sama.</p></section>
  </JournalShell>;
}
