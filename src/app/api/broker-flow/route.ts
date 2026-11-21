import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
  QUADRANT_MAPS,
  synthesizeTickerDetail,
} from "@/lib/broker-flow";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ticker = searchParams.get("ticker");
  const quadrant = searchParams.get("quadrant");

  if (ticker) {
    const upper = ticker.toUpperCase().trim();
    const detail = TICKER_DETAILS_MAP[upper] || synthesizeTickerDetail(upper);
    return NextResponse.json({ success: true, data: detail });
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
