import { NextResponse, type NextRequest } from "next/server";
import { callMaxTradeMcp } from "@/lib/mcp-broker-flow";
import {
  computeSupertrend,
  computeMACD,
  type OHLCVBar,
} from "@/lib/indicators";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rawTicker = request.nextUrl.searchParams.get("ticker");

    if (!rawTicker || typeof rawTicker !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'ticker' diperlukan.",
        },
        { status: 400 }
      );
    }

    const upper = rawTicker.toUpperCase().trim();
    if (upper.length < 3 || upper.length > 8) {
      return NextResponse.json(
        {
          success: false,
          error: `Format ticker '${upper}' tidak valid.`,
        },
        { status: 400 }
      );
    }

    // Fetch latest 250 trading bars (approx 1 year) in descending order to capture most recent
    const eodRes = await callMaxTradeMcp(
      "get_eod_history",
      {
        ticker: upper,
        order: "desc",
        limit: 250,
      },
      15000
    );

    const rawRecords = Array.isArray(eodRes?.records) ? eodRes.records : [];
    if (rawRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Data historis EOD untuk emiten '${upper}' belum tersedia di data feed.`,
        },
        { status: 404 }
      );
    }

    // Order chronologically (asc) for Lightweight Charts and indicators
    const sorted = [...rawRecords].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );

    const bars: OHLCVBar[] = sorted.map((r: Record<string, unknown>) => ({
      time: String(r.date),
      open: Number(r.open) || Number(r.close),
      high: Number(r.high) || Number(r.close),
      low: Number(r.low) || Number(r.close),
      close: Number(r.close),
      volume: Number(r.volume) || 0,
    }));

    // Filter out invalid or zero price candles
    const validBars = bars.filter(
      (b) =>
        b.open > 0 &&
        b.high > 0 &&
        b.low > 0 &&
        b.close > 0 &&
        b.time.match(/^\d{4}-\d{2}-\d{2}$/)
    );

    if (validBars.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Tidak ada candlestick valid untuk emiten '${upper}'.`,
        },
        { status: 404 }
      );
    }

    // Compute indicators
    const supertrend = computeSupertrend(validBars, 10, 3.0);
    const macd = computeMACD(validBars, 12, 26, 9);

    return NextResponse.json({
      success: true,
      ticker: upper,
      totalBars: validBars.length,
      latestDate: validBars[validBars.length - 1].time,
      bars: validBars,
      supertrend,
      macd,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Gagal memuat data chart teknikal.";
    console.error("Broker flow chart error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}
