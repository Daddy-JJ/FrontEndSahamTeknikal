import { NextResponse, type NextRequest } from "next/server";
import { fetchOnDemandTickerHorizons } from "@/lib/mcp-broker-flow";
import {
  TICKER_DETAILS_MAP,
  TICKER_HORIZON_DETAILS_MAP,
} from "@/lib/broker-flow";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawTicker = body?.ticker || request.nextUrl.searchParams.get("ticker");

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
          error: `Format ticker '${upper}' tidak valid untuk Bursa Efek Indonesia.`,
        },
        { status: 400 }
      );
    }

    // Call Max MCP on-demand synthesizer
    const horizons = await fetchOnDemandTickerHorizons(upper);

    // Cache in-memory for instant subsequent requests during server lifetime
    TICKER_HORIZON_DETAILS_MAP[upper] = horizons;
    if (horizons["5D"]) {
      TICKER_DETAILS_MAP[upper] = horizons["5D"];
    } else if (horizons["2D"]) {
      TICKER_DETAILS_MAP[upper] = horizons["2D"];
    }

    return NextResponse.json({
      success: true,
      ticker: upper,
      horizons,
      detail: horizons["5D"] || horizons["2D"] || horizons["10D"],
      message: `Analisis on-demand untuk ${upper} berhasil ditarik langsung dari Max MCP.`,
      synced_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("On-demand broker flow error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal melakukan analisis on-demand.",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json(
      { success: false, error: "Gunakan method POST atau sertakan query ?ticker=" },
      { status: 400 }
    );
  }

  // Delegate to POST logic
  const mockReq = {
    json: async () => ({ ticker }),
    nextUrl: request.nextUrl,
  } as unknown as NextRequest;

  return POST(mockReq);
}
