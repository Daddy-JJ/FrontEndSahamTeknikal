import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
  TICKER_HORIZON_DETAILS_MAP,
  QUADRANT_MAPS,
  buildQuadrantFallbackDetail,
  getDailyInsight,
  type AccumulationItem,
  type DistributionItem,
  type HorizonPeriod,
  type MarketSummary,
  type QuadrantMapDetail,
  type TickerBrokerDetail,
} from "./broker-flow.ts";
import {
  formatShortDateID,
  getWibDateString,
  type DataFreshnessMeta,
  type LiveMarketOverviewPayload,
} from "./live-broker-flow.ts";

const TICKER_PATTERN = /^[A-Z0-9]{3,8}$/;

export interface SupabaseMarketSnapshotRow {
  snapshot_date?: string;
  market_summary?: MarketSummary;
  top_accumulations?: Array<Partial<AccumulationItem>>;
  top_distributions?: Array<Partial<DistributionItem>>;
  top_brokers?: unknown[];
  sector_flows?: unknown[];
  quadrant_maps?: Record<string, QuadrantMapDetail>;
  created_at?: string;
}

export interface BrokerFlowServiceDeps {
  snapshotBundle: Record<string, unknown> | null;
  fetchLiveOverview: (
    horizon: HorizonPeriod,
    forceRefresh: boolean
  ) => Promise<LiveMarketOverviewPayload>;
  fetchOnDemandTicker: (
    ticker: string,
    forceRefresh: boolean
  ) => Promise<Record<HorizonPeriod, TickerBrokerDetail>>;
  querySupabaseTicker?: (
    ticker: string
  ) => Promise<Partial<Record<HorizonPeriod, TickerBrokerDetail>> | null>;
  querySupabaseOverview?: () => Promise<SupabaseMarketSnapshotRow | null>;
}

export function normalizeTicker(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const upper = raw.toUpperCase().trim();
  return TICKER_PATTERN.test(upper) ? upper : null;
}

export function parseHorizon(raw: string | null | undefined): HorizonPeriod {
  if (raw === "2D" || raw === "10D") return raw;
  return "5D";
}

export function pickActiveDetail(
  horizons: Partial<Record<HorizonPeriod, TickerBrokerDetail>>,
  preferred: HorizonPeriod
): TickerBrokerDetail | undefined {
  return horizons[preferred] || horizons["5D"] || horizons["2D"] || horizons["10D"];
}

function finiteOrZero(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function normalizeAccumulationItems(raw: unknown): AccumulationItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      ticker: String(item.ticker || ""),
      close: finiteOrZero(item.close),
      change_percent: finiteOrZero(item.change_percent),
      top_buyers: String(item.top_buyers || "-"),
      sum_buy: finiteOrZero(item.sum_buy),
      smart_money_net: finiteOrZero(item.smart_money_net),
    }))
    .filter((item) => item.ticker.length > 0);
}

export function normalizeDistributionItems(raw: unknown): DistributionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      ticker: String(item.ticker || ""),
      close: finiteOrZero(item.close),
      change_percent: finiteOrZero(item.change_percent),
      top_sellers: String(item.top_sellers || "-"),
      sum_sell: finiteOrZero(item.sum_sell),
      smart_money_net: finiteOrZero(item.smart_money_net),
    }))
    .filter((item) => item.ticker.length > 0);
}

async function resolveTickerRequest(
  upper: string,
  horizon: HorizonPeriod,
  preferLive: boolean,
  forceRefresh: boolean,
  deps: BrokerFlowServiceDeps
): Promise<{ status: number; body: Record<string, unknown> }> {
  // 0. Live Max MCP lookup (with 5-min TTL & refresh cooldown)
  if (preferLive || forceRefresh) {
    try {
      const liveHorizons = await deps.fetchOnDemandTicker(upper, forceRefresh);
      const activeLive = pickActiveDetail(liveHorizons, horizon);
      if (activeLive) {
        return {
          status: 200,
          body: {
            success: true,
            source: "max-mcp-live",
            data: activeLive,
            horizons: liveHorizons,
          },
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      console.warn("Live ticker fetch failed, falling back to Supabase/snapshot:", msg);
    }
  }

  // 1. Supabase cloud DB lookup (prioritized over static bundled snapshots)
  if (deps.querySupabaseTicker) {
    try {
      const dbHorizons = await deps.querySupabaseTicker(upper);
      if (dbHorizons) {
        const matched = pickActiveDetail(dbHorizons, horizon);
        if (matched) {
          return {
            status: 200,
            body: {
              success: true,
              source: "supabase",
              data: matched,
              horizons: dbHorizons,
            },
          };
        }
      }
    } catch {
      // Fall through to bundled snapshot
    }
  }

  // 2. Dynamic lookup from bundled daily snapshot
  const tickerHorizons = deps.snapshotBundle?.ticker_horizons as
    | Record<string, Partial<Record<HorizonPeriod, TickerBrokerDetail>>>
    | undefined;
  const snapshotHorizons = tickerHorizons?.[upper];
  if (snapshotHorizons) {
    const targetDetail = pickActiveDetail(snapshotHorizons, horizon);
    if (targetDetail) {
      return {
        status: 200,
        body: {
          success: true,
          source: "snapshot-fallback",
          data: targetDetail,
          horizons: snapshotHorizons,
        },
      };
    }
  }

  // 3. Static in-memory map lookup
  const staticMulti = TICKER_HORIZON_DETAILS_MAP[upper];
  if (staticMulti && Object.keys(staticMulti).length > 0) {
    const targetStatic = pickActiveDetail(staticMulti, horizon);
    if (targetStatic) {
      return {
        status: 200,
        body: {
          success: true,
          source: "snapshot-fallback",
          data: targetStatic,
          horizons: staticMulti,
        },
      };
    }
  }
  const inMemoryDetail = TICKER_DETAILS_MAP[upper];
  if (inMemoryDetail) {
    return {
      status: 200,
      body: {
        success: true,
        source: "snapshot-fallback",
        data: inMemoryDetail,
        horizons: { [horizon]: inMemoryDetail },
      },
    };
  }

  // 4. Transparent fallback from quadrant or daily insights metadata
  const fallbackDetail = buildQuadrantFallbackDetail(upper, horizon);
  if (fallbackDetail) {
    return {
      status: 200,
      body: {
        success: true,
        source: "quadrant-fallback",
        data: fallbackDetail,
        horizons: { [horizon]: fallbackDetail },
      },
    };
  }

  return {
    status: 404,
    body: {
      success: false,
      error: "TICKER_NOT_FOUND",
      message: `Data untuk ${upper} belum ditemukan.`,
      can_on_demand: true,
    },
  };
}

export async function resolveBrokerFlowRequest(
  params: {
    rawTicker?: string | null;
    quadrant?: string | null;
    rawHorizon?: string | null;
    onDemand?: boolean;
    preferLive?: boolean;
    forceRefresh?: boolean;
  },
  deps: BrokerFlowServiceDeps
): Promise<{ status: number; body: Record<string, unknown> }> {
  const horizon = parseHorizon(params.rawHorizon);
  const preferLive = params.preferLive !== false;
  const forceRefresh = Boolean(params.forceRefresh || params.onDemand);

  if (params.rawTicker !== null && params.rawTicker !== undefined && params.rawTicker !== "") {
    const upper = normalizeTicker(params.rawTicker);
    if (!upper) {
      return {
        status: 400,
        body: {
          success: false,
          error: "INVALID_TICKER",
          message: `Format ticker '${String(params.rawTicker)}' tidak valid untuk IDX.`,
        },
      };
    }
    return resolveTickerRequest(upper, horizon, preferLive, forceRefresh, deps);
  }

  if (params.quadrant) {
    if (preferLive) {
      try {
        const liveOverview = await deps.fetchLiveOverview(horizon, forceRefresh);
        if (liveOverview.quadrant_maps[params.quadrant]) {
          return {
            status: 200,
            body: {
              success: true,
              source: "max-mcp-live",
              data: liveOverview.quadrant_maps[params.quadrant],
            },
          };
        }
      } catch {
        // Fallback below
      }
    }
    const map = QUADRANT_MAPS[params.quadrant];
    if (map) {
      return {
        status: 200,
        body: { success: true, source: "snapshot-fallback", data: map },
      };
    }
    return {
      status: 404,
      body: {
        error: "QUADRANT_NOT_FOUND",
        message: `Kuadran ${params.quadrant} tidak ditemukan.`,
      },
    };
  }

  // 0. Live Max MCP overview
  if (preferLive) {
    try {
      const overview = await deps.fetchLiveOverview(horizon, forceRefresh);
      return {
        status: 200,
        body: {
          success: true,
          source: "max-mcp-live",
          data: {
            snapshot_date: overview.snapshot_date,
            horizon: overview.horizon,
            data_freshness: overview.data_freshness,
            market_summary: overview.market_summary,
            daily_insight: overview.daily_insight,
            top_accumulations: overview.top_accumulations,
            top_distributions: overview.top_distributions,
            quadrant_maps: overview.quadrant_maps,
            top_brokers: [],
            sector_flows: [],
          },
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Koneksi Max MCP bermasalah";
      console.warn("Live market overview failed, trying Supabase/snapshot:", msg);
    }
  }

  const wib = getWibDateString();

  // 1. Supabase broker_flow_snapshots fallback
  if (deps.querySupabaseOverview) {
    try {
      const dbSnap = await deps.querySupabaseOverview();
      if (dbSnap?.snapshot_date && dbSnap.market_summary && dbSnap.market_summary.total_classified > 0) {
        const dbAcc = normalizeAccumulationItems(dbSnap.top_accumulations);
        const dbDist = normalizeDistributionItems(dbSnap.top_distributions);
        const dbQuadrants =
          dbSnap.quadrant_maps && Object.keys(dbSnap.quadrant_maps).length > 0
            ? dbSnap.quadrant_maps
            : QUADRANT_MAPS;
        const dbFreshness: DataFreshnessMeta = {
          latest_date: dbSnap.snapshot_date,
          today_wib: wib.dateStr,
          is_today_published: dbSnap.snapshot_date >= wib.dateStr,
          source: "supabase",
          synced_at: String(dbSnap.created_at || new Date().toISOString()),
          message: `Menampilkan snapshot Supabase (${formatShortDateID(dbSnap.snapshot_date)}).`,
        };
        return {
          status: 200,
          body: {
            success: true,
            source: "supabase",
            data: {
              snapshot_date: dbSnap.snapshot_date,
              horizon,
              data_freshness: dbFreshness,
              market_summary: dbSnap.market_summary,
              daily_insight: getDailyInsight(horizon),
              top_accumulations: dbAcc.length > 0 ? dbAcc : DEFAULT_TOP_ACCUMULATIONS,
              top_distributions: dbDist.length > 0 ? dbDist : DEFAULT_TOP_DISTRIBUTIONS,
              top_brokers: Array.isArray(dbSnap.top_brokers) ? dbSnap.top_brokers : [],
              sector_flows: Array.isArray(dbSnap.sector_flows) ? dbSnap.sector_flows : [],
              quadrant_maps: dbQuadrants,
            },
          },
        };
      }
    } catch {
      // Fall through to bundled snapshot
    }
  }

  // 2. Bundled static snapshot fallback
  const bundle = deps.snapshotBundle;
  const fallbackDate = String(bundle?.snapshot_date || DEFAULT_MARKET_SUMMARY.date);
  const fallbackFreshness: DataFreshnessMeta = {
    latest_date: fallbackDate,
    today_wib: wib.dateStr,
    is_today_published: fallbackDate >= wib.dateStr,
    source: "snapshot-fallback",
    synced_at: String(bundle?.synced_at || new Date().toISOString()),
    message: `Menampilkan snapshot cadangan (${formatShortDateID(fallbackDate)}). Koneksi feed live sedang tidak tersedia.`,
  };

  const marketSummary = (bundle?.market_summary as MarketSummary | undefined) || DEFAULT_MARKET_SUMMARY;
  const normalizedAcc = normalizeAccumulationItems(bundle?.top_accumulations);
  const normalizedDist = normalizeDistributionItems(bundle?.top_distributions);

  return {
    status: 200,
    body: {
      success: true,
      source: "snapshot-fallback",
      data: {
        snapshot_date: fallbackDate,
        horizon,
        data_freshness: fallbackFreshness,
        market_summary: marketSummary,
        daily_insight: getDailyInsight(horizon),
        top_accumulations: normalizedAcc.length > 0 ? normalizedAcc : DEFAULT_TOP_ACCUMULATIONS,
        top_distributions: normalizedDist.length > 0 ? normalizedDist : DEFAULT_TOP_DISTRIBUTIONS,
        top_brokers: DEFAULT_TOP_BROKERS,
        sector_flows: DEFAULT_SECTOR_FLOWS,
        quadrant_maps: QUADRANT_MAPS,
        reference_snapshot_date: DEFAULT_MARKET_SUMMARY.date,
      },
    },
  };
}
