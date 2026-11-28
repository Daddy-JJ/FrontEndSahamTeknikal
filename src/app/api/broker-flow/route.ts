import { NextResponse, type NextRequest } from "next/server";
import type { HorizonPeriod, TickerBrokerDetail } from "@/lib/broker-flow";
import {
  fetchLiveMarketOverview,
  fetchOnDemandTickerHorizons,
} from "@/lib/mcp-broker-flow";
import {
  resolveBrokerFlowRequest,
  type SupabaseMarketSnapshotRow,
} from "@/lib/broker-flow-service";
import snapshotData from "@/data/broker_flow_snapshot_latest.json";
import { publicSupabaseConfig, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function querySupabaseTicker(
  upper: string
): Promise<Partial<Record<HorizonPeriod, TickerBrokerDetail>> | null> {
  if (!publicSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data: dbRow } = await supabase
    .from("broker_flow_ticker_horizons")
    .select("horizon_2d, horizon_5d, horizon_10d")
    .eq("ticker", upper)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dbRow) return null;
  const dbHorizons: Partial<Record<HorizonPeriod, TickerBrokerDetail>> = {};
  if (dbRow.horizon_2d && Object.keys(dbRow.horizon_2d).length > 0) {
    dbHorizons["2D"] = dbRow.horizon_2d as TickerBrokerDetail;
  }
  if (dbRow.horizon_5d && Object.keys(dbRow.horizon_5d).length > 0) {
    dbHorizons["5D"] = dbRow.horizon_5d as TickerBrokerDetail;
  }
  if (dbRow.horizon_10d && Object.keys(dbRow.horizon_10d).length > 0) {
    dbHorizons["10D"] = dbRow.horizon_10d as TickerBrokerDetail;
  }
  return Object.keys(dbHorizons).length > 0 ? dbHorizons : null;
}

async function querySupabaseOverview(): Promise<SupabaseMarketSnapshotRow | null> {
  if (!publicSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("broker_flow_snapshots")
    .select(
      "snapshot_date, market_summary, top_accumulations, top_distributions, top_brokers, sector_flows, quadrant_maps, created_at"
    )
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SupabaseMarketSnapshotRow | null) ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const result = await resolveBrokerFlowRequest(
    {
      rawTicker: searchParams.get("ticker"),
      quadrant: searchParams.get("quadrant"),
      rawHorizon: searchParams.get("horizon"),
      onDemand: searchParams.get("on_demand") === "true",
      preferLive: searchParams.get("live") !== "false",
      forceRefresh: searchParams.get("refresh") === "true",
    },
    {
      snapshotBundle: snapshotData as Record<string, unknown> | null,
      fetchLiveOverview: fetchLiveMarketOverview,
      fetchOnDemandTicker: fetchOnDemandTickerHorizons,
      querySupabaseTicker,
      querySupabaseOverview,
    }
  );

  return NextResponse.json(result.body, { status: result.status });
}
