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

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ticker = searchParams.get("ticker");
  const quadrant = searchParams.get("quadrant");
  const horizon = searchParams.get("horizon") as HorizonPeriod | null;

  if (ticker) {
    const upper = ticker.toUpperCase().trim();
    const detail =
      (horizon && TICKER_HORIZON_DETAILS_MAP[upper]?.[horizon]) ||
      TICKER_DETAILS_MAP[upper];
    if (detail) {
      return NextResponse.json({ success: true, data: detail });
    }
    return NextResponse.json(
      { success: false, error: "TICKER_NOT_FOUND", message: `Data snapshot untuk ${upper} belum tersedia.` },
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
  return NextResponse.json({
    success: true,
    data: {
      market_summary: DEFAULT_MARKET_SUMMARY,
      top_accumulations: DEFAULT_TOP_ACCUMULATIONS,
      top_distributions: DEFAULT_TOP_DISTRIBUTIONS,
      top_brokers: DEFAULT_TOP_BROKERS,
      sector_flows: DEFAULT_SECTOR_FLOWS,
      quadrant_maps: QUADRANT_MAPS,
    },
  });
}
