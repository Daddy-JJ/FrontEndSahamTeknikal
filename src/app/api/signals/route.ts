import { NextRequest, NextResponse } from "next/server";
import { querySignals } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const minScoreRaw = Number(sp.get("minScore") ?? "0");
  const limitRaw = Number(sp.get("limit") ?? "300");

  const payload = await querySignals({
    date: sp.get("date") ?? "latest",
    signalType: sp.get("signalType") ?? "ALL",
    minScore: Number.isFinite(minScoreRaw) ? minScoreRaw : 0,
    regime: sp.get("regime") ?? "ALL",
    sectorSlug: sp.get("sector") ?? "ALL",
    search: sp.get("q") ?? "",
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 300,
  });

  return NextResponse.json({ ok: true, data: payload });
}
