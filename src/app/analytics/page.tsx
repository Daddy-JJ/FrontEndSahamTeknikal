import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner, type ActualAnalytics } from "@/lib/journal-server";
import { journalFilters } from "@/lib/journal-filters";
import demoData from "@/generated/demo.json";

export const dynamic = "force-dynamic";

const money = (v: string | number | null | undefined) => v == null ? "—" :
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(v));
const ratio = (v: string | number | null | undefined) => v == null ? "—" :
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(v));

const strategyLabels: Record<string, string> = {
  MACD_EMA200_V1: "MACD + EMA200",
  FRACTAL_BREAKOUT_V1: "Fractal Breakout",
  RS_BREAKOUT_V1: "RS Breakout",
  PULLBACK_RECLAIM_V1: "Pullback Reclaim",
};

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await journalOwner();
  if (context.kind !== "ready") {
    return (
      <JournalShell mode={null}>
        <section className="journal-hero">
          <span className="eyebrow">ANALYTICS / PERFORMA</span>
          <h1>Analitik belum dapat dibuka</h1>
          <p>
            {context.kind === "unconfigured" ? "Konfigurasi Supabase aplikasi belum tersedia."
              : context.kind === "unauthenticated" ? "Masuk dengan akun owner untuk melihat analisis performa."
              : context.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif."
              : "Mode data proyek belum dapat diverifikasi."}
          </p>
          <Link className="primary-button" href="/login">Masuk sebagai owner</Link>
        </section>
      </JournalShell>
    );
  }

  const query = await searchParams;
  const tab = typeof query.tab === "string" && query.tab === "paper" ? "paper" : "actual";
  const filters = journalFilters(query);
  const from = filters?.from ?? null;
  const to = filters?.to ?? null;
  const strategy = filters?.strategy ?? null;
  const exitVersion = filters?.exitVersion ?? null;

  // Fetch actual analytics RPC and closed trades history for curve plotting
  const [analyticsResult, closedTradesResult] = await Promise.all([
    context.supabase.rpc("actual_journal_analytics", {
      p_from: from,
      p_to: to,
      p_strategy: strategy,
      p_exit_version: exitVersion,
    }),
    context.supabase
      .from("actual_trades")
      .select("id,ticker,primary_strategy,realized_pnl_idr,realized_r,closed_at")
      .eq("status", "closed")
      .eq("data_mode", context.mode)
      .order("closed_at", { ascending: true }),
  ]);

  const summary = analyticsResult?.data as ActualAnalytics | null;
  const closedTrades = (closedTradesResult?.data ?? []) as Array<{
    id: string;
    ticker: string;
    primary_strategy: string;
    realized_pnl_idr: number | string;
    realized_r: number | string | null;
    closed_at: string | null;
  }>;

  // Build cumulative R points for SVG curve
  let runningR = 0;
  const rPoints: Array<{ step: number; r: number; ticker: string }> = [];
  rPoints.push({ step: 0, r: 0, ticker: "Start" });
  closedTrades.forEach((t, i) => {
    if (t.realized_r !== null) {
      runningR += Number(t.realized_r);
      rPoints.push({ step: i + 1, r: runningR, ticker: t.ticker });
    }
  });

  // Calculate SVG curve dimensions
  const minR = Math.min(0, ...rPoints.map(p => p.r));
  const maxR = Math.max(1, ...rPoints.map(p => p.r));
  const spanR = maxR - minR || 1;
  const svgWidth = 600;
  const svgHeight = 160;
  const pointsString = rPoints.map((p, idx) => {
    const x = idx * (svgWidth - 40) / Math.max(rPoints.length - 1, 1) + 20;
    const y = svgHeight - 25 - ((p.r - minR) / spanR) * (svgHeight - 50);
    return `${x},${y}`;
  }).join(" ");

  // Zero-line Y coordinate
  const zeroY = svgHeight - 25 - ((0 - minR) / spanR) * (svgHeight - 50);

  // Strategy breakdown for actual closed trades
  const strategyStats: Record<string, { count: number; netPnl: number; netR: number }> = {
    MACD_EMA200_V1: { count: 0, netPnl: 0, netR: 0 },
    FRACTAL_BREAKOUT_V1: { count: 0, netPnl: 0, netR: 0 },
    RS_BREAKOUT_V1: { count: 0, netPnl: 0, netR: 0 },
    PULLBACK_RECLAIM_V1: { count: 0, netPnl: 0, netR: 0 },
  };

  closedTrades.forEach((t) => {
    if (strategyStats[t.primary_strategy]) {
      strategyStats[t.primary_strategy].count += 1;
      strategyStats[t.primary_strategy].netPnl += Number(t.realized_pnl_idr ?? 0);
      if (t.realized_r !== null) {
        strategyStats[t.primary_strategy].netR += Number(t.realized_r);
      }
    }
  });

  return (
    <JournalShell mode={context.mode}>
      <section className="journal-hero">
        <div>
          <span className="eyebrow">ANALYTICS / STATISTIK / EOD</span>
          <h1>Ukur proses, baca hasil deterministik.</h1>
          <p>
            Statistik performa hanya menghitung trade closed. Tidak ada klaim win rate atau profitabilitas yang digaransi.
          </p>
        </div>
        <div className="journal-hero-actions">
          <Link href="/journal">← Kembali ke Jurnal</Link>
          <Link href="/journal/export">Ekspor CSV Closed</Link>
        </div>
      </section>

      {context.mode === "fixture" && (
        <p className="journal-banner">DATA UJI DEVELOPMENT — bukan performa akun trading riil.</p>
      )}

      {/* Subtab Selector */}
      <nav className="journal-history-tabs" aria-label="Mode Analitik">
        <Link prefetch={false} aria-current={tab === "actual" ? "page" : undefined} href="/analytics?tab=actual">
          Analitik Aktual (IDR &amp; R)
        </Link>
        <Link prefetch={false} aria-current={tab === "paper" ? "page" : undefined} href="/analytics?tab=paper">
          Analitik Paper Simulation (R)
        </Link>
      </nav>

      {tab === "paper" ? (
        /* ================= PAPER ANALYTICS ================= */
        <section className="journal-panel journal-full-panel">
          <div className="journal-toolbar">
            <div>
              <span className="eyebrow">HASIL PAPER FORWARD TEST</span>
              <h2>Simulasi Normalisasi R Per Strategi</h2>
            </div>
            <span className="badge amber">Fixture · Gross</span>
          </div>
          <p className="panel-note" style={{ marginBottom: "16px" }}>
            Baseline Fixed 2R dan MA SMA10. Seluruh closed trade dalam jendela riset. Jumlah R bukan profit portofolio yang dapat direplikasi.
          </p>

          <div className="analytics-hero-stats">
            {Object.entries((demoData as unknown as { strategy_metrics?: Record<string, { win_rate: string | null; expectancy_r: number | null; closed: number; ambiguous_count: number }> }).strategy_metrics ?? {}).map(([stratId, m]) => (
              <div className="analytics-stat-card" key={stratId}>
                <span>{strategyLabels[stratId] ?? stratId}</span>
                <strong>{m.win_rate !== null ? `${ratio(Number(m.win_rate) * 100)}%` : "—"}</strong>
                <small>
                  {m.closed} closed · Expectancy: {m.expectancy_r !== null ? `${ratio(m.expectancy_r)} R` : "—"}
                </small>
              </div>
            ))}
          </div>

          <div className="info-note" style={{ marginTop: "20px" }}>
            Breakeven masuk denominator win rate. Posisi open tidak dihitung loss. Kasus dual-hit memakai SL-first dan mencatat hasil alternatif TP-first (SOT Invariant #9).
          </div>
        </section>
      ) : (
        /* ================= ACTUAL ANALYTICS ================= */
        <>
          {/* Cohort Filter Bar */}
          <div className="analytics-filter-row">
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>Filter Cohort:</span>
            <Link
              href="/analytics?tab=actual"
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: !from && !to && !strategy ? "var(--green-soft)" : "#fff",
                color: !from && !to && !strategy ? "var(--green)" : "var(--muted)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Semua Histori
            </Link>
            {Object.keys(strategyLabels).map((st) => (
              <Link
                key={st}
                href={`/analytics?tab=actual&strategy=${st}`}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: strategy === st ? "var(--green-soft)" : "#fff",
                  color: strategy === st ? "var(--green)" : "var(--muted)",
                  textDecoration: "none",
                }}
              >
                {strategyLabels[st]}
              </Link>
            ))}
          </div>

          {/* 4 Core KPI Scorecards */}
          <div className="analytics-hero-stats">
            <div className="analytics-stat-card">
              <span>Win Rate (Closed)</span>
              <strong style={{ color: "var(--green)" }}>
                {summary?.win_rate == null ? "—" : `${ratio(Number(summary.win_rate) * 100)}%`}
              </strong>
              <small>
                {summary?.wins ?? 0} menang · {summary?.losses ?? 0} kalah · {summary?.breakeven ?? 0} BEP
              </small>
            </div>

            <div className="analytics-stat-card">
              <span>Expectancy R</span>
              <strong style={{ color: Number(summary?.expectancy_r ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                {summary?.expectancy_r != null ? `${Number(summary.expectancy_r) > 0 ? "+" : ""}${ratio(summary.expectancy_r)} R` : "—"}
              </strong>
              <small>Rata-rata return R per closed trade</small>
            </div>

            <div className="analytics-stat-card">
              <span>Profit Factor</span>
              <strong>
                {summary?.profit_factor_status === "no_losses" ? "Belum ada loss"
                  : summary?.profit_factor != null ? ratio(summary.profit_factor)
                  : "—"}
              </strong>
              <small>Gross Profit / Gross Loss</small>
            </div>

            <div className="analytics-stat-card">
              <span>Payoff Ratio</span>
              <strong>
                {summary?.payoff_status === "no_losses" ? "Tak terhingga"
                  : summary?.payoff_ratio != null ? ratio(summary.payoff_ratio)
                  : "—"}
              </strong>
              <small>Mean Win / Mean Loss</small>
            </div>
          </div>

          {/* Secondary Financial Facts */}
          <section className="journal-panel" style={{ marginTop: "20px" }}>
            <div className="journal-toolbar">
              <div>
                <span className="eyebrow">RINGKASAN MONETER</span>
                <h2>Ledger Cash Realized</h2>
              </div>
            </div>
            <dl className="journal-facts">
              <div><dt>Total Net P&amp;L Terkumpul (IDR)</dt><dd style={{ fontSize: "14px", color: Number(summary?.net_pnl_idr ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>Rp{money(summary?.net_pnl_idr)}</dd></div>
              <div><dt>Sampel Trade Closed</dt><dd>{summary?.closed ?? 0} transaksi selesai</dd></div>
              <div><dt>Posisi Open Aktif (Belum Ditutup)</dt><dd>{summary?.open ?? 0} posisi terbuka</dd></div>
              <div><dt>Trade dengan Biaya Estimasi</dt><dd>{summary?.estimated_fee_trades ?? 0} trade</dd></div>
              <div><dt>Status Kualitas Fee</dt><dd>{summary?.fee_quality === "actual" ? "Aktual dari broker" : summary?.fee_quality === "includes_estimates" ? "Termasuk estimasi" : "Belum ada closed"}</dd></div>
            </dl>
          </section>

          {/* Cumulative R Curve (Pure SVG) */}
          <section className="analytics-chart-container">
            <div className="journal-toolbar">
              <div>
                <span className="eyebrow">EQUITY CURVE BERBASIS R</span>
                <h3>Akumulasi Closed R ({closedTrades.length} Trade)</h3>
              </div>
              <span className="mono font-bold" style={{ color: runningR >= 0 ? "var(--green)" : "var(--red)" }}>
                Total: {runningR >= 0 ? "+" : ""}{ratio(runningR)} R
              </span>
            </div>

            {closedTrades.length === 0 ? (
              <div className="journal-empty">
                <h3>Belum Ada Kurva Transaksi</h3>
                <p>Kurva akumulasi R akan terbentuk otomatis setelah ada trade aktual yang ditutup (status closed).</p>
              </div>
            ) : (
              <div className="chart-wrap" style={{ marginTop: "12px" }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="Grafik Akumulasi R">
                  {/* Zero reference line */}
                  <line x1="20" y1={zeroY} x2={svgWidth - 20} y2={zeroY} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" />
                  <text x="25" y={zeroY - 4} fill="#94a3b8" fontSize="9" fontFamily="monospace">0.0 R</text>

                  {/* Curve Polyline */}
                  <polyline points={pointsString} fill="none" stroke="#235338" strokeWidth="2.5" />

                  {/* Nodes */}
                  {rPoints.map((p, idx) => {
                    const x = idx * (svgWidth - 40) / Math.max(rPoints.length - 1, 1) + 20;
                    const y = svgHeight - 25 - ((p.r - minR) / spanR) * (svgHeight - 50);
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="3.5" fill="#235338" />
                        <title>{`#${p.step} ${p.ticker}: ${ratio(p.r)} R`}</title>
                      </g>
                    );
                  })}
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                  <span>Trade Pertama</span>
                  <span>Trade Terakhir</span>
                </div>
              </div>
            )}
          </section>

          {/* Strategy Breakdown Table */}
          <section className="journal-panel journal-full-panel">
            <div className="journal-toolbar">
              <div>
                <span className="eyebrow">ATRIBUSI STRATEGI</span>
                <h2>Performa Per Strategi</h2>
              </div>
            </div>
            <div className="table-scroll">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th className="text-left">Strategi</th>
                    <th className="text-center">Closed Trades</th>
                    <th className="text-right">Net P&amp;L (IDR)</th>
                    <th className="text-right">Total Realized R</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(strategyStats).map(([st, data]) => (
                    <tr key={st}>
                      <td className="text-left font-bold">{strategyLabels[st] ?? st}</td>
                      <td className="text-center">{data.count}</td>
                      <td className="text-right mono font-bold">
                        {data.count > 0 ? (
                          <span style={{ color: data.netPnl > 0 ? "var(--green)" : data.netPnl < 0 ? "var(--red)" : "inherit" }}>
                            {data.netPnl > 0 ? "+" : ""}Rp{money(data.netPnl)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-right mono font-bold">
                        {data.count > 0 ? (
                          <span style={{ color: data.netR > 0 ? "var(--green)" : data.netR < 0 ? "var(--red)" : "inherit" }}>
                            {data.netR > 0 ? "+" : ""}{ratio(data.netR)} R
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="journal-footnote" style={{ marginTop: "24px" }}>
            Metrik dihitung langsung oleh RPC Supabase <code>actual_journal_analytics</code> secara deterministik. Tidak ada probabilitas buatan AI. SOT Bagian 11 dipatuhi.
          </p>
        </>
      )}
    </JournalShell>
  );
}
