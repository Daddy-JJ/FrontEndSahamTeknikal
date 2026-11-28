import {
  classifyStockRegime,
  computeADX,
  computeEMA,
  computeFibonacciLevels,
  computeFractalChannels,
  computeMACD,
  computePivotPoints,
  computeRSI,
  computeSupertrend,
  type ADXPoint,
  type FibonacciLevels,
  type OHLCVBar,
} from "@/lib/technical-indicators";
import { callMaxTradeMcp } from "@/lib/mcp-broker-flow";
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";
import {
  SIGNAL_DISPLAY_META,
  type DashboardPayload,
  type QuadrantId,
  type QuadrantStockItem,
  type ScreeningSignalRow,
  type SectorSnapshotPayload,
  type SmartMoneyFactors,
  type SmartMoneyLabel,
  type WinRateMetricCell,
  type WinRatePayload,
  type WinRateStrategyRow,
} from "@/lib/screener-types";

function computeFreshnessDays(sessionDate: string): number {
  const ts = Date.parse(`${sessionDate}T00:00:00Z`);
  if (!Number.isFinite(ts)) return 0;
  const nowWib = Date.now() + 7 * 3600 * 1000;
  return Math.max(0, Math.floor((nowWib - ts) / 86_400_000));
}

export async function getLatestDashboard(): Promise<DashboardPayload | null> {
  if (!publicSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_market_dashboard")
    .select(
      "session_date, ihsg_close, ihsg_change, ihsg_change_pct, market_regime, breadth, ihsg_chart_data, contributors, sector_heatmap, quadrant_summary"
    )
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const payload = data as DashboardPayload;
  payload.freshness_age_days = computeFreshnessDays(payload.session_date);
  return payload;
}

export async function getQuadrantStocks(quadrant?: string | null): Promise<{
  session_date: string;
  counts: Record<QuadrantId, number>;
  stocks_by_quadrant: Partial<Record<QuadrantId, QuadrantStockItem[]>>;
} | null> {
  const dash = await getLatestDashboard();
  if (!dash) return null;

  const qSummary = dash.quadrant_summary;
  if (quadrant && quadrant in qSummary.stocks_by_quadrant) {
    const qKey = quadrant as QuadrantId;
    return {
      session_date: dash.session_date,
      counts: qSummary.counts,
      stocks_by_quadrant: {
        [qKey]: qSummary.stocks_by_quadrant[qKey] ?? [],
      },
    };
  }

  return {
    session_date: dash.session_date,
    counts: qSummary.counts,
    stocks_by_quadrant: qSummary.stocks_by_quadrant,
  };
}

export async function getSectorSnapshot(
  sectorSlug: string
): Promise<{
  snapshot: SectorSnapshotPayload | null;
  allSectors: { sector: string; slug: string }[];
}> {
  if (!publicSupabaseConfig()) return { snapshot: null, allSectors: [] };
  const supabase = await createClient();

  const normalizedSlug = sectorSlug.toLowerCase().trim();
  const { data: sectorRow } = await supabase
    .from("daily_sector_snapshots")
    .select("session_date, sector_slug, sector_name, summary, chart_series, stocks")
    .eq("sector_slug", normalizedSlug)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: dashRow } = await supabase
    .from("daily_market_dashboard")
    .select("sector_heatmap")
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const allSectors = Array.isArray(dashRow?.sector_heatmap)
    ? (dashRow.sector_heatmap as { sector: string; slug: string }[]).map((s) => ({
        sector: s.sector,
        slug: s.slug,
      }))
    : [];

  return {
    snapshot: (sectorRow as SectorSnapshotPayload | null) ?? null,
    allSectors,
  };
}

export interface SignalQueryFilters {
  date?: string; // "latest" | "all" | YYYY-MM-DD
  signalType?: string;
  minScore?: number;
  regime?: string;
  sectorSlug?: string;
  search?: string;
  limit?: number;
}

export async function querySignals(filters: SignalQueryFilters = {}): Promise<{
  latest_date: string | null;
  available_dates: string[];
  rows: ScreeningSignalRow[];
  total_count: number;
}> {
  if (!publicSupabaseConfig()) {
    return { latest_date: null, available_dates: [], rows: [], total_count: 0 };
  }
  const supabase = await createClient();

  const { data: dateRows } = await supabase
    .from("daily_screening_signals")
    .select("signal_date")
    .order("signal_date", { ascending: false })
    .limit(400);

  const uniqueDates = Array.from(
    new Set((dateRows ?? []).map((r) => String(r.signal_date)))
  ).slice(0, 60);
  const latestDate = uniqueDates[0] ?? null;

  let q = supabase
    .from("daily_screening_signals")
    .select("*", { count: "exact" })
    .in("signal_type", STRATEGY_ORDER)
    .order("signal_date", { ascending: false })
    .order("smart_money_score", { ascending: false })
    .order("rr_tp1", { ascending: false, nullsFirst: false });

  const requestedDate = filters.date || "latest";
  if (requestedDate === "latest" && latestDate) {
    q = q.eq("signal_date", latestDate);
  } else if (requestedDate !== "all" && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    q = q.eq("signal_date", requestedDate);
  }

  if (filters.signalType && filters.signalType !== "ALL") {
    q = q.eq("signal_type", filters.signalType.toUpperCase());
  }
  if (typeof filters.minScore === "number" && filters.minScore > 0) {
    q = q.gte("smart_money_score", filters.minScore);
  }
  if (filters.regime && filters.regime !== "ALL") {
    q = q.eq("regime", filters.regime.toUpperCase());
  }
  if (filters.sectorSlug && filters.sectorSlug !== "ALL") {
    q = q.eq("sector_slug", filters.sectorSlug.toLowerCase());
  }
  if (filters.search && filters.search.trim()) {
    const safeTerm = filters.search.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (safeTerm) {
      q = q.ilike("ticker", `%${safeTerm}%`);
    }
  }

  const maxLimit = Math.min(filters.limit ?? 300, 600);
  const { data, count } = await q.limit(maxLimit);

  return {
    latest_date: latestDate,
    available_dates: uniqueDates,
    rows: (data as ScreeningSignalRow[] | null) ?? [],
    total_count: count ?? (data?.length ?? 0),
  };
}

function buildMetricCell(statuses: string[]): WinRateMetricCell {
  let wins = 0;
  let losses = 0;
  let pending = 0;
  let excluded = 0;

  for (const s of statuses) {
    if (s === "win") wins += 1;
    else if (s === "loss") losses += 1;
    else if (s === "pending") pending += 1;
    else excluded += 1; // "excluded" | "ambiguous"
  }

  const evaluated = wins + losses;
  return {
    rate_pct: evaluated > 0 ? Math.round((wins / evaluated) * 10000) / 100 : null,
    wins,
    evaluated,
    pending,
    excluded,
  };
}

function buildStrategyRow(signalType: string, items: ScreeningSignalRow[]): WinRateStrategyRow {
  const meta = SIGNAL_DISPLAY_META[signalType] ?? {
    label: signalType.replace(/_/g, " "),
    hint: "Aturan skrining teknikal & smart money",
  };
  return {
    signal_type: signalType,
    display_name: meta.label,
    description: meta.hint,
    total_occurrences: items.length,
    tp1_before_sl: buildMetricCell(items.map((x) => x.eval_tp1_status)),
    tp2_before_sl: buildMetricCell(items.map((x) => x.eval_tp2_status)),
    up_no_sl_5d: buildMetricCell(items.map((x) => x.eval_up_5d_status)),
    up_no_sl_10d: buildMetricCell(items.map((x) => x.eval_up_10d_status)),
    up_no_sl_latest: buildMetricCell(items.map((x) => x.eval_up_latest_status)),
  };
}

const STRATEGY_ORDER = [
  "FRACTAL_BREAKOUT",
  "MACD_EMA200",
  "G_ACC",
];

export async function computeWinRateStats(params: {
  year?: string;
  minSmartMoney?: number;
}): Promise<WinRatePayload> {
  const year = params.year || "2026";
  const minSmartMoney = Math.max(0, Math.min(3, params.minSmartMoney ?? 0));

  if (!publicSupabaseConfig()) {
    return {
      year,
      min_smart_money: minSmartMoney,
      archive_days: 0,
      date_from: null,
      date_to: null,
      evaluated_until: null,
      rows: [],
      overall_row: null,
    };
  }

  const supabase = await createClient();
  const allRows: ScreeningSignalRow[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    let q = supabase
      .from("daily_screening_signals")
      .select(
        "signal_date, ticker, signal_type, smart_money_score, eval_tp1_status, eval_tp2_status, eval_up_5d_status, eval_up_10d_status, eval_up_latest_status, evaluated_until_date"
      )
      .in("signal_type", STRATEGY_ORDER)
      .order("signal_date", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (year !== "ALL" && /^\d{4}$/.test(year)) {
      q = q.gte("signal_date", `${year}-01-01`).lte("signal_date", `${year}-12-31`);
    }
    if (minSmartMoney > 0) {
      q = q.gte("smart_money_score", minSmartMoney);
    }

    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    allRows.push(...(data as ScreeningSignalRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  const uniqueDates = new Set<string>();
  let evalUntil: string | null = null;
  const byType = new Map<string, ScreeningSignalRow[]>();
  const dedupByDateTicker = new Map<string, ScreeningSignalRow>();

  for (const row of allRows) {
    uniqueDates.add(row.signal_date);
    if (row.evaluated_until_date && (!evalUntil || row.evaluated_until_date > evalUntil)) {
      evalUntil = row.evaluated_until_date;
    }
    const list = byType.get(row.signal_type) ?? [];
    list.push(row);
    byType.set(row.signal_type, list);

    const key = `${row.signal_date}__${row.ticker}`;
    const existing = dedupByDateTicker.get(key);
    if (!existing || row.smart_money_score > existing.smart_money_score) {
      dedupByDateTicker.set(key, row);
    }
  }

  const sortedTypes = Array.from(byType.keys()).sort((a, b) => {
    const ia = STRATEGY_ORDER.indexOf(a);
    const ib = STRATEGY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

  const rows = sortedTypes.map((st) => buildStrategyRow(st, byType.get(st) ?? []));
  const sortedDates = Array.from(uniqueDates).sort();
  const dedupItems = Array.from(dedupByDateTicker.values());
  const overallRow =
    dedupItems.length > 0
      ? {
          ...buildStrategyRow("ALL", dedupItems),
          display_name: "SEMUA SINYAL (UNIK PER SAHAM/HARI)",
          description: "Setiap pasangan saham & tanggal dihitung satu kali sesuai metodologi arsip.",
        }
      : null;

  return {
    year,
    min_smart_money: minSmartMoney,
    archive_days: sortedDates.length,
    date_from: sortedDates[0] ?? null,
    date_to: sortedDates[sortedDates.length - 1] ?? null,
    evaluated_until: evalUntil,
    rows,
    overall_row: overallRow,
  };
}

export interface TickerDetailPayload {
  ticker: string;
  company_name: string | null;
  sector: string;
  sector_slug: string;
  market_cap: number | null;
  free_float_pct: number | null;
  latest_date: string;
  close: number;
  change: number;
  change_pct: number;
  regime: "MARKUP" | "CONSOLIDATING" | "MARKDOWN";
  regime_action: "BUY" | "TUNGGU BREAKOUT" | "SELL / AVOID";
  bars: OHLCVBar[];
  ema21: (number | null)[];
  ema50: (number | null)[];
  ema200: (number | null)[];
  rsi14: (number | null)[];
  adx14: ADXPoint[];
  supertrend: ReturnType<typeof computeSupertrend>;
  macd: ReturnType<typeof computeMACD>;
  fractals: ReturnType<typeof computeFractalChannels>;
  pivots: ReturnType<typeof computePivotPoints>;
  fibonacci: FibonacciLevels | null;
  smart_money: {
    score: number;
    label: SmartMoneyLabel;
    factors: SmartMoneyFactors;
    bandar_avg_cost: number | null;
    foreign_net_5d: number | null;
    foreign_net_1d: number | null;
    broksum_label: string;
    confidence_pct: number;
    top_buyers: { broker: string; buyValue: number; avgPrice?: number }[];
    top_sellers: { broker: string; sellValue: number; avgPrice?: number }[];
  };
  horizons: {
    horizon_2d: Record<string, unknown> | null;
    horizon_5d: Record<string, unknown> | null;
    horizon_10d: Record<string, unknown> | null;
  };
  signals: ScreeningSignalRow[];
}

export async function getTickerDetail(tickerRaw: string): Promise<TickerDetailPayload | null> {
  const ticker = tickerRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!ticker || ticker.length < 2) return null;

  const supabase = publicSupabaseConfig() ? await createClient() : null;

  const [masterRes, eodRes, signalsRes, horizonRes] = await Promise.all([
    supabase
      ? supabase.from("idx_ticker_master").select("*").eq("ticker", ticker).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      ? supabase.from("idx_eod_bars_cache").select("latest_date, bars_json").eq("ticker", ticker).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      ? supabase
          .from("daily_screening_signals")
          .select("*")
          .eq("ticker", ticker)
          .order("signal_date", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: null }),
    supabase
      ? supabase
          .from("broker_flow_ticker_horizons")
          .select("horizon_2d, horizon_5d, horizon_10d")
          .eq("ticker", ticker)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let bars: OHLCVBar[] = [];
  let nbsaLast = 0;

  if (eodRes.data && Array.isArray(eodRes.data.bars_json)) {
    const rawArr = eodRes.data.bars_json as unknown[][];
    bars = rawArr
      .map((row) => ({
        time: String(row[0]),
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
        volume: Number(row[5]),
      }))
      .filter((b) => Number.isFinite(b.close) && b.close > 0);
    const lastRow = rawArr[rawArr.length - 1];
    nbsaLast = lastRow && lastRow.length >= 8 ? Number(lastRow[7] ?? 0) : 0;
  } else {
    try {
      const mcpEod = (await callMaxTradeMcp("get_eod_history", { ticker, limit: 700 }, 12_000)) as {
        records?: { date: string; open: number; high: number; low: number; close: number; volume: number; nbsa?: number }[];
      };
      const recs = (mcpEod?.records ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
      bars = recs.map((r) => ({
        time: r.date,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume),
      }));
      if (recs.length > 0) nbsaLast = Number(recs[recs.length - 1].nbsa ?? 0);
    } catch {
      return null;
    }
  }

  if (bars.length < 5) return null;

  const latestDate = bars[bars.length - 1].time;
  const lastBar = bars[bars.length - 1];
  const prevBar = bars[bars.length - 2] ?? lastBar;
  const change = Math.round((lastBar.close - prevBar.close) * 100) / 100;
  const changePct = prevBar.close > 0 ? Math.round(((change / prevBar.close) * 100) * 100) / 100 : 0;

  // Live MCP smart money signal & bandarmology factors (best-effort 10s timeout)
  const date5dAgo = bars[Math.max(0, bars.length - 5)].time;
  const [mcpSignal, mcpFactors] = await Promise.all([
    callMaxTradeMcp(
      "get_broksum_signal",
      { ticker, startDate: latestDate, endDate: latestDate },
      10_000
    ).catch(() => null) as Promise<Record<string, unknown> | null>,
    callMaxTradeMcp(
      "get_bandarmology_factors",
      { ticker, startDate: date5dAgo, endDate: latestDate },
      10_000
    ).catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);

  const closes = bars.map((b) => b.close);
  const ema21 = computeEMA(closes, 21);
  const ema50 = computeEMA(closes, 50);
  const ema200 = computeEMA(closes, 200);
  const rsi14 = computeRSI(closes, 14);
  const adx14 = computeADX(bars, 14);
  const supertrend = computeSupertrend(bars, 10, 3.0);
  const macd = computeMACD(bars, 12, 26, 9);
  const fractals = computeFractalChannels(bars);
  const pivots = computePivotPoints(prevBar, latestDate);
  const fibonacci = computeFibonacciLevels(bars, 90);

  // Extract Smart Money 3-Factor details (preferring live MCP -> latest signal DB -> NBSA fallback)
  const latestSignal = ((signalsRes.data as ScreeningSignalRow[] | null) ?? [])[0] ?? null;
  const summ = (mcpSignal?.summary as Record<string, unknown> | undefined) ?? {};
  const conf = Number(
    mcpSignal?.confidence ??
      latestSignal?.smart_money_factors?.broker_accumulation?.confidence_pct ??
      0
  );
  const brokLbl = String(
    mcpSignal?.label ??
      latestSignal?.smart_money_factors?.broker_accumulation?.label ??
      "MIXED_NEUTRAL"
  ).toUpperCase();
  const fNet1d = Number(summ.foreignNetValue ?? nbsaLast ?? 0);

  const dailyFactors = Array.isArray(mcpFactors?.records)
    ? (mcpFactors.records as Record<string, unknown>[])
    : [];
  const latestFac =
    (mcpFactors?.latest as Record<string, unknown> | undefined) ??
    dailyFactors[dailyFactors.length - 1] ??
    null;
  const fNet5dRaw = dailyFactors
    .slice(-5)
    .reduce((acc, r) => acc + Number(r.netForeignValue ?? r.foreignNet ?? 0), 0);
  const fNet5d = dailyFactors.length > 0 ? fNet5dRaw : fNet1d;

  const topBuyers = Array.isArray(latestFac?.topNetBuyers)
    ? (
        latestFac.topNetBuyers as {
          code?: string;
          brokerCode?: string;
          netValue?: number;
          buyValue?: number;
          buyAvgPrice?: number;
        }[]
      ).map((b) => ({
        broker: String(b.code ?? b.brokerCode ?? "-"),
        buyValue: Number(b.netValue ?? b.buyValue ?? 0),
        avgPrice: b.buyAvgPrice ? Number(b.buyAvgPrice) : undefined,
      }))
    : [];
  const topSellers = Array.isArray(latestFac?.topNetSellers)
    ? (
        latestFac.topNetSellers as {
          code?: string;
          brokerCode?: string;
          netValueAbs?: number;
          sellValue?: number;
          sellAvgPrice?: number;
        }[]
      ).map((b) => ({
        broker: String(b.code ?? b.brokerCode ?? "-"),
        sellValue: Math.abs(Number(b.netValueAbs ?? b.sellValue ?? 0)),
        avgPrice: b.sellAvgPrice ? Number(b.sellAvgPrice) : undefined,
      }))
    : [];

  const totBuyV = topBuyers.reduce((s, b) => s + b.buyValue, 0);
  const weightedBuyPrice =
    totBuyV > 0 && topBuyers.every((b) => b.avgPrice && b.avgPrice > 0)
      ? Math.round(
          topBuyers.reduce((s, b) => s + b.buyValue * (b.avgPrice ?? 0), 0) / totBuyV
        )
      : null;

  const bVal = Number(latestFac?.bandarValue ?? latestSignal?.smart_money_factors?.bandarmology_alignment?.bandar_value ?? 0);
  const bMa10 = Number(latestFac?.bandarValueMa10 ?? 0);
  const sNet = Number(latestFac?.smartMoneyNet ?? fNet1d);

  const passBroker = conf >= 60 && brokLbl.includes("ACCUMULATION");
  const passForeign = fNet1d > 0;
  const passAlign =
    (changePct > 0 && (sNet > 0 || bVal > 0)) ||
    (bMa10 !== 0 && bVal > 0 && bVal >= bMa10);

  const score = (passBroker ? 1 : 0) + (passForeign ? 1 : 0) + (passAlign ? 1 : 0);
  const labelMap: Record<number, SmartMoneyLabel> = {
    3: "STRONG CONFIRMATION",
    2: "CONFIRMED",
    1: "PARTIAL",
    0: "NOT CONFIRMED",
  };

  const accDetected = brokLbl.includes("ACCUMULATION") || sNet > 0;
  const distDetected = brokLbl.includes("DISTRIBUTION") || sNet < 0;
  const regimeInfo = classifyStockRegime({
    close: lastBar.close,
    ema21: ema21[ema21.length - 1],
    ema50: ema50[ema50.length - 1],
    ema21Prev5: ema21.length > 6 ? ema21[ema21.length - 6] : null,
    accumulationDetected: accDetected,
    distributionDetected: distDetected,
  });

  // Slice rendered chart series cleanly up to 360 bars while having used up to 960 bars for EMA200 warmup
  const sliceOffset = Math.max(0, bars.length - 360);
  const stMap = new Map(supertrend.map((s) => [s.time, s]));
  const macdMap = new Map(macd.map((m) => [m.time, m]));

  const slicedBars = bars.slice(sliceOffset);

  const masterCompany = String(
    masterRes.data?.company_name ?? masterRes.data?.name ?? masterRes.data?.emiten_name ?? ""
  ).trim();

  return {
    ticker,
    company_name: masterCompany && masterCompany !== "-" ? masterCompany : null,
    sector: String(masterRes.data?.sector ?? latestSignal?.sector ?? "Other"),
    sector_slug: String(masterRes.data?.sector_slug ?? latestSignal?.sector_slug ?? "other"),
    market_cap: masterRes.data?.market_cap ? Number(masterRes.data.market_cap) : null,
    free_float_pct: masterRes.data?.free_float_pct ? Number(masterRes.data.free_float_pct) : null,
    latest_date: latestDate,
    close: lastBar.close,
    change,
    change_pct: changePct,
    regime: regimeInfo.regime,
    regime_action: regimeInfo.action,
    bars: slicedBars,
    ema21: ema21.slice(sliceOffset),
    ema50: ema50.slice(sliceOffset),
    ema200: ema200.slice(sliceOffset),
    rsi14: rsi14.slice(sliceOffset),
    adx14: adx14.slice(sliceOffset),
    supertrend: slicedBars.map((b) => stMap.get(b.time)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    macd: slicedBars.map((b) => macdMap.get(b.time)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    fractals: fractals.slice(sliceOffset),
    pivots,
    fibonacci,
    smart_money: {
      score: mcpSignal ? score : latestSignal?.smart_money_score ?? score,
      label: mcpSignal ? labelMap[score] : latestSignal?.smart_money_label ?? labelMap[score],
      factors: {
        broker_accumulation: {
          passed: passBroker,
          confidence_pct: Math.round(conf * 10) / 10,
          label: brokLbl,
          rule: "Confidence >= 60% dan dominan akumulasi",
        },
        foreign_inflow: {
          passed: passForeign,
          foreign_net: Math.round(fNet1d),
          rule: "Net foreign > 0",
        },
        bandarmology_alignment: {
          passed: passAlign,
          price_change_pct: changePct,
          smart_money_net: Math.round(sNet),
          bandar_value: Math.round(bVal),
          rule: "Trend broker searah kenaikan harga / di atas MA10 bandar",
        },
      },
      bandar_avg_cost: weightedBuyPrice,
      foreign_net_5d: Math.round(fNet5d),
      foreign_net_1d: Math.round(fNet1d),
      broksum_label: brokLbl,
      confidence_pct: Math.round(conf * 10) / 10,
      top_buyers: topBuyers,
      top_sellers: topSellers,
    },
    horizons: {
      horizon_2d: (horizonRes.data?.horizon_2d as Record<string, unknown> | null) ?? null,
      horizon_5d: (horizonRes.data?.horizon_5d as Record<string, unknown> | null) ?? null,
      horizon_10d: (horizonRes.data?.horizon_10d as Record<string, unknown> | null) ?? null,
    },
    signals: ((signalsRes.data as ScreeningSignalRow[] | null) ?? []),
  };
}
