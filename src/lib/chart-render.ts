import type { ChartData, ChartLevel, ChartRequest } from "./chart-contract.ts";
export type RenderPoint = { time: string; value: number };

/** The library moves gap-dated markers to a neighbouring bar; keep those events in the audit only. */
export function candleMarkers(data: ChartData) {
  const valid = new Set(data.bars.map((bar) => bar.session));
  return data.overlays.markers.filter((marker) => valid.has(marker.session));
}
/** A separate line series per continuous run prevents the library joining null gaps. */
export function indicatorSegments(
  points: { session: string; value: number | null }[],
): RenderPoint[][] {
  const result: RenderPoint[][] = [];
  let run: RenderPoint[] = [];
  for (const point of points) {
    if (point.value === null) {
      if (run.length) result.push(run);
      run = [];
    } else run = [...run, { time: point.session, value: point.value }];
  }
  return run.length ? [...result, run] : result;
}
export function levelSegments(
  level: ChartLevel,
  data: ChartData,
): RenderPoint[][] {
  const valid = new Set(data.bars.map((b) => b.session));
  return indicatorSegments(
    data.sessions.map((session) => ({
      session,
      value:
        valid.has(session) &&
        session >= level.starts_at &&
        (!level.ends_at || session <= level.ends_at)
          ? Number(level.price)
          : null,
    })),
  );
}
export function chartRequestUrl(request: ChartRequest, cursor?: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request)) {
    if (value === undefined || key === "ticker" || (cursor && ["from", "to"].includes(key))) continue;
    params.set(key, String(value));
  }
  if (cursor) params.set("cursor", cursor);
  return `/api/chart/${encodeURIComponent(request.ticker)}?${params.toString()}`;
}
export function formatChartMoney(value: string | null) {
  if (value === null) return "—";
  const [whole, fraction] = value.split(".");
  return `Rp${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fraction ? "," + fraction : ""}`;
}
export function formatChartVolume(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
