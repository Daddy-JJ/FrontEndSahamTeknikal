import type { ChartEnvelope, ChartIndicator, ChartRequest, ChartSource } from "./chart-contract.ts";
import { chartFailure } from "./chart-reader.ts";
import type { Snapshot, Signal } from "./types.ts";

function fixtureSource(snapshot: Snapshot, ticker: string, cutoff: string, signal?: Signal): ChartSource {
  const bars = snapshot.charts[ticker].filter(b => b.session <= cutoff);
  return {
    series_id: "00000000-0000-4000-8000-000000000002",
    input_digest: signal?.input_digest ?? snapshot.run_digest,
    resolved_input_digest: signal?.input_digest ?? snapshot.run_digest,
    resolved_cutoff: cutoff,
    provider: "fixture", provider_version: "workspace-fixture-v1", price_basis: "synthetic_ohlcv_v1",
    scope: "fixture", fetched_at: signal?.published_at ?? snapshot.session + "T12:00:00Z",
    stored_at: signal?.published_at ?? snapshot.session + "T12:00:00Z",
    history_start: bars[0].session, last_market_session: bars.at(-1)!.session,
  };
}
const unavailable = (): ChartIndicator => ({ status: "unavailable", reason: "fixture_indicator_not_prepared",
  definition_version: "workspace-fixture-v1", artifact_digest: null, history_count: 0,
  eligible_from: null, points: [] });

/** Converts only explicit synthetic Workspace inputs; never used by the live reader. */
export function workspaceChartFixture(snapshot: Snapshot, request: ChartRequest): ChartEnvelope {
  const signal = request.context === "signal" ? snapshot.signals.find(s => s.id === request.context_id && s.ticker === request.ticker) : undefined;
  if (snapshot.data_mode !== "fixture" || !snapshot.charts[request.ticker]
      || !Number.isInteger(request.limit) || request.limit < 1 || request.limit > 500
      || !["latest", "signal"].includes(request.context) || request.context === "signal" && !signal
      || request.context === "latest" && request.view !== "followup")
    return chartFailure("NOT_FOUND", "fixture");
  const cutoff = request.view === "snapshot" ? signal!.session : snapshot.session;
  const full = snapshot.charts[request.ticker].filter(b => b.session <= cutoff);
  if (!full.length) return chartFailure("DATA_UNAVAILABLE", "fixture");
  if (signal && !snapshot.charts[request.ticker].some(b => b.session <= signal.session))
    return chartFailure("SNAPSHOT_UNAVAILABLE", "fixture");
  const selected = full.slice(-request.limit);
  const sessions = selected.map(b => b.session);
  const source = fixtureSource(snapshot, request.ticker, cutoff, request.view === "snapshot" ? signal : undefined);
  const ema200: ChartIndicator = {
    status: "ready", reason: null, definition_version: "workspace-prepared-ema200-v1",
    artifact_digest: snapshot.run_digest, history_count: full.length, eligible_from: full[0].session,
    points: selected.map(b => ({ session: b.session, value: b.ema200 })),
  };
  return { contract_version: "ticker-chart-v1", success: true, error: null, data: {
    ticker: request.ticker, data_mode: "fixture", timeframe: "1d", exchange: "XIDX", timezone: "Asia/Jakarta",
    currency: "IDR", volume_unit: "shares", revision: "workspace-fixture:" + snapshot.run_digest + ":" + cutoff,
    context: { kind: request.context, id: signal?.id ?? null, view: request.view,
      signal_session: signal?.session ?? null, snapshot_cutoff: request.view === "snapshot" ? cutoff : null,
      model_version: signal ? "workspace-fixture-v1" : null, experiment: null, engine_source_revision: null },
    source, signal_source: signal ? fixtureSource(snapshot, request.ticker, signal.session, signal) : null,
    quality: { completeness: "complete", freshness: "current", expected_session: cutoff, reasons: [],
      warnings: full.length > selected.length ? ["fixture_preview_window_limited"] : [] },
    sessions, bars: selected.map(b => ({ session: b.session, open: String(b.open), high: String(b.high),
      low: String(b.low), close: String(b.close), volume: String(b.volume) })), gaps: [],
    indicators: { sma10: unavailable(), ema200, macd: unavailable(), macd_signal: unavailable(), macd_histogram: unavailable() },
    overlays: { status: "ready", reason: null, levels: signal?.candidate.stop ? [{
      id: signal.id + ":initial-stop", kind: "initial_stop", price: String(signal.candidate.stop),
      starts_at: signal.session, ends_at: null, available_session: signal.session, origin_session: null,
      source_id: signal.id, status: "planned",
    }] : [], markers: signal ? [{ id: signal.id + ":signal", kind: "signal", session: signal.session,
      available_session: signal.session, price: String(signal.candidate.reference_close), source_id: signal.id,
      status: "confirmed" }] : [], has_more: false, next_cursor: null },
    pagination: { window_from: sessions[0], window_to: sessions.at(-1)!, returned_slots: sessions.length,
      limit: request.limit, has_more: false, next_cursor: null },
  } };
}
