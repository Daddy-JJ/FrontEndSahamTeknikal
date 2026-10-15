import { chartFixture } from "./chart-fixture.ts";
import { chartPerformanceFixture } from './chart-perf-fixture.ts';
import type {
  ChartData,
  ChartEnvelope,
  ChartIndicator,
} from "./chart-contract.ts";
function absentIndicators(
  data: ChartData,
  reason: string,
): ChartData["indicators"] {
  const unavailable = (value: ChartIndicator): ChartIndicator => ({
    ...value,
    status: "unavailable",
    reason,
    points: [],
  });
  return {
    sma10: unavailable(data.indicators.sma10),
    ema200: unavailable(data.indicators.ema200),
    macd: unavailable(data.indicators.macd),
    macd_signal: unavailable(data.indicators.macd_signal),
    macd_histogram: unavailable(data.indicators.macd_histogram),
  };
}
/** Explicit synthetic development scenarios, never imported by live server reader. */
export function previewChart(scenario: string, cursor?: string): unknown {
  if (scenario === 'perf500') return chartPerformanceFixture();
  const envelope = chartFixture();
  if (!envelope.success) return envelope;
  const data = envelope.data;
  if (scenario === "empty")
    return {
      ...envelope,
      data: {
        ...data,
        bars: [],
        gaps: data.sessions.map((session) => ({
          session,
          reason: "missing_bar",
        })),
        indicators: absentIndicators(data, "missing_history"),
      },
    };
  if (scenario === "invalid") return { ...envelope, private: "invalid" };
  if (scenario === "paging" || scenario === "revision-race") {
    const source = { ...data.source, history_start: "2026-10-07" };
    if (!cursor)
      return {
        ...envelope,
        data: {
          ...data,
          source,
          pagination: {
            ...data.pagination,
            has_more: true,
            next_cursor: "fixture-older",
          },
        },
      };
    return {
      ...envelope,
      data: {
        ...data,
        source,
        revision: scenario === "revision-race" ? "changed" : data.revision,
        sessions: ["2026-10-07"],
        bars: [
          {
            session: "2026-10-07",
            open: "980",
            high: "1000",
            low: "970",
            close: "990",
            volume: "100000",
          },
        ],
        gaps: [],
        indicators: Object.fromEntries(
          Object.entries(data.indicators).map(([key, value]) => [
            key,
            { ...value, points: [{ session: "2026-10-07", value: 1 }] },
          ]),
        ),
        overlays: { ...data.overlays, levels: [] },
        pagination: {
          ...data.pagination,
          window_from: "2026-10-07",
          window_to: "2026-10-07",
          returned_slots: 1,
          has_more: false,
          next_cursor: null,
        },
      },
    };
  }
  if (scenario === "overlay-paging") {
    if (!cursor)
      return {
        ...envelope,
        data: {
          ...data,
          overlays: {
            ...data.overlays,
            has_more: true,
            next_cursor: "fixture-overlays",
          },
          pagination: {
            ...data.pagination,
            has_more: true,
            next_cursor: "fixture-older",
          },
        },
      };
    return {
      ...envelope,
      data: {
        ...data,
        sessions: [],
        bars: [],
        gaps: [],
        indicators: absentIndicators(data, "overlay_page"),
        overlays: {
          ...data.overlays,
          levels: [],
          markers: [
            {
              id: "fixture-fill",
              kind: "entry_fill",
              session: "2026-10-08",
              available_session: "2026-10-08",
              price: "1000",
              source_id: "fixture-event",
              status: "simulated",
            },
          ],
        },
        pagination: { ...data.pagination, returned_slots: 0 },
      },
    };
  }
  return envelope as ChartEnvelope;
}
