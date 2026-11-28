"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import type { IhsgChartBar, MarketRegime, PivotLevelSet } from "@/lib/screener-types";
import { formatPctID, formatPriceID, marketRegimeMeta } from "@/lib/format-id";

interface IhsgOverviewChartProps {
  sessionDate: string;
  close: number;
  change: number;
  changePct: number;
  regime: MarketRegime;
  bars: IhsgChartBar[];
  pivots: PivotLevelSet | null;
}

type RangeKey = "3B" | "6B" | "1T" | "ALL";

export default function IhsgOverviewChart({
  sessionDate,
  close,
  change,
  changePct,
  regime,
  bars,
  pivots,
}: IhsgOverviewChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [range, setRange] = useState<RangeKey>("6B");
  const [showEma21, setShowEma21] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showPivots, setShowPivots] = useState(true);
  const [hoverBar, setHoverBar] = useState<IhsgChartBar | null>(null);

  const visibleBars = useMemo(() => {
    const countMap: Record<RangeKey, number> = { "3B": 65, "6B": 130, "1T": 250, ALL: bars.length };
    const take = Math.min(bars.length, countMap[range]);
    return bars.slice(Math.max(0, bars.length - take));
  }, [bars, range]);

  const activeLegendBar = hoverBar ?? visibleBars[visibleBars.length - 1] ?? null;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || visibleBars.length === 0) return;

    const chart = createChart(host, {
      width: host.clientWidth || 720,
      height: 390,
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
      crosshair: {
        vertLine: { color: "rgba(107, 213, 237, 0.4)", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "rgba(107, 213, 237, 0.4)", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.16)" },
      timeScale: { borderColor: "rgba(148, 163, 184, 0.16)", rightOffset: 4, barSpacing: 7 },
    });
    chartRef.current = chart;

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      priceLineVisible: false,
    });

    candles.setData(
      visibleBars.map((b) => ({
        time: b.time as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    );

    if (showPivots && pivots) {
      const levels: { label: string; value: number; color: string }[] = [
        { label: "R2", value: pivots.r2, color: "rgba(248, 113, 113, 0.72)" },
        { label: "R1", value: pivots.r1, color: "rgba(251, 146, 60, 0.75)" },
        { label: "P", value: pivots.p, color: "rgba(107, 213, 237, 0.85)" },
        { label: "S1", value: pivots.s1, color: "rgba(52, 211, 153, 0.75)" },
        { label: "S2", value: pivots.s2, color: "rgba(16, 185, 129, 0.72)" },
      ];
      for (const lv of levels) {
        candles.createPriceLine({
          price: lv.value,
          color: lv.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: lv.label,
        });
      }
    }

    if (showEma21) {
      const s21 = chart.addSeries(LineSeries, {
        color: "#38bdf8",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "EMA 21",
      });
      s21.setData(visibleBars.map((b) => ({ time: b.time as Time, value: b.ema21 })));
    }

    if (showEma50) {
      const s50 = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "EMA 50",
      });
      s50.setData(visibleBars.map((b) => ({ time: b.time as Time, value: b.ema50 })));
    }

    if (showEma200) {
      const s200 = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "EMA 200",
      });
      s200.setData(visibleBars.map((b) => ({ time: b.time as Time, value: b.ema200 })));
    }

    if (showSupertrend) {
      const st = chart.addSeries(LineSeries, {
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "Supertrend",
      });
      st.setData(
        visibleBars.map((b) => ({
          time: b.time as Time,
          value: b.supertrend,
          color: b.supertrend_dir >= 0 ? "#10b981" : "#f43f5e",
        }))
      );
    }

    const vol = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      },
      1
    );
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    vol.setData(
      visibleBars.map((b) => ({
        time: b.time as Time,
        value: b.volume,
        color: b.close >= b.open ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
      }))
    );

    const byTime = new Map(visibleBars.map((b) => [b.time, b]));
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoverBar(null);
        return;
      }
      const match = byTime.get(String(param.time));
      setHoverBar(match ?? null);
    });

    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          chart.applyOptions({ width: Math.floor(entry.contentRect.width) });
        }
      }
    });
    ro.observe(host);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [visibleBars, pivots, showEma21, showEma50, showEma200, showSupertrend, showPivots]);

  const regimeBadge = marketRegimeMeta(regime);

  return (
    <section className="st-card" aria-label="Grafik Indeks Harga Saham Gabungan">
      <div className="st-card-header">
        <div>
          <div className="st-eyebrow">IHSG COMPOSITE · {sessionDate}</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <h2 className="st-title-xl st-tabular">{formatPriceID(close, 2)}</h2>
            <span className={`st-tabular ${change >= 0 ? "st-pos" : "st-neg"}`} style={{ fontWeight: 700, fontSize: "15px" }}>
              {change >= 0 ? "+" : ""}
              {formatPriceID(change, 2)} ({formatPctID(changePct, true)})
            </span>
            <span className={`st-badge ${regimeBadge.cls}`}>{regimeBadge.text}</span>
          </div>
        </div>

        <div className="st-chip-row" aria-label="Rentang waktu grafik IHSG">
          {(["3B", "6B", "1T", "ALL"] as RangeKey[]).map((r) => (
            <button
              key={r}
              type="button"
              className="st-chip"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="st-chip-row" style={{ marginBottom: "10px" }}>
        <button type="button" className="st-chip" aria-pressed={showEma21} onClick={() => setShowEma21((v) => !v)}>
          EMA 21
        </button>
        <button type="button" className="st-chip" aria-pressed={showEma50} onClick={() => setShowEma50((v) => !v)}>
          EMA 50
        </button>
        <button type="button" className="st-chip" aria-pressed={showEma200} onClick={() => setShowEma200((v) => !v)}>
          EMA 200
        </button>
        <button type="button" className="st-chip" aria-pressed={showSupertrend} onClick={() => setShowSupertrend((v) => !v)}>
          Supertrend
        </button>
        <button type="button" className="st-chip" aria-pressed={showPivots} onClick={() => setShowPivots((v) => !v)}>
          Pivot Points
        </button>
      </div>

      {activeLegendBar ? (
        <div
          className="st-muted st-tabular"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "8px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "11px",
          }}
        >
          <span>Tgl: {activeLegendBar.time}</span>
          <span>O {formatPriceID(activeLegendBar.open, 2)}</span>
          <span>H {formatPriceID(activeLegendBar.high, 2)}</span>
          <span>L {formatPriceID(activeLegendBar.low, 2)}</span>
          <span>C {formatPriceID(activeLegendBar.close, 2)}</span>
          <span style={{ color: "#38bdf8" }}>EMA21 {formatPriceID(activeLegendBar.ema21, 2)}</span>
          <span style={{ color: "#f59e0b" }}>EMA50 {formatPriceID(activeLegendBar.ema50, 2)}</span>
          <span style={{ color: "#a78bfa" }}>EMA200 {formatPriceID(activeLegendBar.ema200, 2)}</span>
          <span style={{ color: activeLegendBar.supertrend_dir >= 0 ? "#10b981" : "#f43f5e" }}>
            ST {formatPriceID(activeLegendBar.supertrend, 2)} ({activeLegendBar.supertrend_dir >= 0 ? "UP" : "DOWN"})
          </span>
          {pivots ? (
            <span>
              Pivot P {formatPriceID(pivots.p, 0)} · R1 {formatPriceID(pivots.r1, 0)} · S1 {formatPriceID(pivots.s1, 0)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div ref={hostRef} style={{ width: "100%", height: "390px", borderRadius: "8px", overflow: "hidden" }} />
    </section>
  );
}
