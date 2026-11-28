export type MarketRegime = "BULL" | "NEUTRAL" | "BEAR";
export type StockRegime = "MARKUP" | "CONSOLIDATING" | "MARKDOWN";
export type StockRegimeAction = "BUY" | "TUNGGU BREAKOUT" | "SELL / AVOID";
export type SmartMoneyLabel =
  | "STRONG CONFIRMATION"
  | "CONFIRMED"
  | "PARTIAL"
  | "NOT CONFIRMED";

export type SignalEvalStatus = "win" | "loss" | "pending" | "ambiguous" | "excluded";

export type QuadrantId =
  | "markup_akumulasi"
  | "markup_distribusi"
  | "markdown_akumulasi"
  | "markdown_distribusi";

export interface IhsgChartBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema21: number;
  ema50: number;
  ema200: number;
  supertrend: number;
  supertrend_dir: number;
}

export interface PivotLevelSet {
  date?: string;
  p: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

export interface MarketBreadth {
  gainers: number;
  losers: number;
  unchanged: number;
  total_tickers: number;
  total_volume: number;
  total_turnover: number;
  ad_ratio: number;
  smart_money_net: number;
  foreign_net: number;
}

export interface IndexContributorItem {
  ticker: string;
  sector: string;
  close: number;
  change_pct: number;
  trade_value: number;
  market_cap: number;
  free_float_pct: number | null;
  weight_pct: number;
  index_points: number;
  nbsa: number;
}

export interface SectorHeatmapItem {
  sector: string;
  slug: string;
  stocks_count: number;
  gainers: number;
  losers: number;
  unchanged: number;
  equal_change_pct: number;
  weighted_change_pct: number;
  total_turnover: number;
  total_market_cap: number;
  smart_money_net: number;
  foreign_net: number;
  top_gainer: { ticker: string; change_pct: number; close: number };
  top_loser: { ticker: string; change_pct: number; close: number };
}

export interface QuadrantStockItem {
  ticker: string;
  sector: string;
  sector_slug: string;
  close: number;
  change_percent: number;
  turnover: number;
  smart_money_net: number;
  foreign_net: number;
  bandar_value: number | null;
  bandar_cost: number | null;
  regime: StockRegime;
  regime_action: StockRegimeAction;
  smart_money_score: number;
  smart_money_label: SmartMoneyLabel;
  active_signals: string[];
}

export interface DashboardPayload {
  session_date: string;
  ihsg_close: number;
  ihsg_change: number;
  ihsg_change_pct: number;
  market_regime: MarketRegime;
  breadth: MarketBreadth;
  ihsg_chart_data: {
    pivots: PivotLevelSet | null;
    bars: IhsgChartBar[];
  };
  contributors: {
    gainers: IndexContributorItem[];
    losers: IndexContributorItem[];
    methodology: string;
    constituents_weighted?: number;
  };
  sector_heatmap: SectorHeatmapItem[];
  quadrant_summary: {
    counts: Record<QuadrantId, number>;
    stocks_by_quadrant: Record<QuadrantId, QuadrantStockItem[]>;
  };
  freshness_age_days?: number;
}

export interface SectorChartPoint {
  time: string;
  close: number;
  change_pct: number;
  volume: number;
  ema21: number;
  ema50: number;
}

export interface SectorStockRow {
  ticker: string;
  sector: string;
  sector_slug: string;
  close: number;
  change_pct: number;
  turnover: number;
  market_cap: number | null;
  free_float_pct: number | null;
  smart_money_net: number;
  foreign_net: number;
  quadrant: string;
  regime: StockRegime;
  regime_action: StockRegimeAction;
  smart_money_score: number;
  smart_money_label: SmartMoneyLabel;
  active_signals: string[];
}

export interface SectorSnapshotPayload {
  session_date: string;
  sector_slug: string;
  sector_name: string;
  summary: SectorHeatmapItem;
  chart_series: SectorChartPoint[];
  stocks: SectorStockRow[];
}

export interface SmartMoneyFactorDetail {
  passed: boolean;
  confidence_pct?: number;
  label?: string;
  foreign_net?: number;
  price_change_pct?: number;
  smart_money_net?: number;
  bandar_value?: number;
  rule: string;
}

export interface SmartMoneyFactors {
  broker_accumulation: SmartMoneyFactorDetail;
  foreign_inflow: SmartMoneyFactorDetail;
  bandarmology_alignment: SmartMoneyFactorDetail;
}

export interface ScreeningSignalRow {
  id: number;
  signal_date: string;
  ticker: string;
  sector: string | null;
  sector_slug: string | null;
  signal_type: string;
  signal_source: string;
  close_price: number;
  change_pct: number | null;
  entry_price: number;
  stop_loss: number | null;
  tp1: number | null;
  tp2: number | null;
  rr_tp1: number | null;
  rr_tp2: number | null;
  regime: StockRegime;
  regime_action: StockRegimeAction;
  smart_money_score: number;
  smart_money_label: SmartMoneyLabel;
  smart_money_factors: SmartMoneyFactors;
  rule_checklist: Record<string, unknown>;
  notes: string | null;
  eval_tp1_status: SignalEvalStatus;
  eval_tp2_status: SignalEvalStatus;
  eval_up_5d_status: SignalEvalStatus;
  eval_up_10d_status: SignalEvalStatus;
  eval_up_latest_status: SignalEvalStatus;
  evaluated_until_date: string | null;
}

export interface WinRateMetricCell {
  rate_pct: number | null;
  wins: number;
  evaluated: number;
  pending: number;
  excluded: number;
}

export interface WinRateStrategyRow {
  signal_type: string;
  display_name: string;
  description: string;
  total_occurrences: number;
  tp1_before_sl: WinRateMetricCell;
  tp2_before_sl: WinRateMetricCell;
  up_no_sl_5d: WinRateMetricCell;
  up_no_sl_10d: WinRateMetricCell;
  up_no_sl_latest: WinRateMetricCell;
}

export interface WinRatePayload {
  year: string;
  min_smart_money: number;
  archive_days: number;
  date_from: string | null;
  date_to: string | null;
  evaluated_until: string | null;
  rows: WinRateStrategyRow[];
  overall_row: WinRateStrategyRow | null;
}

export const SIGNAL_DISPLAY_META: Record<string, { label: string; hint: string }> = {
  FRACTAL_BREAKOUT: {
    label: "FRACTAL BREAKOUT",
    hint: "Penembusan close melewati fractal ceiling 5-bar konfirmasi tanpa lookahead (SL = fractal floor).",
  },
  MACD_EMA200: {
    label: "MACD & MA 200",
    hint: "Close > EMA200 dan histogram MACD(12,26,9) berbalik positif (SL = pivot low terakhir).",
  },
  G_ACC: {
    label: "G ACC",
    hint: "Akumulasi bandar & smart money terdeteksi saat harga masih di zona bawah/modal bandar.",
  },
};

export const QUADRANT_LABELS: Record<
  QuadrantId,
  { title: string; subtitle: string; badge: string }
> = {
  markup_akumulasi: {
    title: "MARKUP + AKUMULASI",
    subtitle: "Harga menguat dengan dukungan arus beli bandar/asing",
    badge: "PRIORITAS BUY",
  },
  markup_distribusi: {
    title: "MARKUP + DISTRIBUSI",
    subtitle: "Harga menguat namun aliran dana mulai profit-taking",
    badge: "WASPADA REVERSAL",
  },
  markdown_akumulasi: {
    title: "MARKDOWN + AKUMULASI",
    subtitle: "Harga tertekan di bawah sambil diakumulasi bertahap (bottom fishing)",
    badge: "AKUMULASI DINI",
  },
  markdown_distribusi: {
    title: "MARKDOWN + DISTRIBUSI",
    subtitle: "Harga melemah disertai arus distribusi bersih",
    badge: "HINDARI / SELL",
  },
};
