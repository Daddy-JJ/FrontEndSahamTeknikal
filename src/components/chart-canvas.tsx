"use client";
import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  LineStyle,
  createSeriesMarkers,
  isBusinessDay,
  type IChartApi,
  type Time,
  type LineData,
  type SeriesMarker,
} from "lightweight-charts";
import type { ChartData } from "@/lib/chart-contract";
import {
  indicatorSegments,
  levelSegments,
  formatChartMoney,
  formatChartVolume,
  candleMarkers,
} from "@/lib/chart-render";
import styles from "./chart.module.css";
import { chartLabel } from "@/lib/chart-presentation";
type Props = {
  data: ChartData;
  sma10: boolean;
  ema200: boolean;
  macd: boolean;
  range: 3 | 6 | 12;
  reset: number;
  onError: () => void;
};
export type CanvasProps = Props;
const colours = {
  sma10: "#f2b44b",
  ema200: "#9caaff",
  macd: "#61d4ed",
  macd_signal: "#f2b44b",
};
function dateOf(time: Time) {
  if (isBusinessDay(time))
    return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
  return String(time);
}
function rangeChart(chart: IChartApi, data: ChartData, months: number) {
  const end = data.sessions.at(-1);
  if (!end) return;
  const start = new Date(end + "T00:00:00Z");
  start.setUTCMonth(start.getUTCMonth() - months);
  const first =
    data.sessions.find((s) => s >= start.toISOString().slice(0, 10)) ??
    data.sessions[0];
  chart.timeScale().setVisibleRange({ from: first, to: end });
}
function drawLines(chart: IChartApi, data: ChartData, props: Props) {
  for (const key of ["sma10", "ema200", "macd", "macd_signal"] as const) {
    if (
      (key === "sma10" && !props.sma10) ||
      (key === "ema200" && !props.ema200) ||
      (key.startsWith("macd") && !props.macd)
    )
      continue;
    for (const segment of indicatorSegments(data.indicators[key].points)) {
      const series = chart.addSeries(
        LineSeries,
        {
          color: colours[key],
          lineWidth: 1,
          pointMarkersVisible: segment.length === 1,
          lastValueVisible: false,
          priceLineVisible: false,
        },
        key.startsWith("macd") ? 2 : 0,
      );
      series.setData(segment as LineData<Time>[]);
    }
  }
  if (props.macd) {
    const histogram = chart.addSeries(
      HistogramSeries,
      { priceLineVisible: false, lastValueVisible: false },
      2,
    );
    histogram.setData(
      data.indicators.macd_histogram.points.map((p) =>
        p.value === null
          ? { time: p.session }
          : {
              time: p.session,
              value: p.value,
              color: p.value >= 0 ? "#53d4ad" : "#ef7b7b",
            },
      ),
    );
  }
  for (const level of data.overlays.levels) {
    const color = level.kind.includes("stop")
      ? "#ef7b7b"
      : level.kind === "target"
        ? "#53d4ad"
        : "#f2b44b";
    for (const segment of levelSegments(level, data)) {
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle:
          level.status === "planned" ? LineStyle.Dashed : LineStyle.Solid,
        pointMarkersVisible: segment.length === 1,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      series.setData(segment as LineData<Time>[]);
    }
  }
}
export default function ChartCanvas(props: Props) {
  const { data, onError } = props;
  const host = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    if (!host.current) return;
    let chart: IChartApi | null = null;
    let resize: ResizeObserver | null = null;
    try {
      const mobile = host.current.clientWidth < 768;
      const priceHeight = mobile ? 260 : 320;
      const volumeHeight = mobile ? 72 : 80;
      const macdHeight = mobile ? 100 : 120;
      chart = createChart(host.current, {
        width: host.current.clientWidth,
        height: priceHeight + volumeHeight + (props.macd ? macdHeight : 0) + 40,
        layout: {
          background: { type: ColorType.Solid, color: "#101922" },
          textColor: "#b7c9db",
          fontFamily: "monospace",
          fontSize: 11,
          attributionLogo: true,
        },
        grid: {
          vertLines: { color: "#202f3d" },
          horzLines: { color: "#202f3d" },
        },
        rightPriceScale: { borderColor: "#344959" },
        timeScale: {
          borderColor: "#344959",
          timeVisible: false,
          rightOffset: 2,
        },
        handleScroll: { vertTouchDrag: false, horzTouchDrag: true },
        localization: { locale: "id-ID" },
      });
      chartRef.current = chart;
      const candles = chart.addSeries(CandlestickSeries, {
        upColor: "#53d4ad",
        downColor: "#ef7b7b",
        borderVisible: false,
        wickUpColor: "#53d4ad",
        wickDownColor: "#ef7b7b",
        lastValueVisible: true,
        priceLineVisible: false,
      });
      const bars = new Map(data.bars.map((b) => [b.session, b]));
      candles.setData(
        data.sessions.map((time) => {
          const b = bars.get(time);
          return b
            ? {
                time,
                open: Number(b.open),
                high: Number(b.high),
                low: Number(b.low),
                close: Number(b.close),
              }
            : { time };
        }),
      );
      const volume = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
        },
        1,
      );
      volume.setData(
        data.sessions.map((time) => {
          const b = bars.get(time);
          return b
            ? {
                time,
                value: Number(b.volume),
                color:
                  Number(b.close) >= Number(b.open) ? "#28765f" : "#914f58",
              }
            : { time };
        }),
      );
      drawLines(chart, data, props);
      chart.panes()[0].setHeight(priceHeight);
      chart.panes()[1].setHeight(volumeHeight);
      if (props.macd && chart.panes()[2])
        chart.panes()[2].setHeight(macdHeight);
      const markers: SeriesMarker<Time>[] = candleMarkers(data).map((m) => ({
        time: m.session,
        color:
          m.status === "ambiguous"
            ? "#f2b44b"
            : m.kind === "exit_fill"
              ? "#ef7b7b"
              : "#61d4ed",
        shape: m.kind === "ambiguous" ? "square" : "circle",
        text: `${chartLabel(m.kind)}${m.status === "simulated" ? " (simulasi)" : ""}${m.price ? " " + formatChartMoney(m.price) : ""}`,
        ...(m.price
          ? { position: "atPriceMiddle" as const, price: Number(m.price) }
          : { position: "aboveBar" as const }),
      }));
      createSeriesMarkers(
        candles,
        markers.sort((a, b) => String(a.time).localeCompare(String(b.time))),
      );
      chart.subscribeCrosshairMove((event) =>
        setHover(event.time ? dateOf(event.time) : null),
      );
      rangeChart(chart, data, props.range);
      const liveChart = chart;
      resize = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (width && width > 0) liveChart.applyOptions({ width });
      });
      resize.observe(host.current);
    } catch {
      onError();
    }
    return () => {
      resize?.disconnect();
      chart?.remove();
      chartRef.current = null;
    };
    // Range/reset have their own effect; changing render options recreates all primitives with disposal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, props.sma10, props.ema200, props.macd, onError]);
  useEffect(() => {
    if (chartRef.current) rangeChart(chartRef.current, data, props.range);
  }, [data, props.range, props.reset]);
  const selected = data.bars.find(
    (b) => b.session === (hover ?? data.bars.at(-1)?.session),
  );
  const selectedDate = hover ?? selected?.session;
  return (
    <>
      <div className={styles.quote} aria-live="off">
        <strong>{selectedDate ?? "—"}</strong>
        {selected ? (
          <>
            <span>O {formatChartMoney(selected.open)}</span>
            <span>H {formatChartMoney(selected.high)}</span>
            <span>L {formatChartMoney(selected.low)}</span>
            <span>C {formatChartMoney(selected.close)}</span>
            <span>Vol {formatChartVolume(selected.volume)} saham</span>
          </>
        ) : (
          <span>OHLC sesi ini tidak tersedia.</span>
        )}
      </div>
      <div
        ref={host}
        className={styles.canvas}
        role="img"
        aria-label={`Chart harian ${data.ticker}. Data alternatif tersedia di tabel OHLC.`}
        data-testid="chart-canvas"
      />
      <p className={styles.caption}>
        Harga · volume saham{props.macd ? " · MACD" : ""}. Tidak ada data
        intraday. Garis terputus pada data tertahan.
        {candleMarkers(data).length < data.overlays.markers.length &&
          " Event pada sesi tanpa candle tersedia di rincian, tanpa dipindahkan ke sesi lain."}
      </p>
    </>
  );
}
