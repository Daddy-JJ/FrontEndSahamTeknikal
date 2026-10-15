import type { ChartSource } from "./chart-contract.ts";
import {
  ensure,
  object,
  text,
  nullableText,
  one,
  integer,
  date,
  nullableDate,
  decimal,
  array,
  sortedSessions,
  cursor,
  source,
} from "./chart-validation.ts";

function context(value: unknown) {
  const c = object(value, [
    "kind",
    "id",
    "view",
    "signal_session",
    "snapshot_cutoff",
    "model_version",
    "experiment",
    "engine_source_revision",
  ]);
  one(c.kind, ["latest", "signal", "paper", "actual"]);
  one(c.view, ["snapshot", "followup"]);
  nullableText(c.id, 256);
  for (const key of ["signal_session", "snapshot_cutoff"]) nullableDate(c[key]);
  for (const key of ["model_version", "experiment", "engine_source_revision"])
    nullableText(c[key]);
  ensure((c.kind === "latest") === (c.id === null));
  ensure(
    !(["latest", "actual"].includes(String(c.kind)) && c.view === "snapshot"),
  );
  if (c.kind === "signal")
    ensure(typeof c.id === "string" && /^[0-9a-f]{64}$/.test(c.id));
  if (c.kind === "actual")
    ensure(
      typeof c.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          c.id,
        ),
    );
  if (["signal", "paper"].includes(String(c.kind))) date(c.signal_session);
  if (c.view === "snapshot")
    ensure(
      c.snapshot_cutoff !== null && c.snapshot_cutoff === c.signal_session,
    );
  if (c.kind === "latest")
    ensure(c.signal_session === null && c.snapshot_cutoff === null);
  return c;
}
function provenance(
  d: Record<string, unknown>,
  c: Record<string, unknown>,
  mode: "live" | "fixture",
) {
  source(d.source);
  const s = d.source as ChartSource;
  one(s.provider, ["fixture", "yfinance", "eodhd"]);
  ensure((mode === "fixture") === (s.provider === "fixture"));
  ensure((mode === "fixture") === (s.scope === "fixture"));
  ensure(!(c.kind !== "paper" && s.scope === "paper_recovery"));
  if (d.signal_source !== null) {
    source(d.signal_source);
    const signal = d.signal_source as ChartSource;
    one(signal.provider, ["fixture", "yfinance", "eodhd"]);
    ensure((mode === "fixture") === (signal.provider === "fixture"));
    ensure((mode === "fixture") === (signal.scope === "fixture"));
    ensure(signal.resolved_cutoff === c.signal_session);
  }
  if (["signal", "paper"].includes(String(c.kind)))
    ensure(d.signal_source !== null);
  if (c.kind === "latest") ensure(d.signal_source === null);
  if (c.view === "snapshot") {
    const signal = d.signal_source as ChartSource;
    ensure(
      s.series_id === signal.series_id &&
        s.resolved_input_digest === signal.resolved_input_digest &&
        s.resolved_cutoff === c.snapshot_cutoff,
    );
  }
  return s;
}
function quality(value: unknown, s: ChartSource, c: Record<string, unknown>) {
  const q = object(value, [
    "completeness",
    "freshness",
    "expected_session",
    "reasons",
    "warnings",
  ]);
  one(q.completeness, ["complete", "partial"]);
  one(q.freshness, ["current", "stale", "unknown"]);
  nullableDate(q.expected_session);
  for (const k of ["reasons", "warnings"]) {
    array(q[k], 20);
    (q[k] as unknown[]).forEach((v) => text(v, k === "reasons" ? 128 : 512));
  }
  if (q.freshness === "current")
    ensure(
      q.expected_session !== null &&
        s.last_market_session >= String(q.expected_session),
    );
  if (c.view === "snapshot") ensure(q.expected_session === c.snapshot_cutoff);
  return q;
}
function pagination(value: unknown, sessions: string[], cutoff: string) {
  const p = object(value, [
    "window_from",
    "window_to",
    "returned_slots",
    "limit",
    "has_more",
    "next_cursor",
  ]);
  date(p.window_from);
  date(p.window_to);
  ensure(p.window_from <= p.window_to && p.window_to <= cutoff);
  integer(p.limit, 1, 500);
  integer(p.returned_slots, 0, Number(p.limit));
  ensure(
    p.returned_slots === sessions.length &&
      sessions.every(
        (v) => v >= String(p.window_from) && v <= String(p.window_to),
      ),
  );
  cursor(p.has_more, p.next_cursor);
  return p;
}
function bars(value: unknown, sessions: string[], s: ChartSource) {
  array(value);
  const dates: string[] = [];
  for (const raw of value) {
    const b = object(raw, [
      "session",
      "open",
      "high",
      "low",
      "close",
      "volume",
    ]);
    date(b.session);
    ensure(sessions.includes(b.session) && b.session >= s.history_start);
    for (const key of ["open", "high", "low", "close"]) decimal(b[key]);
    ensure(
      Number(b.low) <= Number(b.open) &&
        Number(b.low) <= Number(b.close) &&
        Number(b.high) >= Number(b.open) &&
        Number(b.high) >= Number(b.close),
    );
    ensure(
      typeof b.volume === "string" &&
        /^\d+$/.test(b.volume) &&
        Number.isSafeInteger(Number(b.volume)),
    );
    dates.push(b.session);
  }
  sortedSessions(dates);
  return dates;
}
function gaps(
  value: unknown,
  sessions: string[],
  barDates: string[],
  q: Record<string, unknown>,
) {
  array(value);
  const dates: string[] = [];
  for (const raw of value) {
    const g = object(raw, ["session", "reason"]);
    date(g.session);
    text(g.reason, 128);
    ensure(sessions.includes(g.session) && !barDates.includes(g.session));
    dates.push(g.session);
  }
  sortedSessions(dates);
  ensure(barDates.length + dates.length === sessions.length);
  ensure(!dates.length || q.completeness === "partial");
  return dates;
}
function indicators(value: unknown, sessions: string[], gapDates: string[]) {
  const all = object(value, [
    "sma10",
    "ema200",
    "macd",
    "macd_signal",
    "macd_histogram",
  ]);
  for (const raw of Object.values(all)) {
    const i = object(raw, [
      "status",
      "reason",
      "definition_version",
      "artifact_digest",
      "history_count",
      "eligible_from",
      "points",
    ]);
    one(i.status, ["ready", "unavailable"]);
    text(i.definition_version, 128);
    nullableText(i.artifact_digest);
    integer(i.history_count);
    nullableDate(i.eligible_from);
    array(i.points);
    if (i.status === "unavailable") {
      text(i.reason, 128);
      ensure(i.points.length === 0);
    } else {
      nullableText(i.reason, 128);
      text(i.artifact_digest);
      ensure(i.points.length === sessions.length);
      i.points.forEach((value, index) => {
        const point = object(value, ["session", "value"]);
        ensure(point.session === sessions[index]);
        ensure(
          point.value === null ||
            (typeof point.value === "number" &&
              Number.isFinite(point.value) &&
              Math.abs(point.value) <= Number.MAX_SAFE_INTEGER),
        );
        if (gapDates.includes(String(point.session)))
          ensure(point.value === null);
      });
    }
  }
}
function overlayId(value: Record<string, unknown>, ids: Set<string>) {
  text(value.id, 256);
  text(value.source_id, 256);
  ensure(!ids.has(String(value.id)));
  ids.add(String(value.id));
}
function level(
  raw: unknown,
  ids: Set<string>,
  cutoff: string,
  p: Record<string, unknown>,
) {
  const l = object(raw, [
    "id",
    "kind",
    "price",
    "starts_at",
    "ends_at",
    "available_session",
    "origin_session",
    "source_id",
    "status",
  ]);
  overlayId(l, ids);
  one(l.kind, [
    "planned_entry",
    "initial_stop",
    "current_stop",
    "target",
    "fractal",
  ]);
  one(l.status, ["planned", "effective", "ended"]);
  decimal(l.price);
  for (const key of ["starts_at", "available_session"]) date(l[key]);
  nullableDate(l.ends_at);
  nullableDate(l.origin_session);
  ensure(
    String(l.available_session) <= cutoff &&
      String(l.starts_at) >= String(l.available_session) &&
      (!l.ends_at || String(l.ends_at) >= String(l.starts_at)),
  );
  const future = String(l.starts_at) > cutoff;
  ensure(!future || l.status === "planned");
  ensure(
    future ||
      (String(l.starts_at) <= String(p.window_to) &&
        (!l.ends_at || String(l.ends_at) >= String(p.window_from))),
  );
}
function marker(
  raw: unknown,
  ids: Set<string>,
  cutoff: string,
  p: Record<string, unknown>,
) {
  const m = object(raw, [
    "id",
    "kind",
    "session",
    "available_session",
    "price",
    "source_id",
    "status",
  ]);
  overlayId(m, ids);
  one(m.kind, [
    "signal",
    "entry_fill",
    "ma_exit_trigger",
    "exit_fill",
    "ambiguous",
  ]);
  one(m.status, ["confirmed", "simulated", "ambiguous"]);
  date(m.session);
  date(m.available_session);
  ensure(
    m.session >= String(p.window_from) &&
      m.session <= String(p.window_to) &&
      m.available_session <= cutoff,
  );
  if (m.price !== null) decimal(m.price);
  if (m.kind === "ambiguous") ensure(m.status === "ambiguous");
}
function overlays(value: unknown, cutoff: string, p: Record<string, unknown>) {
  const o = object(value, [
    "status",
    "reason",
    "levels",
    "markers",
    "has_more",
    "next_cursor",
  ]);
  one(o.status, ["ready", "partial", "unavailable"]);
  if (o.status === "ready") ensure(o.reason === null);
  else text(o.reason, 128);
  array(o.levels);
  array(o.markers);
  ensure(o.levels.length + o.markers.length <= 500);
  cursor(o.has_more, o.next_cursor);
  const ids = new Set<string>();
  for (const raw of o.levels) level(raw, ids, cutoff, p);
  for (const raw of o.markers) marker(raw, ids, cutoff, p);
}
export function validateData(
  value: unknown,
  mode: "live" | "fixture",
  ticker: string,
) {
  const d = object(value, [
    "ticker",
    "data_mode",
    "timeframe",
    "exchange",
    "timezone",
    "currency",
    "volume_unit",
    "context",
    "revision",
    "source",
    "signal_source",
    "quality",
    "sessions",
    "bars",
    "gaps",
    "indicators",
    "overlays",
    "pagination",
  ]);
  ensure(
    d.ticker === ticker &&
      d.data_mode === mode &&
      d.timeframe === "1d" &&
      d.exchange === "XIDX" &&
      d.timezone === "Asia/Jakarta" &&
      d.currency === "IDR" &&
      d.volume_unit === "shares",
  );
  text(d.revision, 2048);
  const c = context(d.context);
  const s = provenance(d, c, mode);
  const q = quality(d.quality, s, c);
  array(d.sessions);
  sortedSessions(d.sessions);
  const sessions = d.sessions as string[];
  const cutoff =
    c.view === "snapshot" ? String(c.snapshot_cutoff) : s.resolved_cutoff;
  ensure(sessions.every((v) => v <= cutoff));
  const p = pagination(d.pagination, sessions, cutoff);
  const barDates = bars(d.bars, sessions, s);
  const gapDates = gaps(d.gaps, sessions, barDates, q);
  indicators(d.indicators, sessions, gapDates);
  overlays(d.overlays, cutoff, p);
}
