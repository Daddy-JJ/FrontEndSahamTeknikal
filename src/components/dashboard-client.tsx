"use client";

import React from "react";
import dynamic from "next/dynamic";
import type {
  DashboardPayload,
  ScreeningSignalRow,
  WinRatePayload,
} from "@/lib/screener-types";
import { formatPriceID, formatRupiahCompact } from "@/lib/format-id";
import { MarketContributors } from "@/components/market-contributors";
import { SectorHeatmap } from "@/components/sector-heatmap";
import { MarketQuadrantMap } from "@/components/market-quadrant-map";
import { SignalScreenerPanel } from "@/components/signal-screener-panel";

const IhsgOverviewChart = dynamic(() => import("@/components/ihsg-overview-chart"), {
  ssr: false,
  loading: () => <div className="st-card st-skeleton" style={{ height: "490px" }} aria-label="Memuat grafik IHSG" />,
});

interface DashboardClientProps {
  dashboard: DashboardPayload;
  initialSignals: ScreeningSignalRow[];
  initialLatestDate: string | null;
  availableDates: string[];
  initialWinRate: WinRatePayload;
}

export function DashboardClient({
  dashboard,
  initialSignals,
  initialLatestDate,
  availableDates,
  initialWinRate,
}: DashboardClientProps) {
  const { breadth } = dashboard;

  return (
    <div className="st-page">
      {/* Top KPI Summary Strip */}
      <section className="st-kpi-strip" aria-label="Ringkasan kondisi pasar IHSG">
        <div className="st-card">
          <div className="st-eyebrow">MARKET BREADTH ({dashboard.session_date})</div>
          <div className="st-kpi-value st-tabular">
            <span className="st-pos">{breadth.gainers}</span>{" "}
            <span className="st-muted" style={{ fontSize: "15px" }}>/</span>{" "}
            <span className="st-neg">{breadth.losers}</span>{" "}
            <span className="st-muted" style={{ fontSize: "13px" }}>({breadth.unchanged} unch)</span>
          </div>
          <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
            A/D Ratio: {breadth.ad_ratio.toFixed(2)} · {breadth.total_tickers} saham aktif
          </div>
        </div>

        <div className="st-card">
          <div className="st-eyebrow">TOTAL TURNOVER BURSA</div>
          <div className="st-kpi-value st-tabular">{formatRupiahCompact(breadth.total_turnover)}</div>
          <div className="st-muted st-tabular" style={{ marginTop: "4px" }}>
            Smart Money Net: <span className={breadth.smart_money_net >= 0 ? "st-pos" : "st-neg"}>{formatRupiahCompact(breadth.smart_money_net, true)}</span>
          </div>
        </div>

        <div className="st-card">
          <div className="st-eyebrow">NET FOREIGN FLOW (ALL MARKET)</div>
          <div className={`st-kpi-value st-tabular ${breadth.foreign_net >= 0 ? "st-pos" : "st-neg"}`}>
            {formatRupiahCompact(breadth.foreign_net, true)}
          </div>
          <div className="st-muted" style={{ marginTop: "4px" }}>
            Sumber: Max Trade MCP Broksum Full Market
          </div>
        </div>

        <div className="st-card">
          <div className="st-eyebrow">PIVOT HARIAN IHSG</div>
          {dashboard.ihsg_chart_data.pivots ? (
            <>
              <div className="st-kpi-value st-tabular" style={{ fontSize: "18px" }}>
                P {formatPriceID(dashboard.ihsg_chart_data.pivots.p, 0)}
              </div>
              <div className="st-muted st-tabular" style={{ marginTop: "6px" }}>
                R1 {formatPriceID(dashboard.ihsg_chart_data.pivots.r1, 0)} · S1 {formatPriceID(dashboard.ihsg_chart_data.pivots.s1, 0)}
              </div>
            </>
          ) : (
            <div className="st-muted">-</div>
          )}
        </div>
      </section>

      {/* Main Overview Row: IHSG Chart + Contributors/Draggers */}
      <div className="st-grid-overview">
        <IhsgOverviewChart
          sessionDate={dashboard.session_date}
          close={dashboard.ihsg_close}
          change={dashboard.ihsg_change}
          changePct={dashboard.ihsg_change_pct}
          regime={dashboard.market_regime}
          bars={dashboard.ihsg_chart_data.bars}
          pivots={dashboard.ihsg_chart_data.pivots}
        />

        <MarketContributors
          gainers={dashboard.contributors.gainers}
          losers={dashboard.contributors.losers}
          methodology={dashboard.contributors.methodology}
          constituentsWeighted={dashboard.contributors.constituents_weighted}
        />
      </div>

      {/* Sector Heatmap (11 IDX Sectors -> Click to /sector/[slug]) */}
      <SectorHeatmap sectors={dashboard.sector_heatmap} />

      {/* Quadrant 2x2 Map (Click Quadrant -> Full Modal with ALL stocks) */}
      <MarketQuadrantMap
        counts={dashboard.quadrant_summary.counts}
        stocksByQuadrant={dashboard.quadrant_summary.stocks_by_quadrant}
      />

      {/* Signal Screener + Win Rate Panel */}
      <SignalScreenerPanel
        initialSignals={initialSignals}
        initialLatestDate={initialLatestDate}
        availableDates={availableDates}
        initialWinRate={initialWinRate}
      />
    </div>
  );
}
