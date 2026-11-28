import { NextResponse, type NextRequest } from "next/server";
import { getSectorSnapshot } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sector: string }> }
) {
  const { sector } = await context.params;
  const { snapshot, allSectors } = await getSectorSnapshot(sector);

  if (!snapshot) {
    return NextResponse.json(
      { ok: false, error: `Sektor '${sector}' belum ditemukan.` },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: snapshot, sectors: allSectors });
}
