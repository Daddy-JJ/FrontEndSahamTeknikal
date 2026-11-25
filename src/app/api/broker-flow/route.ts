import { NextResponse, type NextRequest } from "next/server";
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
  type HorizonPeriod,
  type TickerBrokerDetail,
} from "@/lib/broker-flow";
import {
  fetchLiveMarketOverview,
  fetchOnDemandTickerHorizons,
} from "@/lib/mcp-broker-flow";
import {
  formatShortDateID,
  getWibDateString,
  type DataFreshnessMeta,
} from "@/lib/live-broker-flow";
import snapshotData from "@/data/broker_flow_snapshot_latest.json";
import { publicSupabaseConfig, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseHorizon(raw: string | null): HorizonPeriod {
  if (raw === "2D" || raw === "10D") return raw;
  return "5D";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ticker = searchParams.get("ticker");
  const quadrant = searchParams.get("quadrant");
  const horizon = parseHorizon(searchParams.get("horizon"));
  const onDemand = searchParams.get("on_demand") === "true";
  const preferLive = searchParams.get("live") !== "false";
  const forceRefresh = searchParams.get("refresh") === "true" || onDemand;

  if (ticker) {
    const upper = ticker.toUpperCase().trim();

    // 0. Live Max MCP lookup (with 5-min TTL cache unless forceRefresh=true)
    if (preferLive || onDemand) {
      try {
        const liveHorizons = await fetchOnDemandTickerHorizons(upper, forceRefresh);
        TICKER_HORIZON_DETAILS_MAP[upper] = liveHorizons;
        if (liveHorizons[horizon]) {
          TICKER_DETAILS_MAP[upper] = liveHorizons[horizon];
          return NextResponse.json({
            success: true,
            source: "max-mcp-live",
            data: liveHorizons[horizon],
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        console.warn("Live ticker fetch failed, falling back to snapshot:", msg);
      }
    }

    // 1. Dynamic lookup from daily snapshot bundle
    const snapshotBundle = snapshotData as Record<string, unknown> | null;
    const tickerHorizons = snapshotBundle?.ticker_horizons as
      | Record<string, Record<string, TickerBrokerDetail>>
      | undefined;
    const snapshotHorizons = tickerHorizons?.[upper];
    if (snapshotHorizons) {
      const targetDetail =
        snapshotHorizons[horizon] ||
        snapshotHorizons["5D"] ||
        snapshotHorizons["2D"] ||
        snapshotHorizons["10D"];
      if (targetDetail) {
        return NextResponse.json({
          success: true,
          source: "snapshot-fallback",
          data: targetDetail,
        });
      }
    }

    // 2. Static in-memory map lookup
    const inMemoryDetail =
      (horizon && TICKER_HORIZON_DETAILS_MAP[upper]?.[horizon]) ||
      TICKER_DETAILS_MAP[upper];
    if (inMemoryDetail) {
      return NextResponse.json({
        success: true,
        source: "snapshot-fallback",
        data: inMemoryDetail,
      });
    }

    // 3. Optional Supabase database lookup
    if (publicSupabaseConfig()) {
      try {
        const supabase = await createClient();
        const { data: dbRow } = await supabase
          .from("broker_flow_ticker_horizons")
          .select("horizon_2d, horizon_5d, horizon_10d")
          .eq("ticker", upper)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbRow) {
          const matched =
            horizon === "2D"
              ? dbRow.horizon_2d
              : horizon === "10D"
              ? dbRow.horizon_10d
              : dbRow.horizon_5d;
          if (matched && Object.keys(matched).length > 0) {
            return NextResponse.json({ success: true, source: "supabase", data: matched });
          }
        }
      } catch {
        // Fall through
      }
    }

    // 4. Transparent fallback from quadrant or daily insights metadata
    const fallbackDetail = buildQuadrantFallbackDetail(upper, horizon);
    if (fallbackDetail) {
      return NextResponse.json({
        success: true,
        source: "quadrant-fallback",
        data: fallbackDetail,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "TICKER_NOT_FOUND",
        message: `Data untuk ${upper} belum ditemukan.`,
        can_on_demand: true,
      },
      { status: 404 }
    );
  }

  if (quadrant) {
    if (preferLive) {
      try {
        const liveOverview = await fetchLiveMarketOverview(horizon, forceRefresh);
        if (liveOverview.quadrant_maps[quadrant]) {
          return NextResponse.json({
            success: true,
            source: "max-mcp-live",
            data: liveOverview.quadrant_maps[quadrant],
          });
        }
      } catch {
        // fallback below
      }
    }
    const map = QUADRANT_MAPS[quadrant];
    if (map) {
      return NextResponse.json({ success: true, source: "snapshot-fallback", data: map });
    }
    return NextResponse.json(
      { error: "QUADRANT_NOT_FOUND", message: `Kuadran ${quadrant} tidak ditemukan.` },
      { status: 404 }
    );
  }

  // Full market overview: Live Max MCP first, with transparent snapshot fallback
  if (preferLive) {
    try {
      const overview = await fetchLiveMarketOverview(horizon, forceRefresh);
      return NextResponse.json({
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
          top_brokers: DEFAULT_TOP_BROKERS,
          sector_flows: DEFAULT_SECTOR_FLOWS,
          reference_snapshot_date: DEFAULT_MARKET_SUMMARY.date,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Koneksi Max MCP bermasalah";
      console.warn("Live market overview failed, serving static snapshot fallback:", msg);
    }
  }

  // Fallback response using static snapshot bundle
  const bundle = snapshotData as Record<string, unknown> | null;
  const fallbackDate = String(bundle?.snapshot_date || DEFAULT_MARKET_SUMMARY.date);
  const wib = getWibDateString();
  const fallbackFreshness: DataFreshnessMeta = {
    latest_date: fallbackDate,
    today_wib: wib.dateStr,
    is_today_published: fallbackDate >= wib.dateStr,
    source: "snapshot-fallback",
    synced_at: String(bundle?.synced_at || new Date().toISOString()),
    message: `Menampilkan snapshot cadangan (${formatShortDateID(fallbackDate)}). Koneksi feed live sedang tidak tersedia.`,
  };

  const marketSummary = snapshotData?.market_summary || DEFAULT_MARKET_SUMMARY;
  const rawTopAcc = bundle?.top_accumulations;
  const topAcc =
    Array.isArray(rawTopAcc) && rawTopAcc.length > 0
      ? rawTopAcc
      : DEFAULT_TOP_ACCUMULATIONS;
  const rawTopDist = bundle?.top_distributions;
  const topDist =
    Array.isArray(rawTopDist) && rawTopDist.length > 0
      ? rawTopDist
      : DEFAULT_TOP_DISTRIBUTIONS;

  return NextResponse.json({
    success: true,
    source: "snapshot-fallback",
    data: {
      snapshot_date: fallbackDate,
      horizon,
      data_freshness: fallbackFreshness,
      market_summary: marketSummary,
      daily_insight: getDailyInsight(horizon),
      top_accumulations: topAcc,
      top_distributions: topDist,
      top_brokers: DEFAULT_TOP_BROKERS,
      sector_flows: DEFAULT_SECTOR_FLOWS,
      quadrant_maps: QUADRANT_MAPS,
      reference_snapshot_date: DEFAULT_MARKET_SUMMARY.date,
    },
  });
}
