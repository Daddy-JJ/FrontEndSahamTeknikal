import Link from "next/link";
import { ChartOverlayLink } from "./chart-overlay";
import type { SupabaseClient } from "@supabase/supabase-js";
import { journalFilters, journalFilterParams } from "@/lib/journal-filters";
import { journalPageNumber } from "@/lib/journal-page";
import { ProcessingHealthNotice } from "@/components/processing-health";
import { chartIndicators, chartPageHref } from "@/lib/chart-navigation";
import {
  parseTradeReporting, parseSignalEvaluation, strategyLabels, reportingStrategies, evaluationKeys,
  type ReportingFilters, type TradeReporting, type SignalEvaluation, type ReportingCurvePoint, type ReportingTrade,
} from "@/lib/trade-reporting";

type Query = Record<string, string | string[] | undefined>;
export const reportMoney = (v: number | string | null) => v === null ? "—" : "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(v));
export const reportRatio = (v: number | string | null) => v === null ? "—" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(v));
const percent = (v: number | string | null) => v === null ? "—" : reportRatio(Number(v) * 100) + "%";
const statusLabels: Record<string, string> = {
  pending_entry: "Menunggu entry", open: "Open", closed: "Closed", skipped: "Dilewati", skipped_budget: "Budget tidak cukup",
  skipped_position: "Posisi aktif", expired: "Expired", data_hold: "Data tertahan", ambiguous: "Ambigu", ambiguous_review: "Ambigu", draft: "Draft",
};
export function reportingFilters(query: Query): ReportingFilters | null {
  const base = journalFilters(query);
  const page = journalPageNumber(query.page);
  const key = query.exit_key ?? "fixed2r";
  if (!base || page === null || !["fixed2r", "ma10"].includes(String(key)) || Array.isArray(key)) return null;
  return { ...base, exitKey: key as "fixed2r" | "ma10", page };
}
export function reportLink(base: "/analytics" | "/journal", tab: string, f: ReportingFilters, changes: Partial<ReportingFilters> = {}) {
  const current = { ...f, ...changes };
  const params = journalFilterParams({ ...current, exitSnapshotKey: current.exitSnapshotKey ?? null });
  params.set("tab", tab);
  if (tab !== "actual") params.set("exit_key", current.exitKey);
  if (current.page > 1) params.set("page", String(current.page));
  return base + "?" + params;
}
export function ActualCohortFilters({ f, view }: { f: ReportingFilters; view: "journal" | "analytics" }) {
  const action = view === "journal" ? "/journal" : "/analytics";
  return <section className="journal-panel reporting-filter-panel" aria-label="Filter cohort statistik"><form className="journal-form reporting-filter" action={action} method="get">
    <input type="hidden" name="tab" value="actual" />
    <label>Dari sesi exit<input type="date" name="from" defaultValue={f.from ?? ""} /></label>
    <label>Sampai sesi exit<input type="date" name="to" defaultValue={f.to ?? ""} /></label>
    <label>Strategi<select name="strategy" defaultValue={f.strategy ?? ""}><option value="">Semua strategi</option>{reportingStrategies.map(s => <option key={s} value={s}>{strategyLabels[s]}</option>)}</select></label>
    <label>Konfigurasi exit persis<select name="exit_snapshot" defaultValue={f.exitSnapshotKey ?? ""}>
      <option value="">Semua konfigurasi</option><option value="fixed2r">Fixed 2R · actual-fixed2r-v1</option><option value="ma10">SMA10 · actual-ma10-v1</option><option value="manual">Manual · actual-manual-v1</option>
    </select></label>
    <label>Versi exit (opsional)<input name="exit_version" defaultValue={f.exitVersion ?? ""} maxLength={60} pattern="[A-Za-z0-9_-]{1,60}" /></label>
    <button className="primary-button" type="submit">Terapkan cohort</button><Link href={action + "?tab=actual"}>Hapus semua filter</Link>
  </form><p className="panel-note">Tanggal membatasi trade closed berdasarkan sesi exit. Posisi open dan draft ditampilkan sebagai status terpisah tanpa batas tanggal exit.</p></section>;
}
export function JournalTabs({ tab }: { tab: "paper" | "actual" }) {
  return <nav className="journal-history-tabs" aria-label="Mode Jurnal">
    <Link prefetch={false} href="/journal?tab=actual" aria-current={tab === "actual" ? "page" : undefined}>Jurnal Aktual (Riil)</Link>
    <Link prefetch={false} href="/journal?tab=paper" aria-current={tab === "paper" ? "page" : undefined}>Paper Journal (Simulasi Sinyal)</Link>
  </nav>;
}
export function ReportingTabs({ tab }: { tab: "paper" | "actual" | "signals" }) {
  return <nav className="journal-history-tabs" aria-label="Mode Analitik">
    <Link prefetch={false} href="/analytics?tab=paper" aria-current={tab === "paper" ? "page" : undefined}>Paper</Link>
    <Link prefetch={false} href="/analytics?tab=actual" aria-current={tab === "actual" ? "page" : undefined}>Aktual</Link>
    <Link prefetch={false} href="/analytics?tab=signals" aria-current={tab === "signals" ? "page" : undefined}>Evaluasi Sinyal</Link>
  </nav>;
}
export function ReportingUnavailable({ missing = false }: { missing?: boolean }) {
  return <section className="journal-panel" role="alert">
    <h2>{missing ? "Backend reporting belum siap" : "Reporting belum dapat dibaca"}</h2>
    <p>{missing ? "Kontrak jurnal versi baru belum tersedia pada environment ini. Terapkan migrasi backend sebelum mengaktifkan model."
      : "Pembacaan gagal atau respons tidak cocok dengan mode, versi, dan cohort terpilih. Statistik tidak ditampilkan."}</p>
  </section>;
}
export function PnlCurve({ points }: { points: ReportingCurvePoint[] }) {
  if (points.length === 0) return <div className="journal-empty"><p>Belum ada trade closed dinilai pada cohort ini.</p></div>;
  const values = [0, ...points.map(p => Number(p.cumulative_pnl_idr))];
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const y = (v: number) => 200 - (v - min) / range * 160;
  const x = (i: number) => 70 + i / Math.max(points.length, 1) * 660;
  const coords = [x(0) + "," + y(0), ...points.map((p, i) => x(i + 1) + "," + y(Number(p.cumulative_pnl_idr)))].join(" ");
  return <svg className="reporting-curve" viewBox="0 0 800 245" role="img" aria-label="Kurva P&L net kumulatif IDR berdasarkan urutan exit">
    <line x1="70" y1={y(0)} x2="730" y2={y(0)} stroke="var(--line)" strokeDasharray="5 5" />
    <text x="64" y={y(0) + 4} textAnchor="end" fill="var(--muted)" fontSize="11">0</text>
    <text x="70" y="22" fill="var(--muted)" fontSize="12">{reportMoney(max)}</text>
    <text x="70" y="238" fill="var(--muted)" fontSize="12">{points[0].exit_session}</text>
    <text x="730" y="238" textAnchor="end" fill="var(--muted)" fontSize="12">{points.at(-1)!.exit_session}</text>
    <polyline points={coords} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinejoin="round" />
    {points.map((p, i) => <circle key={p.trade_id} cx={x(i + 1)} cy={y(Number(p.cumulative_pnl_idr))} r="4" fill={Number(p.realized_pnl_idr) < 0 ? "var(--red)" : "var(--green)"}>
      <title>{p.ticker + " · " + p.exit_session + " · net " + reportMoney(p.realized_pnl_idr) + " · kumulatif " + reportMoney(p.cumulative_pnl_idr)}</title>
    </circle>)}
  </svg>;
}
function Freshness({ report }: { report: TradeReporting | SignalEvaluation }) {
  const scope = report.mode === "signal_evaluation" ? "Data observasi" : "Data jurnal";
  const scanner = report.scanner_coverage;
  return <div className="reporting-freshness" role="status">
    <span className={"badge " + (report.coverage_status === "complete" ? "green" : "amber")}>{scope} {{
      complete: "lengkap", partial: "parsial", missing: "belum tersedia", stale: "stale",
    }[report.coverage_status]}</span>
    {report.mode !== "actual" && <span className={"badge " + (scanner?.status === "complete" ? "green" : "amber")} data-scanner-coverage={scanner?.status ?? "unavailable"}>
      {scanner ? {
        complete: "Scanner lengkap", partial: "Scanner parsial", failed: "Scanner gagal", missing: "Scanner belum tersedia",
      }[scanner.status] : "Coverage scanner belum tersedia"}
      {scanner?.coverage_valid !== null && scanner?.coverage_valid !== undefined && scanner.coverage_total !== null
        ? " · " + scanner.coverage_valid + "/" + scanner.coverage_total : ""}
      {scanner?.session_date ? " · sesi " + scanner.session_date : ""}
    </span>}
    <span>{report.mode === "signal_evaluation" ? "State observasi per sesi" : report.mode === "paper" ? "State jurnal per sesi" : "Laporan aktual per sesi"} {report.as_of_session ?? "belum tersedia"} · diperbarui {report.updated_at ? new Date(report.updated_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : "belum tersedia"}</span>
    <span className="reporting-version">{report.model_version ?? "ledger aktual"}</span>
  </div>;
}
function FilterForm({ tab, f, view }: { tab: "paper" | "signals"; f: ReportingFilters; view: "analytics" | "journal" }) {
  return <section className="journal-panel reporting-filter-panel" aria-label="Filter cohort statistik">
    <form className="journal-form reporting-filter" action={view === "journal" ? "/journal" : "/analytics"} method="get">
      <input type="hidden" name="tab" value={tab} />
      <label>Dari sesi {tab === "signals" ? "sinyal" : "exit"}<input type="date" name="from" defaultValue={f.from ?? ""} /></label>
      <label>Sampai sesi {tab === "signals" ? "sinyal" : "exit"}<input type="date" name="to" defaultValue={f.to ?? ""} /></label>
      <label>Strategi<select name="strategy" defaultValue={f.strategy ?? ""}><option value="">Semua strategi</option>
        {reportingStrategies.map(s => <option key={s} value={s}>{strategyLabels[s]}</option>)}</select></label>
      {tab === "paper" && <label>Eksperimen exit<select name="exit_key" defaultValue={f.exitKey}>
        <option value="fixed2r">Fixed 2R</option><option value="ma10">SMA10 close → next open</option>
      </select></label>}
      <button className="primary-button" type="submit">Terapkan cohort</button>
    </form>
    <p className="panel-note">{tab === "signals" ? "Tanggal membatasi sinyal. Observasi 5/10 sesi adalah checkpoint evaluasi, bukan auto-close."
      : "Tanggal membatasi trade closed. Status yang belum exit ditampilkan terpisah tanpa batas tanggal exit."}</p>
  </section>;
}
function Money({ value }: { value: number | string | null }) {
  return <span className="reporting-money">{reportMoney(value)}</span>;
}
function SignalChartLink({ ticker, id, strategy, returnTo, label = "Saat sinyal" }: {
  ticker: string; id: string; strategy: string; returnTo?: string; label?: string;
}) {
  const href = chartPageHref({ ticker, context: "signal", context_id: id, view: "snapshot", timeframe: "1d", limit: 250 }, returnTo, chartIndicators(strategy));
  return href ? <ChartOverlayLink label={"Chart " + ticker + " " + label} href={href}>{label}</ChartOverlayLink> : null;
}
function TradeChartLinks({ trade: t, mode, returnTo, exitFamily }: {
  trade: ReportingTrade; mode: "paper" | "actual"; returnTo?: string; exitFamily?: string | null;
}) {
  const href = chartPageHref({ ticker: t.ticker, context: mode, context_id: t.id, view: "followup", timeframe: "1d", limit: 250 }, returnTo, chartIndicators(t.strategy, exitFamily));
  return <small>{href && <ChartOverlayLink label={"Chart " + t.ticker} href={href}>Chart</ChartOverlayLink>}
    {t.signal_id && <>{href ? " · " : ""}<SignalChartLink ticker={t.ticker} id={t.signal_id} strategy={t.strategy} returnTo={returnTo} /></>}</small>;
}
export function TradeRows({ trades, mode, returnTo, exitFamily }: { trades: ReportingTrade[]; mode: "paper" | "actual"; returnTo?: string; exitFamily?: string | null }) {
  if (!trades.length) return <div className="journal-empty"><h3>Belum ada transaksi pada halaman ini</h3><p>Rencana paper baru tercatat otomatis dari sinyal valid setelah aktivasi model.</p></div>;
  return <div className="reporting-list reporting-table-region" role="region" tabIndex={0} aria-label="Tabel transaksi dan eligibility"><table className="dense-table reporting-trades"><thead><tr>
    <th>Ticker / Strategi</th><th>Status</th><th className="reporting-numeric">Entry / Sesi</th><th className="reporting-numeric">Lot</th><th className="reporting-numeric">SL awal</th><th className="reporting-numeric">Risiko harga awal</th><th className="reporting-numeric">Planned loss + fee</th><th className="reporting-numeric">Exit / Sesi</th><th className="reporting-numeric">Total fee</th><th className="reporting-numeric">P&amp;L net / R</th><th>Rincian</th>
  </tr></thead><tbody>{trades.map(t => <tr key={t.id}>
    <td data-label="Ticker / Strategi"><strong>{t.ticker}</strong><small>{strategyLabels[t.strategy]}</small></td>
    <td data-label="Status"><span className={"badge " + (t.ambiguous || t.state === "data_hold" ? "amber" : "neutral")}>{t.ambiguous ? "Ambigu" : statusLabels[t.state] ?? t.state}</span><small>{t.reason}</small></td>
    <td data-label="Entry / Sesi" className="reporting-numeric"><Money value={t.entry_price} /><small>{t.entry_session ?? "—"}</small></td>
    <td data-label="Lot" className="reporting-numeric">{t.lots ?? "—"}</td><td data-label="SL awal" className="reporting-numeric"><Money value={t.initial_stop} /></td><td data-label="Risiko harga awal" className="reporting-numeric"><Money value={t.initial_price_risk_idr} /></td><td data-label="Planned loss + fee" className="reporting-numeric"><Money value={t.planned_loss_idr} /></td>
    <td data-label="Exit / Sesi" className="reporting-numeric"><Money value={t.exit_price} /><small>{t.exit_session ?? "—"}</small></td><td data-label="Total fee" className="reporting-numeric"><Money value={t.fee_total_idr} /></td>
    <td data-label="P&L net / R" className={"reporting-numeric " + (t.realized_pnl_idr === null ? "reporting-null" : Number(t.realized_pnl_idr) < 0 ? "negative" : Number(t.realized_pnl_idr) > 0 ? "positive" : "neutral")}><Money value={t.realized_pnl_idr} /><small>{reportRatio(t.realized_r)} R</small></td>
    <td data-label="Rincian"><small>{t.metric_eligible === undefined ? "Eligibility backend belum tersedia" : t.metric_eligible ? "Dinilai dalam statistik utama" : "Di luar statistik utama · " + (t.exclusion_reason ?? t.state)}</small><Link prefetch={false} href={(mode === "paper" ? "/journal/paper/" : "/journal/") + encodeURIComponent(t.id) + (returnTo ? "?return_to=" + encodeURIComponent(returnTo) : "")}>Lihat →</Link>
      <TradeChartLinks trade={t} mode={mode} returnTo={returnTo} exitFamily={exitFamily} />
    </td>
  </tr>)}</tbody></table></div>;
}
export function TradeDashboard({ report, f, view = "analytics" }: { report: TradeReporting; f: ReportingFilters; view?: "analytics" | "journal" }) {
  const base = view === "journal" ? "/journal" : "/analytics";
  const s = report.summary;
  return <div className="reporting-stack">
    <Freshness report={report} />
    {report.mode === "paper" && view !== "journal" && <ProcessingHealthNotice health={report.processing_health} />}
    <section className="analytics-hero-stats" aria-label="Ringkasan performa net">
      <div className="analytics-stat-card"><span>P&amp;L net closed</span><strong>{reportMoney(s.net_pnl_idr)}</strong><small>{s.closed} closed dinilai · sesudah fee</small></div>
      <div className="analytics-stat-card"><span>Win Rate (Closed)</span><strong>{percent(s.win_rate)}</strong><small>{s.wins} menang · {s.losses} kalah · {s.breakeven} BEP</small><small>{s.wins} / {s.closed} dinilai</small></div>
      <div className="analytics-stat-card"><span>Expectancy net</span><strong>{reportMoney(s.expectancy_idr)}</strong><small>{reportRatio(s.expectancy_r)} R per closed dinilai</small></div>
      <div className="analytics-stat-card"><span>Drawdown closed-P&amp;L</span><strong>{reportMoney(s.max_drawdown_idr)}</strong><small>Penurunan maksimum dari puncak realized</small></div>
    </section>
    {report.mode === "paper" && <section className="journal-panel"><h2>Rasio net · IDR</h2>
      {s.profit_factor_state === undefined || s.payoff_ratio_state === undefined ? <p>Status rasio backend belum tersedia. Profit factor dan payoff tidak dihitung di browser.</p> : <dl className="journal-facts">
        <div><dt>Profit factor</dt><dd>{ratioLabel(s.profit_factor_idr ?? null, s.profit_factor_state)}</dd></div>
        <div><dt>Payoff ratio</dt><dd>{ratioLabel(s.payoff_ratio_idr ?? null, s.payoff_ratio_state)}</dd></div>
      </dl>}
    </section>}
    <section className="reporting-statuses" aria-label="Status di luar statistik utama">
      {Object.entries(report.statuses).map(([key, value]) => <div key={key}><span>{statusLabels[key]}</span><strong>{value}</strong></div>)}
    </section>
    {view === "analytics" && <>
      <div className="reporting-analysis-grid">
      <section className="journal-panel"><span className="eyebrow">HASIL CLOSED · IDR</span><h2>Kurva P&amp;L net kumulatif</h2><PnlCurve points={report.curve} /><p className="panel-note">Urutan exit; posisi open dan hasil ambigu tidak masuk kurva utama. Ini bukan equity mark-to-market.</p></section>
      <section className="journal-panel"><span className="eyebrow">MENANG / DINILAI</span><h2>Performa per strategi</h2>
        <div className="table-scroll reporting-table-region" role="region" tabIndex={0} aria-label="Tabel performa per strategi"><table className="dense-table"><thead><tr><th>Strategi</th><th className="reporting-numeric">Closed dinilai</th><th className="reporting-numeric">Menang / Kalah / Impas</th><th className="reporting-numeric">Win rate net</th><th className="reporting-numeric">P&amp;L net</th><th className="reporting-numeric">Expectancy net</th><th className="reporting-numeric">Expectancy R</th></tr></thead>
          <tbody>{report.strategies.map(row => <tr key={row.strategy}>
            <td><Link prefetch={false} href={reportLink(base, report.mode, f, { strategy: row.strategy, page: 1 }) + "#reporting-trades"}>{strategyLabels[row.strategy]}</Link></td>
            <td className="reporting-numeric">{row.closed}</td><td className="reporting-numeric">{row.wins} / {row.losses} / {row.breakeven}</td><td className="reporting-numeric">{percent(row.win_rate)}<small>{row.wins} / {row.closed} dinilai</small></td>
            <td className="reporting-numeric">{reportMoney(row.net_pnl_idr)}</td><td className="reporting-numeric">{reportMoney(row.expectancy_idr)}</td><td className="reporting-numeric">{reportRatio(row.expectancy_r)} R</td>
          </tr>)}</tbody></table></div>
      </section>
      </div>
      {report.sensitivities && report.statuses.ambiguous > 0 && <details className="journal-panel"><summary>Sensitivitas hasil ambigu</summary><div className="reporting-sensitivity">
        {(["sl_first", "tp_first"] as const).map(k => <div key={k}><h3>{k === "sl_first" ? "SL-first" : "TP-first"}</h3><p>{reportMoney(report.sensitivities![k].net_pnl_idr)} · {percent(report.sensitivities![k].win_rate)}</p><small>{report.sensitivities![k].wins} menang / {report.sensitivities![k].closed} dinilai</small></div>)}
      </div><p className="panel-note">Skenario alternatif, bukan urutan intraday yang diketahui.</p></details>}
      {report.mode === "paper" && <ExperimentComparisonPanel report={report} />}
    </>}
    <section className="journal-panel" id="reporting-trades"><div className="journal-toolbar"><h2>{view === "journal" ? "Jurnal paper persisten" : "Transaksi dan eligibility statistik"}</h2><span className="muted small">Halaman {f.page} · 25 baris</span></div>
      <p className="panel-note">Hanya closed eligible dalam periode exit masuk statistik utama. Status belum exit berasal dari histori dengan filter strategi/exit yang sama.</p>
      {report.exclusions && <p className="panel-note">Closed dikecualikan: {report.exclusions.closed_excluded}{Object.entries(report.exclusions.reasons).map(([reason, total]) => " · " + reason + ": " + total).join("")}</p>}
      <TradeRows trades={report.trades} mode={report.mode} returnTo={reportLink(base, report.mode, f)} exitFamily={report.mode === "paper" ? f.exitKey : f.exitSnapshotKey} />
      <nav className="journal-pagination" aria-label="Halaman reporting">{f.page > 1 && <Link prefetch={false} href={reportLink(base, report.mode, f, { page: f.page - 1 })}>← Sebelumnya</Link>}{report.paging.has_more && <Link prefetch={false} href={reportLink(base, report.mode, f, { page: f.page + 1 })}>Berikutnya →</Link>}</nav>
    </section>
    <p className="journal-footnote">{report.mode === "paper" ? "Entry simulasi memakai close hari sinyal pada sesi berikutnya. Planned loss pada SL maksimal Rp1 juta termasuk fee beli 0,15% dan jual pada SL 0,25%; lot dibulatkan turun. Fixed 2R dan SMA10 adalah eksperimen terpisah. " : ""}Realized R memakai initial price risk yang dibekukan. SMA10 memerlukan close terkonfirmasi di bawah SMA10, lalu exit next-open; SL awal tetap aktif.</p>
    {report.mode === "paper" && view === "journal" && <ProcessingHealthNotice health={report.processing_health} />}
  </div>;
}
function ratioLabel(value: number | string | null, state: string) {
  return state === "finite" ? reportRatio(value) : ({ no_closed: "Belum ada closed", no_losses: "Belum ada loss", no_wins: "Belum ada win", no_directional_results: "Hanya hasil impas" } as Record<string, string>)[state] ?? "Belum tersedia";
}
function ExperimentComparisonPanel({ report }: { report: TradeReporting }) {
  const c = report.experiment_comparison;
  if (!c) return <section className="journal-panel"><h2>Perbandingan sampel eksperimen</h2><p>Kapabilitas perbandingan backend belum tersedia. Kedua eksperimen tetap ditampilkan terpisah.</p></section>;
  return <section className="journal-panel"><h2>Perbandingan sampel eksperimen</h2>
    <p className="panel-note">Basis periode exit dan posisi aktif. Sampel entry bersama: {c.common_entry_signal_ids.length}; hanya Fixed 2R: {c.fixed_only_entry_signal_ids.length}; hanya SMA10: {c.sma_only_entry_signal_ids.length}. Hasil kedua eksperimen tidak dijumlahkan menjadi profit portofolio.</p>
    <div className="table-scroll reporting-table-region" role="region" tabIndex={0} aria-label="Tabel perbandingan eksperimen"><table className="dense-table"><thead><tr><th>Eksperimen</th><th className="reporting-numeric">Entry</th><th className="reporting-numeric">Closed dinilai</th><th className="reporting-numeric">Open</th><th className="reporting-numeric">Menunggu entry</th><th className="reporting-numeric">Dilewati</th><th className="reporting-numeric">Dikecualikan</th><th className="reporting-numeric">Rata-rata holding · sesi</th><th className="reporting-numeric">Net IDR</th></tr></thead><tbody>{(["fixed2r", "ma10"] as const).map(key => <tr key={key}><td>{key === "fixed2r" ? "Fixed 2R" : "SMA10"}</td><td className="reporting-numeric">{c[key].entered}</td><td className="reporting-numeric">{c[key].closed_assessed}</td><td className="reporting-numeric">{c[key].open}</td><td className="reporting-numeric">{c[key].pending_entry}</td><td className="reporting-numeric">{c[key].skipped}</td><td className="reporting-numeric">{c[key].excluded}</td><td className="reporting-numeric">{reportRatio(c[key].mean_holding_sessions)}</td><td className="reporting-numeric">{reportMoney(c[key].summary.net_pnl_idr)}</td></tr>)}</tbody></table></div>
    <details><summary>Entry bersama dan hasil masing-masing</summary>{c.paired.length === 0 ? <p>Belum ada entry bersama pada cohort ini.</p> : c.paired.map(p => <div key={p.signal_id} className="panel-note"><strong>{p.ticker} · {strategyLabels[p.strategy]}</strong>{(["fixed2r", "ma10"] as const).map(key => <p key={key}>{key === "fixed2r" ? "Fixed 2R" : "SMA10"}: <Link prefetch={false} href={"/journal/paper/" + encodeURIComponent(p[key].trade_id)}>{statusLabels[p[key].state] ?? p[key].state}</Link> · {p[key].metric_eligible ? reportMoney(p[key].pnl_idr) : "Belum dinilai dalam statistik utama"} · holding {p[key].holding_sessions ?? "—"} sesi</p>)}</div>)}</details>
  </section>;
}
const evaluationLabels = { target_1r: "1R sebelum SL", target_2r: "2R sebelum SL", net_5: "Profit net tanpa SL · 5 sesi", net_10: "Profit net tanpa SL · 10 sesi" };
function EvaluationDashboard({ report, f }: { report: SignalEvaluation; f: ReportingFilters }) {
  return <div className="reporting-stack"><Freshness report={report} /><ProcessingHealthNotice health={report.processing_health} />
    <section className="journal-panel"><span className="eyebrow">MENANG / DINILAI · OBSERVASI SINYAL</span><h2>Evaluasi per jenis sinyal</h2>
      <p className="panel-note">Checkpoint 5/10 sesi tidak menutup posisi. Evaluasi sinyal tetap berjalan terpisah dari exit jurnal Fixed 2R atau SMA10.</p>
      <div className="table-scroll reporting-table-region" role="region" tabIndex={0} aria-label="Tabel evaluasi per jenis sinyal"><table className="dense-table evaluation-matrix"><thead><tr><th>Jenis sinyal</th>{evaluationKeys.map(k => <th key={k}>{evaluationLabels[k]}</th>)}</tr></thead>
        <tbody>{report.strategies.map(row => <tr key={row.strategy}><td><Link prefetch={false} href={reportLink("/analytics", "signals", f, { strategy: row.strategy, page: 1 }) + "#signal-observations"}>{strategyLabels[row.strategy]}</Link><small>{row.signals} kemunculan</small></td>
          {evaluationKeys.map(k => { const c = row.cells[k]; return <td key={k}><strong>{percent(c.win_rate)}</strong><span>{c.wins} / {c.assessed} dinilai</span><small>{c.pending} menunggu · {c.ambiguous} ambigu</small><small>{c.data_hold} data tertahan · {c.excluded} dikecualikan</small>
            {Object.keys(c.excluded_reasons).length > 0 && <details><summary>Alasan pengecualian</summary>{Object.entries(c.excluded_reasons).map(([reason, count]) => <small key={reason}>{reason}: {count}</small>)}</details>}</td>; })}
        </tr>)}</tbody></table></div>
    </section>
    <section className="journal-panel" id="signal-observations"><h2>Observasi sinyal pembentuk matriks</h2>
      {report.evaluations.length === 0 ? <div className="journal-empty"><p>Belum ada observasi sinyal pada halaman ini.</p></div> : <div className="reporting-list reporting-table-region" role="region" tabIndex={0} aria-label="Tabel observasi sinyal"><table className="dense-table"><thead><tr><th>Ticker / Sinyal</th><th className="reporting-numeric">Entry referensi / SL</th><th className="reporting-numeric">Sesi teramati</th>{evaluationKeys.map(k => <th key={k}>{evaluationLabels[k]}</th>)}</tr></thead><tbody>{report.evaluations.map(e => <tr key={e.signal_id}>
        <td data-label="Ticker / Sinyal">{e.ticker}<small>{strategyLabels[e.strategy]} · {e.signal_session}</small><SignalChartLink ticker={e.ticker} id={e.signal_id} strategy={e.strategy} returnTo={reportLink("/analytics", "signals", f)} label="Chart saat sinyal" /><details><summary>Sumber sinyal</summary><small className="mono">{e.signal_id}</small><small>Target 1R: {reportMoney(e.target_1r)}; 2R: {reportMoney(e.target_2r)}</small></details></td><td data-label="Entry referensi / SL" className="reporting-numeric">{reportMoney(e.entry_price)} / {reportMoney(e.initial_stop)}<small>Entry {e.entry_session}</small></td><td data-label="Sesi teramati" className="reporting-numeric">{e.observed_sessions}</td>{evaluationKeys.map(k => <td data-label={evaluationLabels[k]} key={k}>{({ won: "Berhasil", lost: "Gagal", pending: "Menunggu", ambiguous: "Ambigu", data_hold: "Data tertahan", excluded: "Dikecualikan" } as Record<string, string>)[e.results[k]]}</td>)}
      </tr>)}</tbody></table></div>}
      <nav className="journal-pagination" aria-label="Halaman observasi">{f.page > 1 && <Link prefetch={false} href={reportLink("/analytics", "signals", f, { page: f.page - 1 })}>← Sebelumnya</Link>}{report.paging.has_more && <Link prefetch={false} href={reportLink("/analytics", "signals", f, { page: f.page + 1 })}>Berikutnya →</Link>}</nav>
    </section>
  </div>;
}
export async function PersistentReporting({ supabase, mode, query, view = "analytics", tab = "paper" }: {
  supabase: SupabaseClient; mode: "fixture" | "live"; query: Query; view?: "analytics" | "journal"; tab?: "paper" | "signals";
}) {
  const f = reportingFilters(query);
  if (!f || f.exitSnapshot || f.exitVersion) return <section className="journal-panel"><h1>Filter cohort tidak valid</h1><p>Periksa tanggal, strategi, halaman, dan eksperimen paper. Filter aktual tidak berlaku pada model paper.</p></section>;
  const result = tab === "signals" ? await supabase.rpc("read_signal_evaluation_v1", {
    p_from: f.from, p_to: f.to, p_strategy: f.strategy, p_page: f.page,
  }) : await supabase.rpc("read_trade_reporting_v1", {
    p_mode: "paper", p_from: f.from, p_to: f.to, p_strategy: f.strategy, p_exit_key: f.exitKey, p_page: f.page,
    p_exit_version: null, p_exit_snapshot: null,
  });
  const report = result.error ? null : tab === "signals" ? parseSignalEvaluation(result.data, mode, f) : parseTradeReporting(result.data, mode, "paper", f);
  return <>
    {mode === "fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — bukan hasil pasar atau akun riil.</p>}
    <FilterForm tab={tab} f={f} view={view} />
    {!report ? <ReportingUnavailable missing={["PGRST202", "42883", "PGRST205"].includes(result.error?.code ?? "")} />
      : tab === "signals" ? <EvaluationDashboard report={report as SignalEvaluation} f={f} /> : <TradeDashboard report={report as TradeReporting} f={f} view={view} />}
  </>;
}
