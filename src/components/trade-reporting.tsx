import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { journalFilters, journalFilterParams } from "@/lib/journal-filters";
import { journalPageNumber } from "@/lib/journal-page";
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
function reportLink(base: "/analytics" | "/journal", tab: string, f: ReportingFilters, changes: Partial<ReportingFilters> = {}) {
  const current = { ...f, ...changes };
  const params = journalFilterParams({ ...current, exitSnapshotKey: current.exitSnapshotKey ?? null });
  params.set("tab", tab);
  if (tab !== "actual") params.set("exit_key", current.exitKey);
  if (current.page > 1) params.set("page", String(current.page));
  return base + "?" + params;
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
  return <div className="reporting-freshness" role="status">
    <span className={"badge " + (report.coverage_status === "complete" ? "green" : "amber")}>{{
      complete: "Coverage lengkap", partial: "Coverage parsial", missing: "Data belum tersedia", stale: "Data stale",
    }[report.coverage_status]}</span>
    <span>Harga sampai {report.as_of_session ?? "belum tersedia"} · diperbarui {report.updated_at ? new Date(report.updated_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : "belum tersedia"}</span>
    <span className="reporting-version">{report.model_version ?? "ledger aktual"}</span>
  </div>;
}
function FilterForm({ tab, f, view }: { tab: "paper" | "signals"; f: ReportingFilters; view: "analytics" | "journal" }) {
  return <section className="journal-panel">
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
export function TradeRows({ trades, mode }: { trades: ReportingTrade[]; mode: "paper" | "actual" }) {
  if (!trades.length) return <div className="journal-empty"><h3>Belum ada transaksi pada halaman ini</h3><p>Rencana paper baru tercatat otomatis dari sinyal valid setelah aktivasi model.</p></div>;
  return <div className="reporting-list"><table className="dense-table reporting-trades"><thead><tr>
    <th>Ticker / Strategi</th><th>Status</th><th>Entry / Sesi</th><th>Lot</th><th>SL awal</th><th>Risiko harga awal</th><th>Planned loss + fee</th><th>Exit / Sesi</th><th>Total fee</th><th>P&amp;L net / R</th><th>Rincian</th>
  </tr></thead><tbody>{trades.map(t => <tr key={t.id}>
    <td data-label="Ticker / Strategi"><strong>{t.ticker}</strong><small>{strategyLabels[t.strategy]}</small></td>
    <td data-label="Status"><span className={"badge " + (t.ambiguous || t.state === "data_hold" ? "amber" : "neutral")}>{t.ambiguous ? "Ambigu" : statusLabels[t.state] ?? t.state}</span><small>{t.reason}</small></td>
    <td data-label="Entry / Sesi">{reportMoney(t.entry_price)}<small>{t.entry_session ?? "—"}</small></td>
    <td data-label="Lot">{t.lots ?? "—"}</td><td data-label="SL awal">{reportMoney(t.initial_stop)}</td><td data-label="Risiko harga awal">{reportMoney(t.initial_price_risk_idr)}</td><td data-label="Planned loss + fee">{reportMoney(t.planned_loss_idr)}</td>
    <td data-label="Exit / Sesi">{reportMoney(t.exit_price)}<small>{t.exit_session ?? "—"}</small></td><td data-label="Total fee">{reportMoney(t.fee_total_idr)}</td>
    <td data-label="P&L net / R" className={Number(t.realized_pnl_idr) < 0 ? "negative" : "positive"}>{reportMoney(t.realized_pnl_idr)}<small>{reportRatio(t.realized_r)} R</small></td>
    <td data-label="Rincian"><Link prefetch={false} href={mode === "paper" ? "/journal/paper/" + encodeURIComponent(t.id) : "/journal/" + encodeURIComponent(t.id)}>Lihat →</Link></td>
  </tr>)}</tbody></table></div>;
}
export function TradeDashboard({ report, f, view = "analytics" }: { report: TradeReporting; f: ReportingFilters; view?: "analytics" | "journal" }) {
  const base = view === "journal" ? "/journal" : "/analytics";
  const s = report.summary;
  return <div className="reporting-stack">
    <Freshness report={report} />
    <section className="analytics-hero-stats" aria-label="Ringkasan performa net">
      <div className="analytics-stat-card"><span>P&amp;L net closed</span><strong>{reportMoney(s.net_pnl_idr)}</strong><small>{s.closed} closed dinilai · sesudah fee</small></div>
      <div className="analytics-stat-card"><span>Win Rate (Closed)</span><strong>{percent(s.win_rate)}</strong><small>{s.wins} menang · {s.losses} kalah · {s.breakeven} BEP</small><small>{s.wins} / {s.closed} dinilai</small></div>
      <div className="analytics-stat-card"><span>Expectancy net</span><strong>{reportMoney(s.expectancy_idr)}</strong><small>{reportRatio(s.expectancy_r)} R per closed dinilai</small></div>
      <div className="analytics-stat-card"><span>Drawdown closed-P&amp;L</span><strong>{reportMoney(s.max_drawdown_idr)}</strong><small>Penurunan maksimum dari puncak realized</small></div>
    </section>
    <section className="reporting-statuses" aria-label="Status di luar statistik utama">
      {Object.entries(report.statuses).map(([key, value]) => <div key={key}><span>{statusLabels[key]}</span><strong>{value}</strong></div>)}
    </section>
    {view === "analytics" && <>
      <section className="journal-panel"><span className="eyebrow">HASIL CLOSED · IDR</span><h2>Kurva P&amp;L net kumulatif</h2><PnlCurve points={report.curve} /><p className="panel-note">Urutan exit; posisi open dan hasil ambigu tidak masuk kurva utama. Ini bukan equity mark-to-market.</p></section>
      <section className="journal-panel"><span className="eyebrow">MENANG / DINILAI</span><h2>Performa per strategi</h2>
        <div className="table-scroll"><table className="dense-table"><thead><tr><th>Strategi</th><th>Closed dinilai</th><th>Menang / Kalah / Impas</th><th>Win rate net</th><th>P&amp;L net</th><th>Expectancy net</th><th>Expectancy R</th></tr></thead>
          <tbody>{report.strategies.map(row => <tr key={row.strategy}>
            <td><Link prefetch={false} href={reportLink(base, report.mode, f, { strategy: row.strategy, page: 1 }) + "#reporting-trades"}>{strategyLabels[row.strategy]}</Link></td>
            <td>{row.closed}</td><td>{row.wins} / {row.losses} / {row.breakeven}</td><td>{percent(row.win_rate)}<small>{row.wins} / {row.closed} dinilai</small></td>
            <td>{reportMoney(row.net_pnl_idr)}</td><td>{reportMoney(row.expectancy_idr)}</td><td>{reportRatio(row.expectancy_r)} R</td>
          </tr>)}</tbody></table></div>
      </section>
      {report.sensitivities && report.statuses.ambiguous > 0 && <details className="journal-panel"><summary>Sensitivitas hasil ambigu</summary><div className="reporting-sensitivity">
        {(["sl_first", "tp_first"] as const).map(k => <div key={k}><h3>{k === "sl_first" ? "SL-first" : "TP-first"}</h3><p>{reportMoney(report.sensitivities![k].net_pnl_idr)} · {percent(report.sensitivities![k].win_rate)}</p><small>{report.sensitivities![k].wins} menang / {report.sensitivities![k].closed} dinilai</small></div>)}
      </div><p className="panel-note">Skenario alternatif, bukan urutan intraday yang diketahui.</p></details>}
    </>}
    <section className="journal-panel" id="reporting-trades"><div className="journal-toolbar"><h2>{view === "journal" ? "Jurnal paper persisten" : "Transaksi pembentuk statistik"}</h2><span className="muted small">Halaman {f.page} · 25 baris</span></div><TradeRows trades={report.trades} mode={report.mode} />
      <nav className="journal-pagination" aria-label="Halaman reporting">{f.page > 1 && <Link prefetch={false} href={reportLink(base, report.mode, f, { page: f.page - 1 })}>← Sebelumnya</Link>}{report.paging.has_more && <Link prefetch={false} href={reportLink(base, report.mode, f, { page: f.page + 1 })}>Berikutnya →</Link>}</nav>
    </section>
    <p className="journal-footnote">{report.mode === "paper" ? "Entry simulasi memakai close hari sinyal pada sesi berikutnya. Planned loss pada SL maksimal Rp1 juta termasuk fee beli 0,15% dan jual pada SL 0,25%; lot dibulatkan turun. Fixed 2R dan SMA10 adalah eksperimen terpisah. " : ""}Realized R memakai initial price risk yang dibekukan. SMA10 memerlukan close terkonfirmasi di bawah SMA10, lalu exit next-open; SL awal tetap aktif.</p>
  </div>;
}
const evaluationLabels = { target_1r: "1R sebelum SL", target_2r: "2R sebelum SL", net_5: "Profit net tanpa SL · 5 sesi", net_10: "Profit net tanpa SL · 10 sesi" };
function EvaluationDashboard({ report, f }: { report: SignalEvaluation; f: ReportingFilters }) {
  return <div className="reporting-stack"><Freshness report={report} />
    <section className="journal-panel"><span className="eyebrow">MENANG / DINILAI · OBSERVASI SINYAL</span><h2>Evaluasi per jenis sinyal</h2>
      <p className="panel-note">Checkpoint 5/10 sesi tidak menutup posisi. Evaluasi sinyal tetap berjalan terpisah dari exit jurnal Fixed 2R atau SMA10.</p>
      <div className="table-scroll"><table className="dense-table evaluation-matrix"><thead><tr><th>Jenis sinyal</th>{evaluationKeys.map(k => <th key={k}>{evaluationLabels[k]}</th>)}</tr></thead>
        <tbody>{report.strategies.map(row => <tr key={row.strategy}><td><Link prefetch={false} href={reportLink("/analytics", "signals", f, { strategy: row.strategy, page: 1 }) + "#signal-observations"}>{strategyLabels[row.strategy]}</Link><small>{row.signals} kemunculan</small></td>
          {evaluationKeys.map(k => { const c = row.cells[k]; return <td key={k}><strong>{percent(c.win_rate)}</strong><span>{c.wins} / {c.assessed} dinilai</span><small>{c.pending} menunggu · {c.ambiguous} ambigu</small><small>{c.data_hold} data tertahan · {c.excluded} dikecualikan</small>
            {Object.keys(c.excluded_reasons).length > 0 && <details><summary>Alasan pengecualian</summary>{Object.entries(c.excluded_reasons).map(([reason, count]) => <small key={reason}>{reason}: {count}</small>)}</details>}</td>; })}
        </tr>)}</tbody></table></div>
    </section>
    <section className="journal-panel" id="signal-observations"><h2>Observasi sinyal pembentuk matriks</h2>
      {report.evaluations.length === 0 ? <div className="journal-empty"><p>Belum ada observasi sinyal pada halaman ini.</p></div> : <div className="reporting-list"><table className="dense-table"><thead><tr><th>Ticker / Sinyal</th><th>Entry referensi / SL</th><th>Sesi teramati</th>{evaluationKeys.map(k => <th key={k}>{evaluationLabels[k]}</th>)}</tr></thead><tbody>{report.evaluations.map(e => <tr key={e.signal_id}>
        <td data-label="Ticker / Sinyal">{e.ticker}<small>{strategyLabels[e.strategy]} · {e.signal_session}</small><details><summary>Sumber sinyal</summary><small className="mono">{e.signal_id}</small><small>Target 1R: {reportMoney(e.target_1r)}; 2R: {reportMoney(e.target_2r)}</small></details></td><td data-label="Entry referensi / SL">{reportMoney(e.entry_price)} / {reportMoney(e.initial_stop)}<small>Entry {e.entry_session}</small></td><td data-label="Sesi teramati">{e.observed_sessions}</td>{evaluationKeys.map(k => <td data-label={evaluationLabels[k]} key={k}>{({ won: "Berhasil", lost: "Gagal", pending: "Menunggu", ambiguous: "Ambigu", data_hold: "Data tertahan", excluded: "Dikecualikan" } as Record<string, string>)[e.results[k]]}</td>)}
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
