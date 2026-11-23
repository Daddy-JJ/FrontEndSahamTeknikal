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
  type HorizonPeriod,
} from "@/lib/broker-flow";
import snapshotData from "@/data/broker_flow_snapshot_latest.json";
import { publicSupabaseConfig, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ticker = searchParams.get("ticker");
  const quadrant = searchParams.get("quadrant");
  const horizon = (searchParams.get("horizon") as HorizonPeriod | null) || "5D";

  if (ticker) {
    const upper = ticker.toUpperCase().trim();

    // 1. Fast in-memory cache lookup (Pre-loaded top 20 featured tickers)
    const inMemoryDetail =
      (horizon && TICKER_HORIZON_DETAILS_MAP[upper]?.[horizon]) ||
      TICKER_DETAILS_MAP[upper];
    if (inMemoryDetail) {
      return NextResponse.json({ success: true, data: inMemoryDetail });
    }

    // 2. Dynamic lookup from daily snapshot bundle (Expanded market tickers)
    const snapshotHorizons = (snapshotData as any)?.ticker_horizons?.[upper];
    if (snapshotHorizons) {
      const targetDetail =
        snapshotHorizons[horizon] ||
        snapshotHorizons["5D"] ||
        snapshotHorizons["2D"] ||
        snapshotHorizons["10D"];
      if (targetDetail) {
        return NextResponse.json({ success: true, data: targetDetail });
      }
    }

    // 3. Optional Supabase database lookup (if configured in environment)
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
            return NextResponse.json({ success: true, data: matched });
          }
        }
      } catch {
        // Fall through to 404
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "TICKER_NOT_FOUND",
        message: `Data snapshot untuk ${upper} belum tersedia.`,
      },
      { status: 404 }
    );
  }

  if (quadrant) {
    const map = QUADRANT_MAPS[quadrant];
    if (map) {
      return NextResponse.json({ success: true, data: map });
    }
    return NextResponse.json(
      { error: "QUADRANT_NOT_FOUND", message: `Kuadran ${quadrant} tidak ditemukan.` },
      { status: 404 }
    );
  }

  // Return full market-wide summary including quadrant maps
  const marketSummary = snapshotData?.market_summary || DEFAULT_MARKET_SUMMARY;
  const topAcc = (snapshotData as any)?.top_accumulations?.length > 0
    ? (snapshotData as any).top_accumulations
    : DEFAULT_TOP_ACCUMULATIONS;
  const topDist = (snapshotData as any)?.top_distributions?.length > 0
    ? (snapshotData as any).top_distributions
    : DEFAULT_TOP_DISTRIBUTIONS;

  return NextResponse.json({
    success: true,
    data: {
      market_summary: marketSummary,
      top_accumulations: topAcc,
      top_distributions: topDist,
      top_brokers: DEFAULT_TOP_BROKERS,
      sector_flows: DEFAULT_SECTOR_FLOWS,
      quadrant_maps: QUADRANT_MAPS,
    },
  });
}
