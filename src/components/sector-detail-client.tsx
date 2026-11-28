"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AreaSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type Time,
} from "lightweight-charts";
import type { SectorSnapshotPayload } from "@/lib/screener-types";
import {
  formatPctID,
  formatPriceID,
  formatRupiahCompact,
  smartMoneyMeta,
  stockRegimeMeta,
} from "@/lib/format-id";

interface SectorDetailClientProps {
  snapshot: SectorSnapshotPayload;
  allSectors: { sector: string; slug: string }[];
}

type SectorSortKey = "turnover" | "change_pct" | "smart_money_net" | "foreign_net" | "smart_money_score" | "ticker";

export function SectorDetailClient({ snapshot, allSectors }: SectorDetailClientProps) {
  const chartHostRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [regimeFilter, setRegimeFilter] = useState("ALL");
  const [minScore, setMinScore] = useState(0);
  const [sortKey, setSortKey] = useState<SectorSortKey>("turnover");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { summary, chart_series, stocks } = snapshot;

  const topGainers = useMemo(
    () => [...stocks].sort((a, b) => b.change_pct - a.change_pct).slice(0, 5),
    [stocks]
  );
  const topLosers = useMemo(
    () => [...stocks].sort((a, b) => a.change_pct - b.change_pct).slice(0, 5),
    [stocks]
  );

  const filteredStocks = useMemo(() => {
    const q = search.trim().toUpperCase();
    return stocks
      .filter((s) => {
        if (regimeFilter !== "ALL" && s.regime !== regimeFilter) return false;
        if (minScore > 0 && s.smart_money_score < minScore) return false;
        if (q && !s.ticker.includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1;
        if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker) * mul;
        return (Number(a[sortKey] ?? 0) - Number(b[sortKey] ?? 0)) * mul;
      });
  }, [stocks, search, regimeFilter, minScore, sortKey, sortDir]);

  useEffect(() => {
    const host = chartHostRef.current;
    if (!host || chart_series.length === 0) return;

    const chart = createChart(host, {
      width: host.clientWidth || 720,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "#0c131c" },
        textColor: "#9aaaba",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.16)" },
      timeScale: { borderColor: "rgba(148, 163, 184, 0.16)", rightOffset: 4, barSpacing: 6 },
    });

    const isPositiveTrend = (chart_series[chart_series.length - 1]?.close ?? 100) >= 100;
    const area = chart.addSeries(AreaSeries, {
      lineColor: isPositiveTrend ? "#10b981" : "#f43f5e",
      topColor: isPositiveTrend ? "rgba(16, 185, 129, 0.28)" : "rgba(244, 63, 94, 0.25)",
      bottomColor: "rgba(12, 19, 28, 0.02)",
      lineWidth: 2,
      title: "Indeks Sektor (Base=100)",
    });
    area.setData(chart_series.map((p) => ({ time: p.time as Time, value: p.close })));

    const e21 = chart.addSeries(LineSeries, { color: "#38bdf8", lineWidth: 1, priceLineVisible: false, title: "EMA 21" });
    e21.setData(chart_series.map((p) => ({ time: p.time as Time, value: p.ema21 })));

    const e50 = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, title: "EMA 50" });
    e50.setData(chart_series.map((p) => ({ time: p.time as Time, value: p.ema50 })));

    const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" }, 1);
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    vol.setData(
      chart_series.map((p) => ({
        time: p.time as Time,
        value: p.volume,
        color: p.change_pct >= 0 ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
      }))
    );

    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.contentRect.width > 0) chart.applyOptions({ width: Math.floor(e.contentRect.width) });
      }
    });
    ro.observe(host);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [chart_series]);

  const toggleSort = (col: SectorSortKey) => {
    if (sortKey === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(col);
      setSortDir("desc");
    }
  };

  return (
    <div className="st-page">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div>
          <Link href="/" className="st-muted" style={{ textDecoration: "none", color: "var(--accent)" }}>
            ← Kembali ke Dashboard IHSG
          </Link>
          <h1 className="st-title-xl" style={{ marginTop: "4px", textTransform: "uppercase" }}>
            Sektor {snapshot.sector_name}
          </h1>
          <div className="st-muted">
            Sesi {snapshot.session_date} · {summary.stocks_count} emiten · Cap-weighted{" "}
            <span className={summary.weighted_change_pct >= 0 ? "st-pos" : "st-neg"}>
              {formatPctID(summary.weighted_change_pct, true)}
            </span>{" "}
            · Equal-weight {formatPctID(summary.equal_change_pct, true)}
          </div>
        </div>

        <div className="st-chip-row" aria-label="Navigasi sektor IDX">
          {allSectors.map((sec) => (
            <Link
              key={sec.slug}
              href={`/sector/${sec.slug}`}
              className={`st-chip ${sec.slug === snapshot.sector_slug ? "st-chip-active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              {sec.sector}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <section className="st-kpi-strip" aria-label="Ringkasan performa sektor">
        <div className="st-card">
          <div className="st-eyebrow">BREADTH SEKTOR</div>
          <div className="st-kpi-value st-tabular">
            <span className="st-pos">+{summary.gainers}</span> / <span className="st-neg">-{summary.losers}</span>{" "}
            <span className="st-muted" style={{ fontSize: "13px" }}>({summary.unchanged} unch)</span>
          </div>
        </div>
        <div className="st-card">
          <div className="st-eyebrow">TOTAL VALUASI</div>
          <div className="st-kpi-value st-tabular">{formatRupiahCompact(summary.total_turnover)}</div>
        </div>
        <div className="st-card">
          <div className="st-eyebrow">SMART MONEY NET</div>
          <div className={`st-kpi-value st-tabular ${summary.smart_money_net >= 0 ? "st-pos" : "st-neg"}`}>
            {formatRupiahCompact(summary.smart_money_net, true)}
          </div>
        </div>
        <div className="st-card">
          <div className="st-eyebrow">NET FOREIGN FLOW</div>
          <div className={`st-kpi-value st-tabular ${summary.foreign_net >= 0 ? "st-pos" : "st-neg"}`}>
            {formatRupiahCompact(summary.foreign_net, true)}
          </div>
        </div>
      </section>

      {/* Chart + Top Gainers/Losers */}
      <div className="st-grid-overview">
        <section className="st-card" aria-label="Grafik Indeks Sektor Base 100">
          <div className="st-card-header">
            <div>
              <div className="st-eyebrow">EQUAL-WEIGHTED SECTOR INDEX (180 HARI · BASE=100)</div>
              <h2 className="st-title-md">Trend Sektor {snapshot.sector_name} + EMA 21 / 50</h2>
            </div>
          </div>
          <div ref={chartHostRef} style={{ width: "100%", height: "300px", borderRadius: "8px", overflow: "hidden" }} />
        </section>

        <section className="st-card" aria-label="Top Gainers dan Top Losers Sektor">
          <div className="st-card-header">
            <div>
              <div className="st-eyebrow">PEMIMPIN SEKTOR HARIAN</div>
              <h2 className="st-title-md">Top Gainers &amp; Top Losers</h2>
            </div>
          </div>
          <div className="st-contrib-columns">
            <div>
              <div className="st-eyebrow" style={{ color: "var(--green)", marginBottom: "6px" }}>▲ Top Gainers</div>
              <div className="st-contrib-list">
                {topGainers.map((s) => (
                  <Link key={`g-${s.ticker}`} href={`/ticker/${s.ticker}`} className="st-contrib-row">
                    <div>
                      <strong>{s.ticker}</strong>
                      <div className="st-muted" style={{ fontSize: "11px" }}>{formatPriceID(s.close)}</div>
                    </div>
                    <span className="st-pos st-tabular" style={{ fontWeight: 700 }}>{formatPctID(s.change_pct, true)}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="st-eyebrow" style={{ color: "var(--red)", marginBottom: "6px" }}>▼ Top Losers</div>
              <div className="st-contrib-list">
                {topLosers.map((s) => (
                  <Link key={`l-${s.ticker}`} href={`/ticker/${s.ticker}`} className="st-contrib-row">
                    <div>
                      <strong>{s.ticker}</strong>
                      <div className="st-muted" style={{ fontSize: "11px" }}>{formatPriceID(s.close)}</div>
                    </div>
                    <span className="st-neg st-tabular" style={{ fontWeight: 700 }}>{formatPctID(s.change_pct, true)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Complete List of ALL Stocks in Sector */}
      <section className="st-card" aria-label="Daftar lengkap emiten sektor">
        <div className="st-card-header">
          <div>
            <div className="st-eyebrow">KONSTITUEN LENGKAP SEKTOR</div>
            <h2 className="st-title-md">Semua Saham Sektor {snapshot.sector_name} ({filteredStocks.length} dari {stocks.length})</h2>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <input
              type="search"
              className="st-input"
              placeholder="Cari ticker..."
              aria-label="Filter ticker sektor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="st-select"
              aria-label="Filter regime sektor"
              value={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.value)}
            >
              <option value="ALL">Semua Regime</option>
              <option value="MARKUP">▲ MARKUP</option>
              <option value="CONSOLIDATING">◆ CONSOLIDATING</option>
              <option value="MARKDOWN">▼ MARKDOWN</option>
            </select>
            <select
              className="st-select"
              aria-label="Filter skor Smart Money"
              value={String(minScore)}
              onChange={(e) => setMinScore(Number(e.target.value))}
            >
              <option value="0">Smart Money: Semua</option>
              <option value="2">2/3+ Confirmed</option>
              <option value="3">3/3 Strong</option>
            </select>
          </div>
        </div>

        <div className="st-table-wrap" tabIndex={0} role="region" aria-labelledby="sector-stocks-caption">
          <table className="st-table">
            <caption id="sector-stocks-caption">
              Daftar lengkap seluruh saham IDX di sektor {snapshot.sector_name} beserta Smart Money Scoring &amp; Regime.
            </caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortKey === "ticker" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("ticker")}>
                    Ticker {sortKey === "ticker" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
                <th scope="col" className="st-num">Harga</th>
                <th scope="col" className="st-num" aria-sort={sortKey === "change_pct" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("change_pct")}>
                    Chg% {sortKey === "change_pct" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
                <th scope="col" className="st-num" aria-sort={sortKey === "turnover" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("turnover")}>
                    Valuasi {sortKey === "turnover" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
                <th scope="col" className="st-num" aria-sort={sortKey === "smart_money_net" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("smart_money_net")}>
                    Smart Money {sortKey === "smart_money_net" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
                <th scope="col" className="st-num" aria-sort={sortKey === "foreign_net" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("foreign_net")}>
                    Net Foreign {sortKey === "foreign_net" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === "smart_money_score" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" className="st-th-sort-btn" onClick={() => toggleSort("smart_money_score")}>
                    Skor SM {sortKey === "smart_money_score" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
                <th scope="col">Regime</th>
                <th scope="col">Sinyal Aktif</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((s) => {
                const sm = smartMoneyMeta(s.smart_money_score, s.smart_money_label);
                const reg = stockRegimeMeta(s.regime, s.regime_action);
                return (
                  <tr key={s.ticker}>
                    <td>
                      <Link href={`/ticker/${s.ticker}`} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                        {s.ticker}
                      </Link>
                    </td>
                    <td className="st-num">{formatPriceID(s.close)}</td>
                    <td className={`st-num ${s.change_pct >= 0 ? "st-pos" : "st-neg"}`}>{formatPctID(s.change_pct, true)}</td>
                    <td className="st-num st-muted">{formatRupiahCompact(s.turnover)}</td>
                    <td className={`st-num ${s.smart_money_net >= 0 ? "st-pos" : "st-neg"}`}>
                      {formatRupiahCompact(s.smart_money_net, true)}
                    </td>
                    <td className={`st-num ${s.foreign_net >= 0 ? "st-pos" : "st-neg"}`}>
                      {formatRupiahCompact(s.foreign_net, true)}
                    </td>
                    <td><span className={`st-badge ${sm.cls}`}>{sm.text}</span></td>
                    <td><span className={`st-badge ${reg.cls}`}>{reg.text}</span></td>
                    <td>
                      {s.active_signals.length > 0 ? (
                        <span className="st-badge st-badge-strategy">{s.active_signals.join(", ")}</span>
                      ) : (
                        <span className="st-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
