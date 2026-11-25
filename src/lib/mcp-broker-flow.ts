/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  TickerBrokerDetail,
  BrokerDetailItem,
  HorizonPeriod,
  TradePlan,
} from "./broker-flow";
import {
  computeHorizonWindow,
  formatDateRangeID,
  synthesizeLiveMarketOverview,
  type LiveMarketOverviewPayload,
  type McpBrokerHistoryRow,
  type McpRankingRecord,
} from "./live-broker-flow.ts";

const CACHE_TTL_MS = 5 * 60 * 1000;
const LIVE_MARKET_CACHE = new Map<
  HorizonPeriod,
  { expiresAt: number; payload: LiveMarketOverviewPayload }
>();
const LIVE_TICKER_CACHE = new Map<
  string,
  { expiresAt: number; horizons: Record<HorizonPeriod, TickerBrokerDetail> }
>();

const DEFAULT_MCP_URL =
  process.env.MAX_TRADE_MCP_URL || "https://eod.maxlong.my.id/mcp";
const DEFAULT_MCP_TOKEN =
  process.env.MAX_TRADE_MCP_TOKEN || "YeU65tY4n40eBTsC_CFSrFYnaCHL1YEmuwE72sE4hSk";

/**
 * Call Max Trade MCP server via JSON-RPC over HTTP.
 * Supports both text/event-stream (SSE) and application/json responses.
 */
export async function callMaxTradeMcp(
  toolName: string,
  args: Record<string, any>,
  timeoutMs: number = 20000
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(DEFAULT_MCP_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEFAULT_MCP_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MCP HTTP ${response.status}: ${errText.slice(0, 150)}`);
    }

    const text = await response.text();

    // Check SSE format (starts with event: or contains data:)
    if (text.startsWith("event:") || text.includes("data:")) {
      for (const line of text.split("\n")) {
        if (line.startsWith("data:")) {
          const jsonStr = line.slice(5).trim();
          const parsed = JSON.parse(jsonStr);
          const content = parsed.result?.content;
          if (content && content[0]?.type === "text") {
            return JSON.parse(content[0].text);
          }
          return parsed.result;
        }
      }
    }

    const data = JSON.parse(text);
    if (data.error) {
      throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
    }
    const content = data.result?.content;
    if (content && content[0]?.type === "text") {
      return JSON.parse(content[0].text);
    }
    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Helper to calculate weighted average cost of bandar/accumulators.
 */
function calculateBandarAverageCost(
  buyers: Array<Record<string, unknown>>,
  fallbackPrice: number
): number {
  if (!buyers || buyers.length === 0) return fallbackPrice;

  let totalValue = 0;
  let totalVolumeLots = 0;

  for (const b of buyers) {
    const netVal = Number(b.netValue || b.buyValue) || 0;
    const netVol = Number(b.netVolume || b.buyVolume) || 0;
    if (netVal > 0 && netVol > 0) {
      totalValue += netVal;
      totalVolumeLots += netVol;
    }
  }

  if (totalVolumeLots > 0) {
    const rawCost = totalValue / (totalVolumeLots * 100);
    return Math.round(rawCost * 100) / 100;
  }

  // Fallback to top buyer avg price if available
  const topAvg = Number(buyers[0]?.buyAvgPrice || buyers[0]?.avgPrice);
  return topAvg ? Math.round(topAvg * 100) / 100 : fallbackPrice;
}

/**
 * Classify ticker into Wyckoff Market Quadrant.
 */
function classifyQuadrant(
  changePct: number,
  netFlow: number
): {
  quadrant: string;
  quadrant_label: string;
  status_color: "emerald" | "amber" | "sky" | "rose";
} {
  if (changePct >= 0 && netFlow >= 0) {
    return {
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
    };
  } else if (changePct >= 0 && netFlow < 0) {
    return {
      quadrant: "markup_distribusi",
      quadrant_label: "[MD] Markup + Distribusi",
      status_color: "sky",
    };
  } else if (changePct < 0 && netFlow >= 0) {
    return {
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "amber",
    };
  } else {
    return {
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
    };
  }
}

/**
 * Generate actionable trade plan based on quadrant and bandar cost.
 */
function synthesizeTradePlan(
  quadrant: string,
  close: number,
  bandarCost: number
): TradePlan {
  if (quadrant === "markup_akumulasi") {
    const entryLow = Math.max(1, Math.round(close * 0.96));
    const entryHigh = Math.max(1, Math.round(close * 0.99));
    const sl = Math.max(1, Math.round(bandarCost * 0.95));
    const tp1 = Math.round(close * 1.12);
    const tp2 = Math.round(close * 1.22);
    return {
      action: "BUY ON PULLBACK",
      entry_zone: `${entryLow} - ${entryHigh}`,
      stop_loss: `${sl} (Risk ~-5%)`,
      target_price: `${tp1} - ${tp2} (Reward +12% s/d +22%)`,
      rr_ratio: "1 : 2.8",
      note: "Markup akumulasi valid. Antre beli bertahap saat retest support / harga modal bandar.",
    };
  } else if (quadrant === "markdown_akumulasi") {
    const entryLow = Math.max(1, Math.round(close * 0.97));
    const entryHigh = Math.max(1, Math.round(close * 1.01));
    const sl = Math.max(1, Math.round(close * 0.94));
    const tp = Math.round(bandarCost * 1.08);
    return {
      action: "SWING BUY / ACCUMULATE",
      entry_zone: `${entryLow} - ${entryHigh}`,
      stop_loss: `${sl} (Risk ~-6%)`,
      target_price: `${tp} (Reward +8% s/d +15%)`,
      rr_ratio: "1 : 2.3",
      note: "Weakness absorption: Harga melemah namun diakumulasi diam-diam. Beli bertahap pada area support.",
    };
  } else if (quadrant === "markup_distribusi") {
    const sl = Math.round(close * 0.95);
    const tp = Math.round(close * 1.04);
    return {
      action: "AVOID / SELL ON STRENGTH",
      entry_zone: "Tidak disarankan entry baru",
      stop_loss: `${sl} (Trailing Stop)`,
      target_price: `${tp} (Area Exit/TP)`,
      rr_ratio: "1 : 1.0",
      note: "Markup semu (pancingan ritel). Manfaatkan penguatan harga untuk sell on strength / kurangi posisi.",
    };
  } else {
    return {
      action: "HARD AVOID",
      entry_zone: "Wait and see",
      stop_loss: `${Math.round(close * 0.92)} (Cutloss)`,
      target_price: "Belum terbentuk base",
      rr_ratio: "N/A",
      note: "Distribusi aktif dalam tren turun. Risiko markdown lanjutan tinggi, jangan tangkap pisau jatuh.",
    };
  }
}

function formatSignedBillions(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const absB = Math.abs(value) / 1e9;
  return `${sign}${absB.toFixed(1)}B`;
}

function describeCostStance(gapPct: number): string {
  if (gapPct <= 0) return "berada di area diskon bawah modal bandar";
  if (gapPct <= 3) return "dekat dengan modal rata-rata bandar (zona akumulasi sehat)";
  if (gapPct <= 7) return "sedang markup terkendali di atas modal";
  return "sudah jauh di atas modal rata-rata bandar (waspada chasing)";
}

export interface SynthesizeHorizonParams {
  ticker: string;
  closePrice: number;
  changePct: number;
  period: HorizonPeriod;
  label: string;
  range: string;
  buyersResp: any;
  sellersResp: any;
  signalResp: any;
}

/**
 * Synthesizes a structured TickerBrokerDetail entry for a single horizon from Max MCP responses.
 */
export function synthesizeTickerHorizonDetail(
  params: SynthesizeHorizonParams
): TickerBrokerDetail {
  const { ticker, closePrice, changePct, period, label, range, buyersResp, sellersResp, signalResp } =
    params;
  const upper = ticker.toUpperCase().trim();
  const rawBuyers = (buyersResp?.records as Array<Record<string, unknown>>) || [];
  const rawSellers = (sellersResp?.records as Array<Record<string, unknown>>) || [];

  const buyers = rawBuyers.filter((r) => r.netSide === "BUY");
  const sellers = rawSellers.filter((r) => r.netSide === "SELL");

  const topAccumulators: BrokerDetailItem[] = buyers.slice(0, 3).map((b) => ({
    code: String(b.code || "INST"),
    name: String(b.name || b.code || "Institusi"),
    investor_group: ((b.investorGroups as string[])?.[0] ||
      "LOCAL") as BrokerDetailItem["investor_group"],
    net_value: Number(b.netValue) || 0,
    avg_price: Number(b.buyAvgPrice || b.avgPrice) || closePrice,
  }));

  const topDistributors: BrokerDetailItem[] = sellers.slice(0, 3).map((s) => ({
    code: String(s.code || "SELLER"),
    name: String(s.name || s.code || "Penjual"),
    investor_group: ((s.investorGroups as string[])?.[0] ||
      "LOCAL") as BrokerDetailItem["investor_group"],
    net_value: Number(s.netValue) || 0,
    avg_price: Number(s.sellAvgPrice || s.avgPrice) || closePrice,
  }));

  const bandarCost = calculateBandarAverageCost(buyers, closePrice);
  const bandarGapPct =
    bandarCost > 0 ? Math.round(((closePrice - bandarCost) / bandarCost) * 10000) / 100 : 0;

  const top3Sum = topAccumulators.reduce((sum, item) => sum + item.net_value, 0);
  const foreignNet = Number(signalResp?.summary?.foreignNetValue) || 0;
  const netValue = topAccumulators[0]?.net_value || foreignNet || 0;
  const netVolumeLots =
    Number(buyers[0]?.netVolume) ||
    (closePrice > 0 ? Math.round(Math.abs(netValue) / (closePrice * 100)) : 0);

  const { quadrant, quadrant_label, status_color } = classifyQuadrant(changePct, netValue);
  const tradePlan = synthesizeTradePlan(quadrant, closePrice, bandarCost);

  const topBuyerCode = topAccumulators[0]?.code || "Smart Money";
  const topSellerCode = topDistributors[0]?.code || "Ritel";
  const phaseName =
    period === "2D" ? "Inisiasi 48j" : period === "5D" ? "Persistensi 5D" : "Fondasi 10D";
  const signalScore =
    typeof signalResp?.score === "number" ? Number(signalResp.score) : undefined;
  const signalLabel = signalResp?.label ? String(signalResp.label) : undefined;
  const consistencyPct =
    typeof signalResp?.evidence?.accumulationConsistencyPct === "number"
      ? Number(signalResp.evidence.accumulationConsistencyPct)
      : undefined;

  const coalitionText =
    topAccumulators.length > 0
      ? topAccumulators
          .map((a) => `${a.code} (${formatSignedBillions(a.net_value)})`)
          .join(", ")
      : topBuyerCode;
  const telemetryParts: string[] = [];
  if (typeof consistencyPct === "number") {
    telemetryParts.push(`konsistensi ${Math.round(consistencyPct)}%`);
  }
  if (typeof signalScore === "number") {
    telemetryParts.push(`score ${Math.round(signalScore)}`);
  }
  if (foreignNet !== 0) {
    telemetryParts.push(`foreign ${formatSignedBillions(foreignNet)}`);
  }
  const telemetryClause = telemetryParts.length > 0 ? ` (${telemetryParts.join(", ")})` : "";
  const whyInsight = `${phaseName}: ${coalitionText} menyerap pelepasan ${topSellerCode}${telemetryClause}. Posisi harga saat ini ${describeCostStance(bandarGapPct)}.`;

  return {
    ticker: upper,
    close: closePrice,
    change_percent: changePct,
    quadrant,
    quadrant_label,
    status_color,
    horizon: period,
    horizon_label: label,
    date_range: range,
    top_accumulators: topAccumulators,
    top_distributors: topDistributors,
    net_value: netValue,
    net_volume_lots: netVolumeLots,
    concentration_pct: Number(signalResp?.components?.brokerConcentration) || 15.0,
    bandar_avg_cost: bandarCost,
    bandar_cost_gap_pct: bandarGapPct,
    counterparty_note: `Serapan oleh ${topBuyerCode} terhadap pelepasan posisi ${topSellerCode}.`,
    why_insight: whyInsight,
    trade_plan: tradePlan,
    is_horizon_fallback: false,
    top_accumulators_net_value: top3Sum,
    foreign_net_value: foreignNet,
    signal_label: signalLabel,
    signal_score: signalScore,
    consistency_pct: consistencyPct,
  };
}

/**
 * Fetch and synthesize multi-horizon bandarmology detail on-demand from Max MCP.
 */
export async function fetchOnDemandTickerHorizons(
  ticker: string,
  forceRefresh: boolean = false
): Promise<Record<HorizonPeriod, TickerBrokerDetail>> {
  const upper = ticker.toUpperCase().trim();
  const cachedEntry = LIVE_TICKER_CACHE.get(upper);
  if (!forceRefresh && cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.horizons;
  }

  // 1. Fetch EOD history to obtain latest price & trading session dates
  const eodData = await callMaxTradeMcp("get_eod_history", {
    ticker: upper,
    limit: 15,
    order: "desc",
  });

  const records = eodData?.records || [];
  if (records.length === 0) {
    throw new Error(`Data EOD untuk ticker ${upper} tidak ditemukan di MCP server.`);
  }

  const latestEod = records[0];
  const closePrice = Number(latestEod.close) || 1000;
  const changePct = Number(latestEod.changePercent) || 0;
  const endDate = latestEod.date;

  // Determine anchor start dates dynamically from genuine trading calendar
  const date2D = records[Math.min(1, records.length - 1)].date;
  const date5D = records[Math.min(4, records.length - 1)].date;
  const date10D = records[Math.min(9, records.length - 1)].date;

  // 2. Fetch top buyers, top sellers & signals for 2D, 5D, 10D in parallel
  const [b2d, b5d, b10d, sel2d, sel5d, sel10d, s2d, s5d, s10d] = await Promise.all([
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date2D,
      endDate: endDate,
      sort: "net_value_desc",
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date5D,
      endDate: endDate,
      sort: "net_value_desc",
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date10D,
      endDate: endDate,
      sort: "net_value_desc",
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date2D,
      endDate: endDate,
      sort: "net_value_asc",
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date5D,
      endDate: endDate,
      sort: "net_value_asc",
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date10D,
      endDate: endDate,
      sort: "net_value_asc",
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_signal", {
      ticker: upper,
      startDate: date2D,
      endDate: endDate,
    }),
    callMaxTradeMcp("get_broksum_signal", {
      ticker: upper,
      startDate: date5D,
      endDate: endDate,
    }),
    callMaxTradeMcp("get_broksum_signal", {
      ticker: upper,
      startDate: date10D,
      endDate: endDate,
    }),
  ]);

  const horizonsConfig: Array<{
    period: HorizonPeriod;
    label: string;
    range: string;
    buyersResp: any;
    sellersResp: any;
    signalResp: any;
  }> = [
    {
      period: "2D",
      label: `2 Hari (${formatDateRangeID(date2D, endDate)})`,
      range: formatDateRangeID(date2D, endDate),
      buyersResp: b2d,
      sellersResp: sel2d,
      signalResp: s2d,
    },
    {
      period: "5D",
      label: `5 Hari (${formatDateRangeID(date5D, endDate)})`,
      range: formatDateRangeID(date5D, endDate),
      buyersResp: b5d,
      sellersResp: sel5d,
      signalResp: s5d,
    },
    {
      period: "10D",
      label: `10 Hari (${formatDateRangeID(date10D, endDate)})`,
      range: formatDateRangeID(date10D, endDate),
      buyersResp: b10d,
      sellersResp: sel10d,
      signalResp: s10d,
    },
  ];

  const result: Partial<Record<HorizonPeriod, TickerBrokerDetail>> = {};

  for (const cfg of horizonsConfig) {
    result[cfg.period] = synthesizeTickerHorizonDetail({
      ticker: upper,
      closePrice,
      changePct,
      period: cfg.period,
      label: cfg.label,
      range: cfg.range,
      buyersResp: cfg.buyersResp,
      sellersResp: cfg.sellersResp,
      signalResp: cfg.signalResp,
    });
  }

  const finalHorizons = result as Record<HorizonPeriod, TickerBrokerDetail>;
  LIVE_TICKER_CACHE.set(upper, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    horizons: finalHorizons,
  });

  return finalHorizons;
}

/**
 * Fetch live market-wide overview, daily radar, rankings, quadrants & retail footprints from Max MCP.
 */
export async function fetchLiveMarketOverview(
  horizon: HorizonPeriod = "5D",
  forceRefresh: boolean = false
): Promise<LiveMarketOverviewPayload> {
  if (forceRefresh) {
    LIVE_MARKET_CACHE.clear();
    LIVE_TICKER_CACHE.clear();
  }

  const cached = LIVE_MARKET_CACHE.get(horizon);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const startLookback = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const availResp = await callMaxTradeMcp("get_broksum_availability", {
    startDate: startLookback,
  });

  const availDates: string[] = Array.isArray(availResp?.dates)
    ? availResp.dates.map((d: any) => String(d.date)).filter(Boolean)
    : [];

  if (availDates.length === 0) {
    throw new Error("Max MCP belum mengembalikan daftar tanggal bursa yang tersedia.");
  }

  const { startDate, endDate } = computeHorizonWindow(availDates, horizon);

  const [
    snapshotResp,
    quadrantResp,
    accRankingResp,
    foreignSellResp,
    xlBuy,
    xlSell,
    xcBuy,
    xcSell,
    ypBuy,
    ypSell,
  ] = await Promise.all([
    callMaxTradeMcp("get_market_snapshot", {
      date: endDate,
      limit: 100,
      orderBy: "value_desc",
    }).catch(() => null),
    callMaxTradeMcp("get_broksum_market_quadrant", {
      date: endDate,
      flow: "smart",
      limit: 100,
    }).catch(() => null),
    callMaxTradeMcp("get_broksum_market_ranking", {
      date: endDate,
      side: "accumulation",
      topN: 5,
      limit: 25,
    }),
    callMaxTradeMcp("get_broksum_market_ranking", {
      date: endDate,
      side: "net_foreign_sell",
      topN: 5,
      limit: 15,
    }).catch(() => null),
    callMaxTradeMcp("get_broker_history", {
      broker: "XL",
      startDate,
      endDate,
      sort: "net_value_desc",
      limit: 20,
    }).catch(() => null),
    callMaxTradeMcp("get_broker_history", {
      broker: "XL",
      startDate,
      endDate,
      sort: "net_value_asc",
      limit: 15,
    }).catch(() => null),
    callMaxTradeMcp("get_broker_history", {
      broker: "XC",
      startDate,
      endDate,
      sort: "net_value_desc",
      limit: 20,
    }).catch(() => null),
    callMaxTradeMcp("get_broker_history", {
      broker: "XC",
      startDate,
      endDate,
      sort: "net_value_asc",
      limit: 15,
    }).catch(() => null),
    callMaxTradeMcp("get_broker_history", {
      broker: "YP",
      startDate,
      endDate,
      sort: "net_value_desc",
      limit: 20,
    }).catch(() => null),
    callMaxTradeMcp("get_broker_history", {
      broker: "YP",
      startDate,
      endDate,
      sort: "net_value_asc",
      limit: 15,
    }).catch(() => null),
  ]);

  const mergeBrokerRows = (a: any, b: any): McpBrokerHistoryRow[] => [
    ...((a?.records as McpBrokerHistoryRow[]) || []),
    ...((b?.records as McpBrokerHistoryRow[]) || []),
  ];

  // Pick up to 5 top featured candidates (3 acc + 2 dist) to enrich with multi-day broker breakdown
  const accList: McpRankingRecord[] = (accRankingResp?.records || []).filter(
    (r: McpRankingRecord) => {
      const topBuy = Number(r.topBuyerNetValueTopN) || 0;
      const topSell = Number(r.topSellerNetValueTopN) || 0;
      const score = Number(r.bandarSignal?.score) || 0;
      const smartNet = (Number(r.foreignNetValue) || 0) + (Number(r.governmentNetValue) || 0);
      return topBuy >= topSell && score > 0 && smartNet >= 0;
    }
  );
  const distList: McpRankingRecord[] = (foreignSellResp?.records || []).slice(0, 3);
  const featureTickers = Array.from(
    new Set([
      ...accList.slice(0, 3).map((r) => String(r.ticker || "")),
      ...distList.slice(0, 2).map((r) => String(r.ticker || "")),
    ].filter(Boolean))
  ).slice(0, 5);

  const enrichedDetails: Record<string, TickerBrokerDetail> = {};
  if (featureTickers.length > 0) {
    try {
      const enrichPromise = Promise.allSettled(
        featureTickers.map(async (t) => {
          const horizons = await fetchOnDemandTickerHorizons(t, false);
          return { ticker: t, detail: horizons[horizon] };
        })
      );
      const timeoutGuard = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
      const settled = await Promise.race([enrichPromise, timeoutGuard]);
      if (Array.isArray(settled)) {
        for (const item of settled) {
          if (item.status === "fulfilled" && item.value.detail) {
            enrichedDetails[item.value.ticker] = item.value.detail;
          }
        }
      }
    } catch {
      // Enrichment is best-effort; core market ranking stays intact
    }
  }

  const payload = synthesizeLiveMarketOverview({
    horizon,
    availDates,
    snapshotResp,
    quadrantResp,
    accRankingResp,
    foreignSellResp,
    retailHistories: {
      XL: mergeBrokerRows(xlBuy, xlSell),
      XC: mergeBrokerRows(xcBuy, xcSell),
      YP: mergeBrokerRows(ypBuy, ypSell),
    },
    enrichedDetails,
  });

  LIVE_MARKET_CACHE.set(horizon, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload,
  });

  return payload;
}
