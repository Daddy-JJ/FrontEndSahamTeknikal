"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  LineStyle,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import type { OHLCVBar, SupertrendPoint, MACDPoint } from "@/lib/indicators";

export interface BrokerFlowInlineChartProps {
  ticker: string;
  bandarAvgCost?: number;
  onClose?: () => void;
}

interface ChartPayload {
  success: boolean;
  ticker: string;
  totalBars: number;
  latestDate: string;
  bars: OHLCVBar[];
  supertrend: SupertrendPoint[];
  macd: MACDPoint[];
}

type TimeframeRange = "1B" | "3B" | "6B" | "1T" | "ALL";

export default function BrokerFlowInlineChart({
  ticker,
  bandarAvgCost,
  onClose,
}: BrokerFlowInlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [prevTicker, setPrevTicker] = useState(ticker);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartPayload | null>(null);

  // Sync state during render when ticker prop changes
  if (prevTicker !== ticker) {
    setPrevTicker(ticker);
    setLoading(true);
    setError(null);
  }

  // Indicator visibility toggles (default all ON as requested)
  const [showVolume, setShowVolume] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [showBandarCost, setShowBandarCost] = useState(true);

  // Timeframe range (default 6 months)
  const [activeRange, setActiveRange] = useState<TimeframeRange>("6B");

  // Hovered bar state for legend
  const [hoverBar, setHoverBar] = useState<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    changePct: number;
    volume: number;
    supertrend?: { value: number; direction: "up" | "down" };
    macd?: { macd: number | null; signal: number | null; hist: number | null };
  } | null>(null);

  // Fetch chart data on ticker change
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const res = await fetch(`/api/broker-flow/chart?ticker=${ticker}`);
        const data = await res.json();

        if (isCancelled) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal memuat data grafik teknikal.");
        }

        setChartData(data);
        setLoading(false);
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Gagal memuat data chart.";
          console.error("Failed to load chart data:", err);
          setError(msg);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [ticker]);

  // Set visible range based on timeframe
  const applyTimeframe = useCallback((chart: IChartApi, bars: OHLCVBar[], range: TimeframeRange) => {
    if (bars.length === 0) return;

    if (range === "ALL") {
      chart.timeScale().fitContent();
      return;
    }

    const lastBar = bars[bars.length - 1];
    const endDate = new Date(lastBar.time);
    const startDate = new Date(endDate);

    if (range === "1B") startDate.setMonth(startDate.getMonth() - 1);
    else if (range === "3B") startDate.setMonth(startDate.getMonth() - 3);
    else if (range === "6B") startDate.setMonth(startDate.getMonth() - 6);
    else if (range === "1T") startDate.setFullYear(startDate.getFullYear() - 1);

    const startStr = startDate.toISOString().slice(0, 10);
    const firstMatchingBar = bars.find((b) => b.time >= startStr) || bars[0];

    chart.timeScale().setVisibleRange({
      from: firstMatchingBar.time as Time,
      to: lastBar.time as Time,
    });
  }, []);

  // Initialize and mount Lightweight Chart
  useEffect(() => {
    if (!containerRef.current || !chartData || chartData.bars.length === 0) return;

    const host = containerRef.current;
    let chart: IChartApi | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      // Calculate dynamic pane heights
      const totalHeight = 440;
      const volumeHeight = showVolume ? 65 : 0;
      const macdHeight = showMACD ? 85 : 0;
      const mainHeight = totalHeight - volumeHeight - macdHeight - 35; // account for time scale

      chart = createChart(host, {
        width: host.clientWidth,
        height: totalHeight,
        layout: {
          background: { type: ColorType.Solid, color: "#09131e" },
          textColor: "#94a3b8",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 11,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: "rgba(30, 41, 59, 0.5)" },
          horzLines: { color: "rgba(30, 41, 59, 0.5)" },
        },
        crosshair: {
          vertLine: {
            color: "rgba(148, 163, 184, 0.4)",
            width: 1,
            style: LineStyle.Dashed,
          },
          horzLine: {
            color: "rgba(148, 163, 184, 0.4)",
            width: 1,
            style: LineStyle.Dashed,
          },
        },
        rightPriceScale: {
          borderColor: "#1e293b",
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        timeScale: {
          borderColor: "#1e293b",
          timeVisible: false,
          rightOffset: 4,
          barSpacing: 8,
        },
        localization: {
          locale: "id-ID",
          dateFormat: "dd/MM/yyyy",
        },
      });

      chartRef.current = chart;

      // --- PANE 0: Candlestick Series ---
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
        lastValueVisible: true,
        priceLineVisible: false,
      }, 0);

      candleSeries.setData(
        chartData.bars.map((b) => ({
          time: b.time as Time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );

      // --- PANE 0: Bandar Avg Cost Line (Bonus Feature) ---
      if (showBandarCost && bandarAvgCost && bandarAvgCost > 0) {
        const bandarLineSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: true,
          title: "Modal Bandar",
        }, 0);

        bandarLineSeries.setData(
          chartData.bars.map((b) => ({
            time: b.time as Time,
            value: bandarAvgCost,
          }))
        );
      }

      // --- PANE 0: Supertrend Series (single series with per-point color avoids diagonal cross-lines) ---
      if (showSupertrend && chartData.supertrend.length > 0) {
        const supertrendSeries = chart.addSeries(LineSeries, {
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          lastValueVisible: true,
          priceLineVisible: false,
          title: "Supertrend",
        }, 0);

        supertrendSeries.setData(
          chartData.supertrend.map((pt) => ({
            time: pt.time as Time,
            value: pt.value,
            color: pt.color,
          }))
        );
      }

      let currentPaneIndex = 1;

      // --- PANE 1: Volume Series ---
      if (showVolume) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
          title: "Volume",
        }, currentPaneIndex);

        volumeSeries.setData(
          chartData.bars.map((b) => ({
            time: b.time as Time,
            value: b.volume,
            color: b.close >= b.open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
          }))
        );

        currentPaneIndex++;
      }

      // --- PANE 2: MACD Series ---
      if (showMACD && chartData.macd.length > 0) {
        const macdHistSeries = chart.addSeries(HistogramSeries, {
          priceLineVisible: false,
          lastValueVisible: false,
          title: "MACD Hist",
        }, currentPaneIndex);

        macdHistSeries.setData(
          chartData.macd
            .filter((m) => m.histogram !== null)
            .map((m) => ({
              time: m.time as Time,
              value: m.histogram!,
              color: (m.histogram ?? 0) >= 0 ? "rgba(16, 185, 129, 0.7)" : "rgba(239, 68, 68, 0.7)",
            }))
        );

        const macdLineSeries = chart.addSeries(LineSeries, {
          color: "#38bdf8",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "MACD",
        }, currentPaneIndex);

        macdLineSeries.setData(
          chartData.macd
            .filter((m) => m.macd !== null)
            .map((m) => ({ time: m.time as Time, value: m.macd! }))
        );

        const signalLineSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "Signal",
        }, currentPaneIndex);

        signalLineSeries.setData(
          chartData.macd
            .filter((m) => m.signal !== null)
            .map((m) => ({ time: m.time as Time, value: m.signal! }))
        );
      }

      // Adjust pane heights
      const panes = chart.panes();
      if (panes[0]) panes[0].setHeight(mainHeight);
      if (showVolume && panes[1]) panes[1].setHeight(volumeHeight);
      if (showMACD && panes[showVolume ? 2 : 1]) {
        panes[showVolume ? 2 : 1].setHeight(macdHeight);
      }

      // Apply initial visible timeframe
      applyTimeframe(chart, chartData.bars, activeRange);

      // Subscribe to crosshair move for real-time header legend
      const barMap = new Map(chartData.bars.map((b) => [b.time, b]));
      const stMap = new Map(chartData.supertrend.map((s) => [s.time, s]));
      const macdMap = new Map(chartData.macd.map((m) => [m.time, m]));

      chart.subscribeCrosshairMove((param) => {
        if (!param.time) {
          setHoverBar(null);
          return;
        }

        const dateStr = String(param.time);
        const b = barMap.get(dateStr);
        if (b) {
          const st = stMap.get(dateStr);
          const mc = macdMap.get(dateStr);
          const chg = b.open > 0 ? ((b.close - b.open) / b.open) * 100 : 0;

          setHoverBar({
            date: b.time,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            changePct: chg,
            volume: b.volume,
            supertrend: st ? { value: st.value, direction: st.direction } : undefined,
            macd: mc ? { macd: mc.macd, signal: mc.signal, hist: mc.histogram } : undefined,
          });
        }
      });

      // ResizeObserver for dynamic responsiveness
      resizeObserver = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (!rect || rect.width <= 0 || !chart) return;
        chart.applyOptions({ width: Math.floor(rect.width) });
      });

      resizeObserver.observe(host);
    } catch (err) {
      console.error("Error creating chart:", err);
    }

    return () => {
      resizeObserver?.disconnect();
      chart?.remove();
      chartRef.current = null;
    };
  }, [
    chartData,
    showVolume,
    showSupertrend,
    showMACD,
    showBandarCost,
    bandarAvgCost,
    applyTimeframe,
    activeRange,
  ]);

  const handleTimeframeChange = (range: TimeframeRange) => {
    setActiveRange(range);
    if (chartRef.current && chartData?.bars) {
      applyTimeframe(chartRef.current, chartData.bars, range);
    }
  };

  const displayBar = hoverBar || (chartData?.bars.length ? (() => {
    const last = chartData.bars[chartData.bars.length - 1];
    const st = chartData.supertrend.find((s) => s.time === last.time);
    const mc = chartData.macd.find((m) => m.time === last.time);
    const chg = last.open > 0 ? ((last.close - last.open) / last.open) * 100 : 0;
    return {
      date: last.time,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      changePct: chg,
      volume: last.volume,
      supertrend: st ? { value: st.value, direction: st.direction } : undefined,
      macd: mc ? { macd: mc.macd, signal: mc.signal, hist: mc.histogram } : undefined,
    };
  })() : null);

  return (
    <div className="bf-inline-chart-card">
      {/* Chart Top Navigation Bar */}
      <div className="bf-chart-toolbar">
        <div className="bf-chart-title-group">
          <span className="bf-chart-title-tag">📈 CANDLESTICK HARIAN</span>
          <span className="bf-chart-ticker-name">{ticker}</span>
          {bandarAvgCost && bandarAvgCost > 0 && (
            <span className="bf-chart-bandar-cost-tag">
              Modal Bandar: Rp {bandarAvgCost.toLocaleString("id-ID")}
            </span>
          )}
        </div>

        {/* Timeframe & Indicator Controls */}
        <div className="bf-chart-controls">
          {/* Timeframe Buttons */}
          <div className="bf-timeframe-btn-group">
            {(["1B", "3B", "6B", "1T", "ALL"] as TimeframeRange[]).map((tf) => (
              <button
                key={tf}
                type="button"
                className={`bf-tf-btn ${activeRange === tf ? "active" : ""}`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf === "ALL" ? "Semua" : tf}
              </button>
            ))}
          </div>

          {/* Indicator Toggle Checkboxes */}
          <div className="bf-indicator-toggles">
            <label className={`bf-toggle-pill ${showSupertrend ? "active green" : ""}`}>
              <input
                type="checkbox"
                checked={showSupertrend}
                onChange={(e) => setShowSupertrend(e.target.checked)}
              />
              Supertrend (10,3)
            </label>

            <label className={`bf-toggle-pill ${showVolume ? "active blue" : ""}`}>
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
              />
              Volume
            </label>

            <label className={`bf-toggle-pill ${showMACD ? "active sky" : ""}`}>
              <input
                type="checkbox"
                checked={showMACD}
                onChange={(e) => setShowMACD(e.target.checked)}
              />
              MACD (12,26,9)
            </label>

            {bandarAvgCost && bandarAvgCost > 0 && (
              <label className={`bf-toggle-pill ${showBandarCost ? "active amber" : ""}`}>
                <input
                  type="checkbox"
                  checked={showBandarCost}
                  onChange={(e) => setShowBandarCost(e.target.checked)}
                />
                Modal Bandar
              </label>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              className="bf-chart-close-btn"
              onClick={onClose}
              title="Tutup Chart"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chart Legend / Hover Readout */}
      {displayBar && (
        <div className="bf-chart-legend-bar">
          <div className="bf-legend-item">
            <span className="lbl">Tgl:</span>
            <span className="val">{displayBar.date}</span>
          </div>
          <div className="bf-legend-item">
            <span className="lbl">O:</span>
            <span className="val">{displayBar.open.toLocaleString("id-ID")}</span>
          </div>
          <div className="bf-legend-item">
            <span className="lbl">H:</span>
            <span className="val">{displayBar.high.toLocaleString("id-ID")}</span>
          </div>
          <div className="bf-legend-item">
            <span className="lbl">L:</span>
            <span className="val">{displayBar.low.toLocaleString("id-ID")}</span>
          </div>
          <div className="bf-legend-item">
            <span className="lbl">C:</span>
            <span className={`val ${displayBar.close >= displayBar.open ? "pos" : "neg"}`}>
              {displayBar.close.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="bf-legend-item">
            <span className="lbl">Chg:</span>
            <span className={`val ${displayBar.changePct >= 0 ? "pos" : "neg"}`}>
              {displayBar.changePct >= 0 ? "+" : ""}
              {displayBar.changePct.toFixed(2)}%
            </span>
          </div>
          <div className="bf-legend-item">
            <span className="lbl">Vol:</span>
            <span className="val">{displayBar.volume.toLocaleString("id-ID")}</span>
          </div>

          {showSupertrend && displayBar.supertrend && (
            <div className="bf-legend-item">
              <span className="lbl">ST:</span>
              <span className={`val ${displayBar.supertrend.direction === "up" ? "pos" : "neg"}`}>
                {displayBar.supertrend.value.toLocaleString("id-ID")} ({displayBar.supertrend.direction.toUpperCase()})
              </span>
            </div>
          )}

          {showMACD && displayBar.macd?.macd !== null && (
            <div className="bf-legend-item">
              <span className="lbl">MACD:</span>
              <span className="val sky">{displayBar.macd?.macd}</span>
              <span className="lbl" style={{ marginLeft: "4px" }}>Sig:</span>
              <span className="val amber">{displayBar.macd?.signal}</span>
              <span className="lbl" style={{ marginLeft: "4px" }}>Hist:</span>
              <span className={`val ${(displayBar.macd?.hist ?? 0) >= 0 ? "pos" : "neg"}`}>
                {displayBar.macd?.hist}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="bf-chart-container-wrap">
        {loading && (
          <div className="bf-chart-loading-overlay">
            <span className="bf-pulse-loader">⏳ Mengambil candlestick & indikator {ticker}...</span>
          </div>
        )}

        {error && (
          <div className="bf-chart-error-overlay">
            <span className="neg" style={{ fontWeight: 700 }}>⚠️ {error}</span>
            <button
              type="button"
              className="bf-btn-secondary"
              style={{ marginTop: "10px", padding: "4px 12px", fontSize: "12px" }}
              onClick={() => {
                setLoading(true);
                setError(null);
                fetch(`/api/broker-flow/chart?ticker=${ticker}`)
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success) setChartData(d);
                    else setError(d.error);
                  })
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false));
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div
          ref={containerRef}
          className="bf-chart-canvas-host"
          style={{ width: "100%", height: "440px" }}
        />
      </div>

      <div className="bf-chart-footer">
        <span>Powered by TradingView Lightweight Charts™ &amp; Max MCP Data Feed</span>
        <span>• Garis putus-putus oranye menunjukkan batas Modal Rata-rata Bandar ({bandarAvgCost ? `Rp ${bandarAvgCost.toLocaleString("id-ID")}` : "N/A"})</span>
      </div>
    </div>
  );
}
