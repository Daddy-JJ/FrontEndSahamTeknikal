import { NextResponse, type NextRequest } from "next/server";
import { getTickerIntelligence } from "@/lib/ticker-intelligence";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  const payload = await getTickerIntelligence(ticker);

  if (!payload) {
    return NextResponse.json(
      { ok: false, error: `Data intelijen untuk emiten '${ticker.toUpperCase()}' tidak ditemukan.` },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: payload });
}
