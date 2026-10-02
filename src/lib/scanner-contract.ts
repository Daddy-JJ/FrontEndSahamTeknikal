// Read/display contract from backend scan_envelope and immutable tables.
// No calendar, indicator, ranking, or financial calculations belong here.
export const scannerPageSize = 25;
export const scannerStrategies = ["MACD_EMA200_V1", "FRACTAL_BREAKOUT_V1", "RS_BREAKOUT_V1", "PULLBACK_RECLAIM_V1"] as const;
export type ScannerQuery = { run?: string; section: "signals" | "quality"; page: number };
export type ScanRun = {
  id: string; namespace: "forward"; data_mode: "live" | "fixture";
  session_date: string; status: "complete" | "partial" | "failed";
  coverage_valid: number; coverage_total: number; stored_at: string; run_digest: string;
  ranking_status: "complete" | "cross_section_incomplete";
  publication_deadline: string | null;
};
export type ScanCandidate = {
  strategy: string; triggered: boolean; reason: string;
  reference_close: number; stop: number | null;
};
export type ScanItem = { ticker: string; status: string; candidates: ScanCandidate[] };
export type PublishedSignal = {
  id: string; namespace: string; data_mode: "live" | "fixture";
  ticker: string; strategy: string; session_date: string; planned_entry_session: string;
  cohort: "forward" | "late_model_only"; published_at: string;
  provider: string; universe_version: string; calendar_version: string;
  candidate: ScanCandidate;
};
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 200;
const date = (value: unknown): value is string => typeof value === "string"
  && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString().slice(0, 10) === value;
const timestamp = (value: unknown): value is string => typeof value === "string"
  && /(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
const uuid = (value: unknown): value is string => typeof value === "string"
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

export function scannerQuery(query: Record<string, string | string[] | undefined>): ScannerQuery | null {
  const page = query.page ?? "1", section = query.section ?? "signals";
  if (typeof page !== "string" || !/^[1-9]\d?$/.test(page) || Number(page) > 40
    || (section !== "signals" && section !== "quality")
    || (query.run !== undefined && !uuid(query.run))) return null;
  return { run: query.run as string | undefined, section, page: Number(page) };
}
export function scannerHref(run: string, section: ScannerQuery["section"], page = 1) {
  const query = new URLSearchParams({ run, section, page: String(page) });
  return `/scanner?${query}`;
}
export function parseScanRun(value: unknown, mode: "live" | "fixture"): ScanRun | null {
  if (!object(value) || !uuid(value.id) || value.namespace !== "forward" || value.data_mode !== mode
    || !date(value.session_date) || !timestamp(value.stored_at)
    || typeof value.run_digest !== "string" || !/^[a-f0-9]{64}$/.test(value.run_digest)
    || !Number.isInteger(value.coverage_valid) || !Number.isInteger(value.coverage_total)
    || typeof value.coverage_valid !== "number" || typeof value.coverage_total !== "number"
    || value.coverage_valid < 0 || value.coverage_total < 1 || value.coverage_total > 1000
    || value.coverage_valid > value.coverage_total
    || !["complete", "cross_section_incomplete"].includes(String(value.ranking_status))
    || (value.publication_deadline !== null && !timestamp(value.publication_deadline))) return null;
  const validStatus = value.status === "complete" ? value.coverage_valid === value.coverage_total
    : value.status === "partial" ? value.coverage_valid > 0 && value.coverage_valid < value.coverage_total
    : value.status === "failed" && value.coverage_valid === 0;
  if (!validStatus || (value.status !== "complete" && value.ranking_status !== "cross_section_incomplete")) return null;
  return value as ScanRun;
}
function candidate(value: unknown): ScanCandidate | null {
  if (!object(value) || !scannerStrategies.includes(value.strategy as typeof scannerStrategies[number])
    || typeof value.triggered !== "boolean" || !text(value.reason) || !positive(value.reference_close)
    || (value.stop !== null && (typeof value.stop !== "number" || !Number.isFinite(value.stop)))) return null;
  return value as ScanCandidate;
}
export function parseScanItem(value: unknown): ScanItem | null {
  if (!object(value) || !text(value.ticker) || !text(value.status) || !object(value.snapshot)
    || value.snapshot.ticker !== value.ticker || value.snapshot.status !== value.status
    || !Array.isArray(value.snapshot.candidates) || value.snapshot.candidates.length > 4) return null;
  const candidates = value.snapshot.candidates.map(candidate);
  if (candidates.some(c => c === null) || new Set(candidates.map(c => c?.strategy)).size !== candidates.length
    || (value.status !== "evaluated" && candidates.length !== 0)) return null;
  return { ticker: value.ticker, status: value.status, candidates: candidates as ScanCandidate[] };
}
export function parsePublishedSignal(value: unknown, run: ScanRun): PublishedSignal | null {
  if (!object(value) || !object(value.signals)) return null;
  const signal = value.signals, c = candidate(signal.candidate);
  if (!c || !c.triggered || c.strategy !== signal.strategy
    || typeof signal.id !== "string" || !/^[a-f0-9]{64}$/.test(signal.id)
    || !text(signal.ticker) || signal.namespace !== run.namespace || signal.data_mode !== run.data_mode
    || signal.session_date !== run.session_date || !date(signal.planned_entry_session)
    || signal.planned_entry_session <= run.session_date || !timestamp(signal.published_at)
    || !["forward", "late_model_only"].includes(String(signal.cohort))
    || !text(signal.universe_version) || !text(signal.calendar_version)
    || !(run.data_mode === "fixture" ? signal.provider === "fixture" : ["yfinance", "eodhd"].includes(String(signal.provider)))
    || (signal.strategy === "RS_BREAKOUT_V1" && run.ranking_status !== "complete")) return null;
  return { ...signal, candidate: c } as PublishedSignal;
}
export function scanWindow(run: ScanRun, now: number): "unknown" | "elapsed" | "open" {
  return run.publication_deadline === null ? "unknown"
    : now >= Date.parse(run.publication_deadline) ? "elapsed" : "open";
}
export const scanReasonLabels: Record<string, string> = {
  evaluated: "Dievaluasi", missing: "Data hilang", stale: "Data stale",
  incomplete: "Candle belum lengkap", data_quality_hold: "Quality hold",
  corporate_action_hold: "Corporate action belum direkonsiliasi",
  corporate_actions_unknown: "Kelengkapan corporate action belum diketahui",
  history_gap: "Gap histori", no_signal: "Aturan belum terpenuhi", eligible: "Memenuhi aturan",
  insufficient_history: "Histori belum mencukupi", cross_section_incomplete: "RS ditahan: cross-section belum lengkap",
};
