import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_MARKET_SUMMARY,
  DEFAULT_TOP_ACCUMULATIONS,
  DEFAULT_TOP_DISTRIBUTIONS,
  DEFAULT_TOP_BROKERS,
  DEFAULT_SECTOR_FLOWS,
  TICKER_DETAILS_MAP,
} from "@/lib/broker-flow";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ticker = searchParams.get("ticker");

  if (ticker) {
    const upper = ticker.toUpperCase();
    const detail = TICKER_DETAILS_MAP[upper];
    if (!detail) {
      return NextResponse.json(
        { error: "TICKER_NOT_FOUND", message: `Data broker flow untuk ${upper} belum tersedia.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: detail });
  }

  // Return market wide summary
  return NextResponse.json({
    success: true,
    data: {
      market_summary: DEFAULT_MARKET_SUMMARY,
      top_accumulations: DEFAULT_TOP_ACCUMULATIONS,
      top_distributions: DEFAULT_TOP_DISTRIBUTIONS,
      top_brokers: DEFAULT_TOP_BROKERS,
      sector_flows: DEFAULT_SECTOR_FLOWS,
    },
  });
}
