import { NextResponse, type NextRequest } from "next/server";
import { fetchOnDemandTickerHorizons } from "@/lib/mcp-broker-flow";
import { normalizeTicker } from "@/lib/broker-flow-service";

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

    const upper = normalizeTicker(rawTicker);
    if (!upper) {
      return NextResponse.json(
        {
          success: false,
          error: `Format ticker '${rawTicker.toUpperCase().trim()}' tidak valid untuk Bursa Efek Indonesia.`,
        },
        { status: 400 }
      );
    }

    // Respect built-in 60s refresh cooldown & 5-minute TTL cache inside fetchOnDemandTickerHorizons
    const horizons = await fetchOnDemandTickerHorizons(upper, true);

    return NextResponse.json({
      success: true,
      ticker: upper,
      horizons,
      detail: horizons["5D"] || horizons["2D"] || horizons["10D"],
      message: `Analisis on-demand untuk ${upper} berhasil ditarik langsung dari Max MCP.`,
      synced_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal melakukan analisis on-demand.";
    console.error("On-demand broker flow error:", error);
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 502 }
    );
  }
}
