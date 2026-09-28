export type Strategy = "MACD_EMA200_V1" | "FRACTAL_BREAKOUT_V1" | "RS_BREAKOUT_V1" | "PULLBACK_RECLAIM_V1";
export type View = "overview" | "scanner" | "journal" | "analytics" | "operations";
export type ChartBar = { session: string; open: number; high: number; low: number; close: number; volume: number; ema20: number; ema50: number; ema200: number; histogram: number };
export type Signal = {
  id: string; ticker: string; session: string; published_at: string; input_digest: string;
  provider: string; price_basis: string; planned_entry_session: string; cohort: string;
  candidate: { strategy: Strategy; reference_close: number; stop: number | null; reason: string;
    level: number | null; pivot_date: string | null; available_session: string | null;
    rules: { name: string; passed: boolean }[] };
};
export type Paper = { id: string; ticker: string; strategy: Strategy; state: string; reason: string;
  entry: string | null; stop: string | null; target: string | null; initial_risk: string | null;
  realized_r: string | null; alternate_r: string | null; exit_session: string | null };
export type Snapshot = {
  schema_version: string; data_mode: "fixture"; label: string; session: string; status: string;
  coverage: { valid: number; total: number }; universe: string; cost_label: string; run_digest: string;
  signals: Signal[]; charts: Record<string, ChartBar[]>; paper: Paper[];
  items: { ticker: string; status: string; candidates: { strategy: Strategy; triggered: boolean; reason: string }[] }[];
  ranking: { status: string; ordered: [string, number][]; excluded: string[] };
  metrics: { closed: number; open: number; wins: number; losses: number; breakeven: number;
    win_rate: string | null; expectancy_r: string | null; profit_factor: string | null;
    cumulative_closed_r: string; drawdown_closed_r: string; ambiguous_count: number };
  strategy_metrics: Record<Strategy, { closed: number; win_rate: string | null; expectancy_r: string | null; ambiguous_count: number }>;
  limitations: string[];
};
export const strategies: Record<Strategy, { label: string; short: string; description: string }> = {
  MACD_EMA200_V1: { label: "MACD + EMA200", short: "MACD", description: "Crossover bullish di atas EMA200" },
  FRACTAL_BREAKOUT_V1: { label: "Fractal breakout", short: "Fractal", description: "Close menembus ceiling yang sudah tersedia" },
  RS_BREAKOUT_V1: { label: "Relative strength", short: "RS breakout", description: "Top 20% return 60 sesi & breakout 20 sesi" },
  PULLBACK_RECLAIM_V1: { label: "Pullback reclaim", short: "Pullback", description: "Reclaim EMA20 dalam tren naik" },
};
export const fmt = (value: number | string | null, digits = 0) => value === null ? "—" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(Number(value));
export const dateLabel = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value + "T00:00:00+07:00"));
