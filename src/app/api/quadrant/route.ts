import { NextRequest, NextResponse } from "next/server";
import { getQuadrantStocks } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const quadrant = request.nextUrl.searchParams.get("quadrant");
  const payload = await getQuadrantStocks(quadrant);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Data kuadran belum tersedia." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: payload });
}
