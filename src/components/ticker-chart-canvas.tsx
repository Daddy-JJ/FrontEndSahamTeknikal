"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  LineType,
  createChart,
  type Time,
} from "lightweight-charts";
import type { TickerDetailPayload } from "@/lib/screener-server";
import { formatPriceID } from "@/lib/format-id";

export function TickerChartCanvas({
  data,
  height = 500,
  defaultRange = 130,
  title = "Pergerakan Harga & Level Fractal / Pivot / Fibonacci / Bandar",
}: {
  data: TickerDetailPayload;
  height?: number;
  defaultRange?: number;
  title?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  const [rangeBars, setRangeBars] = useState<number>(defaultRange);
  const [showEma21, setShowEma21] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showFractals, setShowFractals] = useState(true);
  const [showPivots, setShowPivots] = useState(true);
  const [showFibo, setShowFibo] = useState(false);
  const [showBandarCost, setShowBandarCost] = useState(true);

  const sliceStart = useMemo(
    () => Math.max(0, data.bars.length - rangeBars),
    [data.bars.length, rangeBars]
  );
  const visibleBars = useMemo(() => data.bars.slice(sliceStart), [data.bars, sliceStart]);
  const lastFractal = data.fractals[data.fractals.length - 1];

  useEffect(() => {
    const host = hostRef.current;
    if (!host || visibleBars.length === 0) return;

    const chart = createChart(host, {
      width: host.clientWidth || 720,
      height,
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
      timeScale: { borderColor: "rgba(148, 163, 184, 0.16)", rightOffset: 5, barSpacing: 7 },
    });

    const candles = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
        priceLineVisible: false,
      },
      0
    );
    candles.setData(
      visibleBars.map((b) => ({
        time: b.time as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    );

    if (showPivots && data.pivots) {
      const levels = [
        { label: "R1", value: data.pivots.r1, color: "rgba(251, 146, 60, 0.72)" },
        { label: "P", value: data.pivots.p, color: "rgba(107, 213, 237, 0.8)" },
        { label: "S1", value: data.pivots.s1, color: "rgba(52, 211, 153, 0.72)" },
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

    if (showFibo && data.fibonacci?.levels) {
      for (const lv of data.fibonacci.levels) {
        if (lv.ratio === "0.382" || lv.ratio === "0.5" || lv.ratio === "0.618") {
          candles.createPriceLine({
            price: lv.price,
            color: lv.ratio === "0.618" ? "rgba(250, 204, 21, 0.8)" : "rgba(167, 139, 250, 0.65)",
            lineWidth: 1,
            lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true,
            title: `Fibo ${lv.ratio}`,
          });
        }
      }
    }

    if (showBandarCost && data.smart_money.bandar_avg_cost && data.smart_money.bandar_avg_cost > 0) {
      candles.createPriceLine({
        price: data.smart_money.bandar_avg_cost,
        color: "#f59e0b",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Modal Bandar",
      });
    }

    if (showEma21) {
      const s = chart.addSeries(LineSeries, { color: "#38bdf8", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: "EMA 21" }, 0);
      s.setData(
        visibleBars
          .map((b, idx) => ({ time: b.time as Time, value: data.ema21[sliceStart + idx] }))
          .filter((p): p is { time: Time; value: number } => p.value !== null)
      );
    }

    if (showEma50) {
      const s = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: "EMA 50" }, 0);
      s.setData(
        visibleBars
          .map((b, idx) => ({ time: b.time as Time, value: data.ema50[sliceStart + idx] }))
          .filter((p): p is { time: Time; value: number } => p.value !== null)
      );
    }

    if (showEma200) {
      const s = chart.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: "EMA 200" }, 0);
      s.setData(
        visibleBars
          .map((b, idx) => ({ time: b.time as Time, value: data.ema200[sliceStart + idx] }))
          .filter((p): p is { time: Time; value: number } => p.value !== null)
      );
    }

    if (showSupertrend && data.supertrend.length > 0) {
      const timeSet = new Set(visibleBars.map((b) => b.time));
      const s = chart.addSeries(LineSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: "Supertrend" }, 0);
      s.setData(
        data.supertrend
          .filter((pt) => timeSet.has(pt.time))
          .map((pt) => ({ time: pt.time as Time, value: pt.value, color: pt.color }))
      );
    }

    if (showFractals && data.fractals.length > 0) {
      const fCeil = chart.addSeries(
        LineSeries,
        {
          color: "rgba(244, 114, 182, 0.85)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          lineType: LineType.WithSteps,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "Fractal Ceiling",
        },
        0
      );
      const fFloor = chart.addSeries(
        LineSeries,
        {
          color: "rgba(45, 212, 191, 0.85)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          lineType: LineType.WithSteps,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "Fractal Floor",
        },
        0
      );
      const slicedF = data.fractals.slice(sliceStart);
      fCeil.setData(
        slicedF
          .filter((f): f is typeof f & { ceiling: number } => f.ceiling !== null)
          .map((f) => ({ time: f.time as Time, value: f.ceiling }))
      );
      fFloor.setData(
        slicedF
          .filter((f): f is typeof f & { floor: number } => f.floor !== null)
          .map((f) => ({ time: f.time as Time, value: f.floor }))
      );
    }

    const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" } }, 1);
    vol.setData(
      visibleBars.map((b) => ({
        time: b.time as Time,
        value: b.volume,
        color: b.close >= b.open ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)",
      }))
    );

    const timeSet = new Set(visibleBars.map((b) => b.time));
    const visMacd = data.macd.filter((m) => timeSet.has(m.time));
    const macdHist = chart.addSeries(HistogramSeries, { priceLineVisible: false }, 2);
    macdHist.setData(
      visMacd
        .filter((m): m is typeof m & { histogram: number } => m.histogram !== null)
        .map((m) => ({
          time: m.time as Time,
          value: m.histogram,
          color: m.histogram >= 0 ? "rgba(16, 185, 129, 0.72)" : "rgba(239, 68, 68, 0.72)",
        }))
    );
    const macdLine = chart.addSeries(LineSeries, { color: "#38bdf8", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, 2);
    macdLine.setData(
      visMacd
        .filter((m): m is typeof m & { macd: number } => m.macd !== null)
        .map((m) => ({ time: m.time as Time, value: m.macd }))
    );
    const sigLine = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, 2);
    sigLine.setData(
      visMacd
        .filter((m): m is typeof m & { signal: number } => m.signal !== null)
        .map((m) => ({ time: m.time as Time, value: m.signal }))
    );

    const panes = chart.panes();
    if (panes[0]) panes[0].setStretchFactor(3);
    if (panes[1]) panes[1].setStretchFactor(1);
    if (panes[2]) panes[2].setStretchFactor(1.2);

    chart.timeScale().fitContent();

    let didFitOnReveal = host.clientWidth > 0;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.contentRect.width > 0) {
          chart.applyOptions({ width: Math.floor(e.contentRect.width) });
          if (!didFitOnReveal) {
            didFitOnReveal = true;
            chart.timeScale().fitContent();
          }
        }
      }
    });
    ro.observe(host);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data, visibleBars, sliceStart, height, showEma21, showEma50, showEma200, showSupertrend, showFractals, showPivots, showFibo, showBandarCost]);

  return (
    <section className="st-card" aria-label="Grafik teknikal multi-overlay">
      <div className="st-card-header">
        <div>
          <div className="st-eyebrow">TECHNICAL CHART · OVERLAY &amp; MACD (12,26,9)</div>
          <h2 className="st-title-md">{title}</h2>
        </div>
        <div className="st-chip-row">
          {[
            { label: "3B", bars: 65 },
            { label: "6B", bars: 130 },
            { label: "1T", bars: 250 },
            { label: "ALL", bars: data.bars.length },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              className="st-chip"
              aria-pressed={rangeBars === opt.bars}
              onClick={() => setRangeBars(opt.bars)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="st-chip-row" style={{ marginBottom: "10px" }}>
        <button type="button" className="st-chip" aria-pressed={showEma21} onClick={() => setShowEma21((v) => !v)}>EMA 21</button>
        <button type="button" className="st-chip" aria-pressed={showEma50} onClick={() => setShowEma50((v) => !v)}>EMA 50</button>
        <button type="button" className="st-chip" aria-pressed={showEma200} onClick={() => setShowEma200((v) => !v)}>EMA 200</button>
        <button type="button" className="st-chip" aria-pressed={showSupertrend} onClick={() => setShowSupertrend((v) => !v)}>Supertrend</button>
        <button type="button" className="st-chip" aria-pressed={showFractals} onClick={() => setShowFractals((v) => !v)}>
          Fractal {lastFractal?.ceiling ? `(Ceil ${formatPriceID(lastFractal.ceiling)})` : ""}
        </button>
        <button type="button" className="st-chip" aria-pressed={showPivots} onClick={() => setShowPivots((v) => !v)}>Pivot</button>
        <button type="button" className="st-chip" aria-pressed={showFibo} onClick={() => setShowFibo((v) => !v)}>Fibonacci</button>
        <button type="button" className="st-chip" aria-pressed={showBandarCost} onClick={() => setShowBandarCost((v) => !v)}>Modal Bandar</button>
      </div>

      <div ref={hostRef} style={{ width: "100%", height: `${height}px`, borderRadius: "8px", overflow: "hidden" }} />
    </section>
  );
}
