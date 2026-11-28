import { NextRequest, NextResponse } from "next/server";
import { computeWinRateStats } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const year = sp.get("year") || "2026";
  const minScoreRaw = Number(sp.get("minScore") ?? "0");

  const payload = await computeWinRateStats({
    year,
    minSmartMoney: Number.isFinite(minScoreRaw) ? minScoreRaw : 0,
  });

  return NextResponse.json({ ok: true, data: payload });
}
