import { NextResponse, type NextRequest } from "next/server";
import {
  filterAndSortCalendarEvents,
  getCorporateCalendar,
} from "@/lib/calendar-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const ticker = sp.get("ticker") || undefined;
  const category = sp.get("category") || "ALL";
  const query = sp.get("q") || "";
  const includeHistorical = sp.get("upcoming") === "0" || sp.get("historical") === "1";

  const payload = await getCorporateCalendar({
    ticker,
    upcomingOnly: !includeHistorical,
  });

  const filteredEvents = filterAndSortCalendarEvents(payload.events, {
    category,
    query,
    ticker,
    includeHistorical,
  });

  return NextResponse.json({
    ok: payload.status !== "unavailable",
    data: {
      ...payload,
      events: filteredEvents,
    },
  });
}
