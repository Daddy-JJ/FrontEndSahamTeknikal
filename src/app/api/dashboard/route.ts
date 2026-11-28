import { NextResponse } from "next/server";
import { getLatestDashboard } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getLatestDashboard();
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Data dashboard pasar belum tersedia. Jalankan sync backend terlebih dahulu." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: payload });
}
