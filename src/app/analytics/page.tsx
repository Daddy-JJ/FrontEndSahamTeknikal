import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { PaperJournalPreview } from "@/components/paper-journal-preview";
import { journalOwner, type ActualRCurvePoint } from "@/lib/journal-server";
import { parseActualAnalytics, parseActualRCurve, parseActualAttribution } from "@/lib/actual-analytics";
import { journalFilterParams, journalFilters, journalStrategies, type JournalFilters } from "@/lib/journal-filters";

export const dynamic = "force-dynamic";

const money = (value: string | number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value));
const ratio = (value: string | number | null) => value === null ? "—"
  : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(value));
const strategyLabels: Record<string, string> = {
  MACD_EMA200_V1: "MACD + EMA200", FRACTAL_BREAKOUT_V1: "Fractal Breakout",
  RS_BREAKOUT_V1: "RS Breakout", PULLBACK_RECLAIM_V1: "Pullback Reclaim",
};

function analyticsLink(filters: JournalFilters) {
  const params = journalFilterParams(filters);
  params.set("tab", "actual");
  return `/analytics?${params}`;
}

function Tabs({ tab, filters }: { tab: "actual" | "paper"; filters?: JournalFilters }) {
  const paperParams = filters ? journalFilterParams(filters) : new URLSearchParams();
  paperParams.set("tab", "paper");
  return <nav className="journal-history-tabs" aria-label="Mode Analitik">
    <Link prefetch={false} aria-current={tab === "actual" ? "page" : undefined}
      href={filters ? analyticsLink(filters) : "/analytics?tab=actual"}>Analitik Aktual (IDR &amp; R)</Link>
    <Link prefetch={false} aria-current={tab === "paper" ? "page" : undefined}
      href={`/analytics?${paperParams}`}>Analitik Paper Simulation (R)</Link>
  </nav>;
}

function RCurveChart({ points, maxDrawdown, finalR }: {
  points: ActualRCurvePoint[];
  maxDrawdown: number | string;
  finalR: number | string;
}) {
  if (points.length === 0) {
    return (
      <div className="journal-empty" style={{ padding: "30px 20px" }}>
        <p>Belum ada trade closed pada cohort ini. Kurva R dihitung secara kronologis saat transaksi selesai.</p>
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const pad = { top: 25, right: 35, bottom: 40, left: 55 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const rValues = points.map(p => Number(p.cumulative_r));
  let minR = Math.min(0, ...rValues);
  let maxR = Math.max(0, ...rValues);
  if (maxR === minR) { maxR = 1; minR = -1; }
  const range = (maxR - minR) * 1.15;
  const mid = (maxR + minR) / 2;
  const adjMin = mid - range / 2;
  const adjMax = mid + range / 2;

  const scaleX = (i: number) => pad.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const scaleY = (r: number) => pad.top + ((adjMax - r) / (adjMax - adjMin)) * plotH;

  const zeroY = scaleY(0);
  const coords = points.map((p, i) => ({ x: scaleX(i), y: scaleY(Number(p.cumulative_r)), p }));
  const polylinePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  const isPositive = Number(finalR) >= 0;
  const strokeColor = isPositive ? "var(--emerald, #10b981)" : "var(--red, #ef4444)";

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", gap: "20px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div className="mono font-bold" style={{ fontSize: "14px" }}>
          Kumulatif R: <span style={{ color: strokeColor }}>{Number(finalR) > 0 ? "+" : ""}{ratio(finalR)} R</span>
        </div>
        <div className="mono" style={{ fontSize: "14px", color: "var(--muted)" }}>
          Max Drawdown: <span style={{ color: "var(--red, #ef4444)" }}>-{ratio(maxDrawdown)} R</span>
        </div>
        <div className="mono" style={{ fontSize: "14px", color: "var(--muted)" }}>
          Total Closed: {points.length} trade
        </div>
      </div>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", minWidth: "500px", height: "auto", display: "block" }}
          aria-label="Grafik Kurva R Kumulatif"
        >
          <line x1={pad.left} y1={zeroY} x2={width - pad.right} y2={zeroY} stroke="var(--border, #333)" strokeDasharray="4 4" strokeWidth="1" />
          <text x={pad.left - 8} y={zeroY + 4} fill="var(--muted, #888)" fontSize="11" textAnchor="end" fontFamily="monospace">0R</text>

          <text x={pad.left - 8} y={pad.top + 10} fill="var(--muted, #888)" fontSize="11" textAnchor="end" fontFamily="monospace">+{ratio(adjMax)}R</text>
          <text x={pad.left - 8} y={height - pad.bottom} fill="var(--muted, #888)" fontSize="11" textAnchor="end" fontFamily="monospace">{ratio(adjMin)}R</text>

          <polyline fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />

          {coords.map((c, i) => (
            <circle
              key={c.p.trade_id || i}
              cx={c.x}
              cy={c.y}
              r="4"
              fill={Number(c.p.realized_r) >= 0 ? "var(--emerald, #10b981)" : "var(--red, #ef4444)"}
              stroke="var(--bg-card, #111)"
              strokeWidth="1.5"
            >
              <title>{`#${c.p.sequence} ${c.p.ticker} (${c.p.exit_session}): ${Number(c.p.realized_r) >= 0 ? "+" : ""}${c.p.realized_r}R (Kumulatif: ${c.p.cumulative_r}R)`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <p className="panel-note">Setiap titik merepresentasikan trade yang telah selesai, dihitung secara kronologis berbasis initial risk yang tercatat. Sumbu Y adalah akumulasi unit risiko (R).</p>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await journalOwner();
  if (context.kind !== "ready") return (
    <JournalShell mode={null}>
      <section className="journal-hero">
        <div>
          <span className="eyebrow">ANALYTICS / PERFORMA</span>
          <h1>Analitik belum dapat dibuka</h1>
          <p>{context.kind === "unconfigured" ? "Konfigurasi Supabase aplikasi belum tersedia."
            : context.kind === "unauthenticated" ? "Masuk dengan akun owner untuk melihat analisis performa."
            : context.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif."
            : "Mode data proyek belum dapat diverifikasi."}</p>
        </div>
        <div className="journal-hero-actions">
          <Link className="primary-button" href="/login">Masuk sebagai owner</Link>
        </div>
      </section>
    </JournalShell>
  );

  const query = await searchParams;
  if (query.tab === "paper") return <JournalShell mode={context.mode}>
    <Tabs tab="paper" filters={journalFilters(query) ?? undefined} />
    <PaperJournalPreview mode={context.mode} view="analytics" />
  </JournalShell>;

  const filters = journalFilters(query);
  if (!filters) return (
    <JournalShell mode={context.mode}>
      <Tabs tab="actual" />
      <section className="journal-panel">
        <span className="eyebrow">FILTER COHORT</span>
        <h1>Filter cohort tidak valid</h1>
        <p style={{ marginTop: "8px" }}>Tanggal, strategi, atau konfigurasi exit tidak valid. Statistik tidak dimuat agar cohort tidak berubah tanpa persetujuan.</p>
        <div className="journal-actions">
          <Link className="secondary-link" href="/analytics">Hapus filter</Link>
        </div>
      </section>
    </JournalShell>
  );

  const [result, rCurveRes, attributionRes] = await Promise.all([
    context.supabase.rpc("actual_journal_analytics", {
      p_from: filters.from, p_to: filters.to, p_strategy: filters.strategy,
      p_exit_version: filters.exitVersion, p_exit_snapshot: filters.exitSnapshot,
    }),
    context.supabase.rpc("actual_journal_r_curve", {
      p_from: filters.from, p_to: filters.to, p_strategy: filters.strategy,
      p_exit_version: filters.exitVersion, p_exit_snapshot: filters.exitSnapshot,
    }),
    context.supabase.rpc("actual_journal_attribution", {
      p_from: filters.from, p_to: filters.to,
      p_exit_version: filters.exitVersion, p_exit_snapshot: filters.exitSnapshot,
    }),
  ]);

  const summary = result.error ? null : parseActualAnalytics(result.data, context.mode, filters);
  const rCurve = rCurveRes.error ? null : parseActualRCurve(rCurveRes.data, context.mode, filters);
  const attribution = attributionRes.error ? null : parseActualAttribution(attributionRes.data, context.mode, filters);

  if (!summary) return <JournalShell mode={context.mode}>
    <Tabs tab="actual" filters={filters} />
    <section className="journal-panel">
      <h1>Statistik belum dapat dibaca</h1>
      <p>Permintaan statistik gagal atau respons tidak cocok dengan mode dan cohort yang dipilih. Nilai performa tidak ditampilkan.</p>
      <Link prefetch={false} href={analyticsLink(filters)}>Coba lagi</Link>
    </section>
  </JournalShell>;

  const exportParams = journalFilterParams(filters).toString();
  return <JournalShell mode={context.mode}>
    <section className="journal-hero">
      <div>
        <span className="eyebrow">ANALYTICS / STATISTIK / EOD</span>
        <h1>Ukur proses, baca hasil deterministik.</h1>
        <p>Performa dihitung dari trade closed, berdasarkan tanggal exit Asia/Jakarta dan biaya yang tercatat. Tidak ada jaminan win rate atau profitabilitas.</p>
      </div>
      <div className="journal-hero-actions">
        <Link href="/journal">← Kembali ke Jurnal</Link>
        <Link href={`/journal/export${exportParams ? `?${exportParams}` : ""}`}>Ekspor CSV cohort</Link>
      </div>
    </section>
    {context.mode === "fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — bukan performa akun trading riil.</p>}
    <Tabs tab="actual" filters={filters} />

    <section className="journal-panel" aria-label="Filter cohort statistik">
      <form className="journal-form" action="/analytics" method="get">
        <input type="hidden" name="tab" value="actual" />
        <label>Dari sesi exit<input type="date" name="from" defaultValue={filters.from ?? ""} /></label>
        <label>Sampai sesi exit<input type="date" name="to" defaultValue={filters.to ?? ""} /></label>
        <label>Strategi<select name="strategy" defaultValue={filters.strategy ?? ""}>
          <option value="">Semua strategi</option>
          {journalStrategies.map(strategy => <option key={strategy} value={strategy}>{strategyLabels[strategy]}</option>)}
        </select></label>
        <label>Konfigurasi exit persis<select name="exit_snapshot" defaultValue={filters.exitSnapshotKey ?? ""}>
          <option value="">Semua konfigurasi</option>
          <option value="fixed2r">Fixed 2R · actual-fixed2r-v1</option>
          <option value="ma10">SMA10 · actual-ma10-v1</option>
          <option value="manual">Manual · actual-manual-v1</option>
        </select></label>
        <label>Versi exit (opsional)<input name="exit_version" defaultValue={filters.exitVersion ?? ""}
          maxLength={60} pattern="[A-Za-z0-9_-]{1,60}" /></label>
        <button className="primary-button" type="submit">Terapkan cohort</button>
        <Link href="/analytics?tab=actual">Hapus semua filter</Link>
      </form>
      <p className="panel-note">Tanggal membatasi trade closed. Jumlah open dan draft memakai filter strategi/exit, tanpa batas tanggal exit.</p>
    </section>
    <nav className="analytics-filter-row" aria-label="Filter cepat strategi">
      <Link href={analyticsLink({ ...filters, strategy: null })}>Semua strategi</Link>
      {journalStrategies.map(strategy => <Link key={strategy} href={analyticsLink({ ...filters, strategy })}
        aria-current={filters.strategy === strategy ? "page" : undefined}>{strategyLabels[strategy]}</Link>)}
    </nav>

    <div className="analytics-hero-stats">
      <div className="analytics-stat-card"><span>Win Rate (Closed)</span>
        <strong>{summary.win_rate === null ? "—" : `${ratio(Number(summary.win_rate) * 100)}%`}</strong>
        <small>{summary.wins} menang · {summary.losses} kalah · {summary.breakeven} BEP</small></div>
      <div className="analytics-stat-card"><span>Expectancy R</span>
        <strong>{summary.expectancy_r === null ? "—" : `${ratio(summary.expectancy_r)} R`}</strong>
        <small>Rata-rata realized R per closed trade</small></div>
      <div className="analytics-stat-card"><span>Profit Factor</span>
        <strong>{summary.profit_factor_status === "no_losses" ? "Belum ada loss" : ratio(summary.profit_factor)}</strong>
        <small>Total net profit / absolut total net loss (IDR)</small></div>
      <div className="analytics-stat-card"><span>Payoff Ratio</span>
        <strong>{summary.payoff_status === "no_losses" ? "Belum ada loss"
          : summary.payoff_status === "no_wins" ? "Belum ada win" : ratio(summary.payoff_ratio)}</strong>
        <small>Rata-rata net win / absolut rata-rata net loss (IDR)</small></div>
    </div>

    <section className="journal-panel" style={{ marginTop: "20px" }}>
      <div className="journal-toolbar"><div><span className="eyebrow">RINGKASAN MONETER</span><h2>Ledger Cash Realized</h2></div></div>
      <dl className="journal-facts">
        <div><dt>Total Net P&amp;L cohort (IDR)</dt><dd>Rp{money(summary.net_pnl_idr)}</dd></div>
        <div><dt>Sampel Trade Closed</dt><dd>{summary.closed} transaksi selesai</dd></div>
        <div><dt>Posisi Open</dt><dd>{summary.open} posisi terbuka</dd></div>
        <div><dt>Draft</dt><dd>{summary.draft} draft</dd></div>
        <div><dt>Trade dengan Biaya Estimasi</dt><dd>{summary.estimated_fee_trades} trade</dd></div>
        <div><dt>Status Kualitas Fee</dt><dd>{summary.fee_quality === "actual" ? "Aktual dari broker"
          : summary.fee_quality === "includes_estimates" ? "Termasuk estimasi" : "Belum ada closed"}</dd></div>
      </dl>
    </section>

    <section className="journal-panel" style={{ marginTop: "20px" }}>
      <div className="journal-toolbar">
        <div><span className="eyebrow">KURVA PERFORMA · R-BASIS</span><h2>Kurva R Kumulatif</h2></div>
      </div>
      {rCurve ? (
        <RCurveChart
          points={rCurve.points}
          maxDrawdown={rCurve.max_drawdown_r}
          finalR={rCurve.final_cumulative_r}
        />
      ) : (
        <div className="journal-empty" style={{ padding: "30px 20px" }}>
          <p>Kurva R belum dapat dimuat dari database. Menggunakan data canonical tanpa manipulasi browser.</p>
        </div>
      )}
    </section>

    <section className="journal-panel" style={{ marginTop: "20px" }}>
      <div className="journal-toolbar">
        <div><span className="eyebrow">ATRIBUSI MODEL · CANONICAL</span><h2>Performa per Strategi</h2></div>
      </div>
      {attribution && attribution.strategies.length > 0 ? (
        <div className="table-scroll">
          <table className="dense-table">
            <thead>
              <tr>
                <th className="text-left">Strategi</th>
                <th className="text-right">Closed</th>
                <th className="text-right">Win Rate</th>
                <th className="text-right">Expectancy R</th>
                <th className="text-right">Net P&amp;L (IDR)</th>
                <th className="text-right">Profit Factor</th>
              </tr>
            </thead>
            <tbody>
              {attribution.strategies.map(s => (
                <tr key={s.strategy}>
                  <td className="text-left font-bold">{strategyLabels[s.strategy] ?? s.strategy}</td>
                  <td className="text-right mono">{s.closed}</td>
                  <td className="text-right mono">{s.win_rate === null ? "—" : `${ratio(Number(s.win_rate) * 100)}%`}</td>
                  <td className="text-right mono">{s.expectancy_r === null ? "—" : `${ratio(s.expectancy_r)} R`}</td>
                  <td className="text-right mono font-bold" style={{ color: Number(s.net_pnl_idr) >= 0 ? "var(--emerald)" : "var(--red)" }}>
                    Rp{money(s.net_pnl_idr)}
                  </td>
                  <td className="text-right mono">
                    {s.profit_factor_status === "no_losses" ? "Belum ada loss" : s.profit_factor === null ? "—" : ratio(s.profit_factor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="panel-note">Atribusi dihitung secara atomik oleh database PostgreSQL; total net P&amp;L dan hitungan trade berparitas 100% dengan ledger aktual.</p>
        </div>
      ) : (
        <div className="journal-empty" style={{ padding: "30px 20px" }}>
          <p>Belum ada rincian strategi pada cohort ini.</p>
        </div>
      )}
    </section>

    <p className="journal-footnote">Biaya estimasi dapat berubah saat konfirmasi broker dicatat. Statistik dan CSV memakai cohort yang sama; realized R memakai initial risk yang tercatat.</p>
  </JournalShell>;
}
