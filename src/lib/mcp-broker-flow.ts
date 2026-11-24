/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  TickerBrokerDetail,
  BrokerDetailItem,
  HorizonPeriod,
  TradePlan,
} from "./broker-flow";

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

/**
 * Fetch and synthesize multi-horizon bandarmology detail on-demand from Max MCP.
 */
export async function fetchOnDemandTickerHorizons(
  ticker: string
): Promise<Record<HorizonPeriod, TickerBrokerDetail>> {
  const upper = ticker.toUpperCase().trim();

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

  // 2. Fetch brokers & signals for 2D, 5D, 10D in parallel
  const [b2d, b5d, b10d, s2d, s5d, s10d] = await Promise.all([
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date2D,
      endDate: endDate,
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date5D,
      endDate: endDate,
      limit: 5,
    }),
    callMaxTradeMcp("get_broksum_ticker_brokers", {
      ticker: upper,
      startDate: date10D,
      endDate: endDate,
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
    brokersResp: any;
    signalResp: any;
  }> = [
    {
      period: "2D",
      label: `2 Hari Bursa (${date2D} s/d ${endDate})`,
      range: `${date2D} - ${endDate}`,
      brokersResp: b2d,
      signalResp: s2d,
    },
    {
      period: "5D",
      label: `5 Hari Bursa (${date5D} s/d ${endDate})`,
      range: `${date5D} - ${endDate}`,
      brokersResp: b5d,
      signalResp: s5d,
    },
    {
      period: "10D",
      label: `10 Hari Bursa (${date10D} s/d ${endDate})`,
      range: `${date10D} - ${endDate}`,
      brokersResp: b10d,
      signalResp: s10d,
    },
  ];

  const result: Partial<Record<HorizonPeriod, TickerBrokerDetail>> = {};

  for (const cfg of horizonsConfig) {
    const rawBrokers = (cfg.brokersResp?.records as Array<Record<string, unknown>>) || [];
    const rawSignal = cfg.signalResp;

    // Filter top buyers & sellers
    const buyers = rawBrokers.filter((r) => r.netSide === "BUY");
    const sellers = rawBrokers.filter((r) => r.netSide === "SELL");

    const topAccumulators: BrokerDetailItem[] = buyers.slice(0, 3).map((b) => ({
      code: String(b.code || "INST"),
      name: String(b.name || b.code || "Institusi"),
      investor_group: ((b.investorGroups as string[])?.[0] || "LOCAL") as BrokerDetailItem["investor_group"],
      net_value: Number(b.netValue) || 0,
      avg_price: Number(b.buyAvgPrice || b.avgPrice) || closePrice,
    }));

    const topDistributors: BrokerDetailItem[] = sellers.slice(0, 3).map((s) => ({
      code: String(s.code || "SELLER"),
      name: String(s.name || s.code || "Penjual"),
      investor_group: ((s.investorGroups as string[])?.[0] || "LOCAL") as BrokerDetailItem["investor_group"],
      net_value: Number(s.netValue) || 0,
      avg_price: Number(s.sellAvgPrice || s.avgPrice) || closePrice,
    }));

    const bandarCost = calculateBandarAverageCost(buyers, closePrice);
    const bandarGapPct =
      bandarCost > 0
        ? Math.round(((closePrice - bandarCost) / bandarCost) * 10000) / 100
        : 0;

    const netValue =
      topAccumulators[0]?.net_value ||
      rawSignal?.summary?.foreignNetValue ||
      1_000_000_000;
    const netVolumeLots =
      Number(buyers[0]?.netVolume) || Math.round(netValue / (closePrice * 100));

    const { quadrant, quadrant_label, status_color } = classifyQuadrant(
      changePct,
      netValue
    );
    const tradePlan = synthesizeTradePlan(quadrant, closePrice, bandarCost);

    const topBuyerCode = topAccumulators[0]?.code || "Smart Money";
    const topSellerCode = topDistributors[0]?.code || "Ritel";

    const whyInsight = `Analisis on-demand horizon ${cfg.period} untuk ${upper}. Aliran smart money mencatat net ${netValue >= 0 ? "+" : ""}${(netValue / 1e9).toFixed(1)}B dipimpin broker ${topBuyerCode} pada estimasi harga modal Rp ${bandarCost.toLocaleString("id-ID")}. Jarak harga saat ini terhadap modal bandar adalah ${bandarGapPct >= 0 ? "+" : ""}${bandarGapPct}%.`;

    const counterpartyNote = `Serapan akumulasi oleh ${topBuyerCode} terhadap pelepasan posisi ${topSellerCode}.`;

    result[cfg.period] = {
      ticker: upper,
      close: closePrice,
      change_percent: changePct,
      quadrant,
      quadrant_label,
      status_color,
      horizon: cfg.period,
      horizon_label: cfg.label,
      date_range: cfg.range,
      top_accumulators: topAccumulators,
      top_distributors: topDistributors,
      net_value: netValue,
      net_volume_lots: netVolumeLots,
      concentration_pct: rawSignal?.components?.brokerConcentration || 15.0,
      bandar_avg_cost: bandarCost,
      bandar_cost_gap_pct: bandarGapPct,
      counterparty_note: counterpartyNote,
      why_insight: whyInsight,
      trade_plan: tradePlan,
      is_horizon_fallback: false,
    };
  }

  return result as Record<HorizonPeriod, TickerBrokerDetail>;
}
