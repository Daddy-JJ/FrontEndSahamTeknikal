import type {
  AccumulationItem,
  DailyInsightCardData,
  DistributionItem,
  HorizonPeriod,
  MarketSummary,
  QuadrantCounts,
  QuadrantMapDetail,
  QuadrantStockItem,
  RetailPulseItem,
  SweetSpotItem,
  TickerBrokerDetail,
  TrapItem,
} from "./broker-flow";

export interface McpRankingRecord {
  ticker?: string;
  date?: string;
  close?: number;
  changePercent?: number;
  turnoverValue?: number;
  totalValue?: number;
  foreignNetValue?: number;
  governmentNetValue?: number;
  localNetValue?: number;
  topBuyerNetValueTopN?: number;
  topSellerNetValueTopN?: number;
  accumulationStrengthPct?: number;
  distributionStrengthPct?: number;
  topNetBuyer?: {
    code?: string;
    name?: string;
    investorGroups?: string[];
    netValue?: number;
    buyAvgPrice?: number;
    avgPrice?: number;
  };
  topNetSeller?: {
    code?: string;
    name?: string;
    investorGroups?: string[];
    netValue?: number;
    sellAvgPrice?: number;
    avgPrice?: number;
  };
  bandarSignal?: {
    label?: string;
    score?: number;
  };
}

export interface McpQuadrantRecord {
  ticker?: string;
  close?: number;
  changePercent?: number;
  foreignNetValue?: number;
  governmentNetValue?: number;
  smartMoneyNet?: number;
  flowNetValue?: number;
  turnoverValue?: number;
  quadrant?: string;
}

export interface McpQuadrantResponse {
  date?: string;
  summary?: QuadrantCounts;
  totalTickers?: number;
  records?: McpQuadrantRecord[];
}

export interface McpMarketSnapshotResponse {
  date?: string;
  totalTickers?: number;
  totalTradeValue?: number;
  records?: Array<{
    ticker?: string;
    close?: number;
    changePercent?: number;
    tradeValue?: number;
  }>;
}

export interface McpBrokerHistoryRow {
  code?: string;
  ticker?: string;
  date?: string;
  netValue?: number;
}

export interface DataFreshnessMeta {
  latest_date: string;
  today_wib: string;
  is_today_published: boolean;
  source: "max-mcp-live" | "supabase" | "snapshot-fallback";
  synced_at: string;
  message: string;
}

export interface LiveMarketOverviewPayload {
  snapshot_date: string;
  horizon: HorizonPeriod;
  horizon_start_date: string;
  data_freshness: DataFreshnessMeta;
  market_summary: MarketSummary;
  daily_insight: DailyInsightCardData;
  top_accumulations: AccumulationItem[];
  top_distributions: DistributionItem[];
  quadrant_maps: Record<string, QuadrantMapDetail>;
}

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const RETAIL_BROKER_NAMES: Record<string, string> = {
  XL: "Stockbit Sekuritas",
  XC: "Ajaib Sekuritas",
  YP: "Mirae Asset Sekuritas",
};

const HORIZON_LABELS: Record<HorizonPeriod, string> = {
  "2D": "2 Hari Bursa (Inisiasi & Momentum)",
  "5D": "5 Hari Bursa (Weekly Persistence - Rekomendasi Utama)",
  "10D": "10 Hari Bursa (Structural Base / Inventory Bandar)",
};

export function getWibDateString(now: Date = new Date()): {
  dateStr: string;
  hourWib: number;
  isWeekday: boolean;
} {
  // Format in Asia/Jakarta (UTC+7 fixed offset)
  const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  const day = wibDate.getUTCDay();
  return {
    dateStr: wibDate.toISOString().slice(0, 10),
    hourWib: wibDate.getUTCHours(),
    isWeekday: day >= 1 && day <= 5,
  };
}

export function formatShortDateID(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const monthIdx = Number(parts[1]) - 1;
  const dayNum = Number(parts[2]);
  const monthLabel = MONTHS_ID[monthIdx] ?? parts[1];
  return `${String(dayNum).padStart(2, "0")} ${monthLabel} ${parts[0]}`;
}

export function formatDateRangeID(startIso: string, endIso: string): string {
  const s = startIso.split("-");
  const e = endIso.split("-");
  if (s.length !== 3 || e.length !== 3) return `${startIso} - ${endIso}`;
  if (startIso === endIso) return formatShortDateID(endIso);
  const eMonth = MONTHS_ID[Number(e[1]) - 1] ?? e[1];
  if (s[0] === e[0] && s[1] === e[1]) {
    return `${s[2]} - ${e[2]} ${eMonth} ${e[0]}`;
  }
  const sMonth = MONTHS_ID[Number(s[1]) - 1] ?? s[1];
  return `${s[2]} ${sMonth} - ${e[2]} ${eMonth} ${e[0]}`;
}

export function computeHorizonWindow(
  availDates: string[],
  horizon: HorizonPeriod
): { startDate: string; endDate: string; tradingDays: number } {
  const sorted = [...new Set(availDates)].sort();
  if (sorted.length === 0) {
    const today = getWibDateString().dateStr;
    return { startDate: today, endDate: today, tradingDays: 1 };
  }
  const count = horizon === "2D" ? 2 : horizon === "5D" ? 5 : 10;
  const endDate = sorted[sorted.length - 1];
  const startIdx = Math.max(0, sorted.length - count);
  return {
    startDate: sorted[startIdx],
    endDate,
    tradingDays: sorted.length - startIdx,
  };
}

function smartNetOf(rec: McpRankingRecord): number {
  const f = Number(rec.foreignNetValue) || 0;
  const g = Number(rec.governmentNetValue) || 0;
  if (f !== 0 || g !== 0) return f + g;
  return (Number(rec.topBuyerNetValueTopN) || 0) - (Number(rec.topSellerNetValueTopN) || 0);
}

function classifyFallbackQuadrant(changePct: number, smartNet: number): string {
  if (changePct >= 0) return smartNet >= 0 ? "markup_akumulasi" : "markup_distribusi";
  return smartNet >= 0 ? "markdown_akumulasi" : "markdown_distribusi";
}

function formatBillion(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${(Math.abs(value) / 1e9).toFixed(1)}B`;
}

export function aggregateBrokerFootprint(
  brokerCode: string,
  rows: McpBrokerHistoryRow[]
): RetailPulseItem {
  const byTicker = new Map<string, number>();
  for (const r of rows) {
    const t = String(r.ticker || "").toUpperCase().trim();
    if (!t) continue;
    byTicker.set(t, (byTicker.get(t) ?? 0) + (Number(r.netValue) || 0));
  }

  let totalNet = 0;
  const entries = Array.from(byTicker.entries());
  for (const [, val] of entries) {
    totalNet += val;
  }

  const topBought = entries
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ticker, net_val]) => ({ ticker, net_val }));

  const topSold = entries
    .filter(([, v]) => v < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([ticker, net_val]) => ({ ticker, net_val }));

  const sentimentLabel =
    totalNet > 10_000_000_000
      ? "NET BUY (FOMO / ABSORPTION RISK)"
      : totalNet < -10_000_000_000
      ? "NET SELL (PANIC / PROFIT TAKING)"
      : "ROTATION SEKTOR";

  return {
    broker_code: brokerCode,
    broker_name: RETAIL_BROKER_NAMES[brokerCode] || `${brokerCode} Sekuritas`,
    total_net: Math.round(totalNet),
    top_bought: topBought,
    top_sold: topSold,
    sentiment_label: sentimentLabel,
  };
}

function buildSweetSpotItem(
  rec: McpRankingRecord,
  horizonDetail?: TickerBrokerDetail
): SweetSpotItem {
  const ticker = String(rec.ticker || "");
  const close = horizonDetail?.close || Number(rec.close) || 0;
  const chg = horizonDetail?.change_percent ?? (Number(rec.changePercent) || 0);
  const bandarCost = horizonDetail?.bandar_avg_cost || Number(rec.topNetBuyer?.buyAvgPrice) || close;
  const gapPct =
    bandarCost > 0
      ? Math.round(((close - bandarCost) / bandarCost) * 1000) / 10
      : 0;

  const buyerCode = String(horizonDetail?.top_accumulators?.[0]?.code || rec.topNetBuyer?.code || "INST");
  const buyerVal =
    horizonDetail?.top_accumulators?.[0]?.net_value ??
    (Number(rec.topNetBuyer?.netValue) || 0);
  const leadAccumulator = `${buyerCode} (${formatBillion(buyerVal)})`;

  const groupRaw = horizonDetail?.top_accumulators?.[0]?.investor_group ||
    rec.topNetBuyer?.investorGroups?.[0];
  const leadGroup: SweetSpotItem["lead_group"] =
    groupRaw === "FOREIGN"
      ? "FOREIGN"
      : groupRaw === "GOVERNMENT"
      ? "GOVERNMENT"
      : "MIXED";

  const sellerCode = horizonDetail?.top_distributors?.[0]?.code || rec.topNetSeller?.code || "Pasar";
  const sellerVal = horizonDetail?.top_distributors?.[0]?.net_value || Number(rec.topNetSeller?.netValue) || 0;

  const verdict: SweetSpotItem["action_verdict"] =
    gapPct < -1.5
      ? "ACCUMULATE DIP"
      : chg >= 4.0 && gapPct > 2.5
      ? "BUY ON BREAKOUT"
      : "SWEET SPOT BUY";

  const sweetLow = Math.max(1, Math.round(Math.min(close, bandarCost) * 0.985));
  const sweetHigh = Math.max(sweetLow, Math.round(Math.max(close, bandarCost) * 1.005));
  const sl = Math.max(1, Math.round(Math.min(close, bandarCost) * 0.95));
  const tp1 = Math.round(close * 1.08);
  const tp2 = Math.round(close * 1.15);

  return {
    ticker,
    close,
    change_percent: Math.round(chg * 10) / 10,
    bandar_cost: Math.round(bandarCost * 10) / 10,
    gap_pct: gapPct,
    lead_accumulator: leadAccumulator,
    lead_group: leadGroup,
    counterparty_purity: `Lawan ${sellerCode} (${formatBillion(sellerVal)})`,
    action_verdict: verdict,
    sweet_zone: `${sweetLow.toLocaleString("id-ID")} - ${sweetHigh.toLocaleString("id-ID")}`,
    stop_loss: `${sl.toLocaleString("id-ID")} (Risk -5%)`,
    target_price: `${tp1.toLocaleString("id-ID")} - ${tp2.toLocaleString("id-ID")}`,
    why_brief:
      horizonDetail?.why_insight ||
      `Akumulasi bersih dipimpin ${buyerCode} dengan kekuatan beli ${Number(rec.accumulationStrengthPct ?? 0).toFixed(1)}% turnover dan aliran asing ${formatBillion(Number(rec.foreignNetValue) || 0)}.`,
  };
}

function buildTrapItem(
  rec: McpRankingRecord,
  retailBuyerMap: Map<string, string[]>,
  horizonDetail?: TickerBrokerDetail
): TrapItem {
  const ticker = String(rec.ticker || "");
  const close = horizonDetail?.close || Number(rec.close) || 0;
  const chg = horizonDetail?.change_percent ?? (Number(rec.changePercent) || 0);
  const sellerCode = String(horizonDetail?.top_distributors?.[0]?.code || rec.topNetSeller?.code || "SELLER");
  const sellerVal =
    horizonDetail?.top_distributors?.[0]?.net_value ??
    (Number(rec.topNetSeller?.netValue) || 0);
  const exitAvg =
    horizonDetail?.top_distributors?.[0]?.avg_price ||
    Number(rec.topNetSeller?.sellAvgPrice) ||
    close;

  const retailCodes = retailBuyerMap.get(ticker) || [];
  const topBuyerCode = horizonDetail?.top_accumulators?.[0]?.code || rec.topNetBuyer?.code || "";
  const retailBuyersLabel =
    retailCodes.length > 0
      ? `Ritel ${retailCodes.join(", ")} menampung jualan`
      : topBuyerCode
      ? `Ditampung ${topBuyerCode} (+${formatBillion(Number(rec.topNetBuyer?.netValue) || 0)})`
      : "Pasar menampung tekanan jual";

  const smartNet = horizonDetail?.net_value && horizonDetail.net_value < 0
    ? horizonDetail.net_value
    : Math.min(smartNetOf(rec), -Math.abs(Number(rec.topSellerNetValueTopN) || 0));

  return {
    ticker,
    close,
    change_percent: Math.round(chg * 10) / 10,
    smart_money_net: smartNet,
    smart_money_sellers: `${sellerCode} (${formatBillion(-Math.abs(sellerVal))})`,
    retail_net: Math.abs(Number(rec.localNetValue) || 0),
    retail_buyers: retailBuyersLabel,
    action_verdict: chg >= 0 ? "BULL TRAP / AVOID" : "HEAVY DISTRIBUTION",
    bandar_exit_avg: Math.round(exitAvg * 10) / 10,
    risk_warning: `Tekanan jual dominan ${sellerCode} (${Number(rec.distributionStrengthPct ?? 0).toFixed(1)}% turnover) di kisaran Rp ${Math.round(exitAvg).toLocaleString("id-ID")}. Hindari mengejar posisi.`,
  };
}

export function synthesizeLiveMarketOverview(params: {
  horizon: HorizonPeriod;
  availDates: string[];
  snapshotResp: McpMarketSnapshotResponse | null;
  quadrantResp: McpQuadrantResponse | null;
  accRankingResp: { records?: McpRankingRecord[] } | null;
  foreignSellResp: { records?: McpRankingRecord[] } | null;
  retailHistories: Record<"XL" | "XC" | "YP", McpBrokerHistoryRow[]>;
  enrichedDetails?: Record<string, TickerBrokerDetail>;
  now?: Date;
}): LiveMarketOverviewPayload {
  const {
    horizon,
    availDates,
    snapshotResp,
    quadrantResp,
    accRankingResp,
    foreignSellResp,
    retailHistories,
    enrichedDetails = {},
    now = new Date(),
  } = params;

  const { startDate, endDate } = computeHorizonWindow(availDates, horizon);
  const wibNow = getWibDateString(now);
  const isTodayPublished = endDate >= wibNow.dateStr;

  // Deduplicate ranking records cleanly
  const rankMap = new Map<string, McpRankingRecord>();
  for (const r of [...(accRankingResp?.records || []), ...(foreignSellResp?.records || [])]) {
    const t = String(r.ticker || "").toUpperCase().trim();
    if (t && !rankMap.has(t)) rankMap.set(t, r);
  }
  const allRanked = Array.from(rankMap.values());

  // Mutually exclusive Accumulation vs Distribution partition (never place same stock in both)
  const accCandidates = allRanked
    .filter((r) => {
      const topBuy = Number(r.topBuyerNetValueTopN) || 0;
      const topSell = Number(r.topSellerNetValueTopN) || 0;
      const score = Number(r.bandarSignal?.score) || 0;
      const smartNet = smartNetOf(r);
      return topBuy >= topSell && score > 0 && smartNet >= 0;
    })
    .sort((a, b) => (Number(b.topBuyerNetValueTopN) || 0) - (Number(a.topBuyerNetValueTopN) || 0));

  const accSet = new Set(accCandidates.map((r) => String(r.ticker || "")));

  const distCandidates = allRanked
    .filter((r) => {
      const t = String(r.ticker || "");
      if (accSet.has(t)) return false;
      const topBuy = Number(r.topBuyerNetValueTopN) || 0;
      const topSell = Number(r.topSellerNetValueTopN) || 0;
      const score = Number(r.bandarSignal?.score) || 0;
      const smartNet = smartNetOf(r);
      return topSell > topBuy || score < 0 || smartNet < -5_000_000_000;
    })
    .sort((a, b) => {
      const scoreDiff = (Number(a.bandarSignal?.score) || 0) - (Number(b.bandarSignal?.score) || 0);
      if (Math.abs(scoreDiff) >= 3) return scoreDiff; // Stronger negative signal first
      return (Number(b.topSellerNetValueTopN) || 0) - (Number(a.topSellerNetValueTopN) || 0);
    });

  const topAccumulations: AccumulationItem[] = accCandidates.slice(0, 10).map((r) => ({
    ticker: String(r.ticker),
    close: Number(r.close) || 0,
    change_percent: Math.round((Number(r.changePercent) || 0) * 10) / 10,
    top_buyers: `${r.topNetBuyer?.code || "INST"} (${Number(r.accumulationStrengthPct ?? 0).toFixed(0)}%)`,
    sum_buy: Math.round(Number(r.topBuyerNetValueTopN) || 0),
    smart_money_net: Math.round(smartNetOf(r)),
  }));

  const topDistributions: DistributionItem[] = distCandidates.slice(0, 10).map((r) => ({
    ticker: String(r.ticker),
    close: Number(r.close) || 0,
    change_percent: Math.round((Number(r.changePercent) || 0) * 10) / 10,
    top_sellers: `${r.topNetSeller?.code || "SELLER"} (${Number(r.distributionStrengthPct ?? 0).toFixed(0)}%)`,
    sum_sell: -Math.abs(Math.round(Number(r.topSellerNetValueTopN) || 0)),
    smart_money_net: Math.round(smartNetOf(r)),
  }));

  // Quadrant counts & stocks
  const qCounts: QuadrantCounts = quadrantResp?.summary ?? {
    markup_akumulasi: 0,
    markup_distribusi: 0,
    markdown_akumulasi: 0,
    markdown_distribusi: 0,
  };

  const quadrantStocks: Record<string, Map<string, QuadrantStockItem>> = {
    markup_akumulasi: new Map(),
    markup_distribusi: new Map(),
    markdown_akumulasi: new Map(),
    markdown_distribusi: new Map(),
  };

  // Seed quadrants from high-liquidity ranked stocks first, then quadrantResp sample records
  for (const r of allRanked) {
    const t = String(r.ticker || "").toUpperCase();
    if (!t) continue;
    const chg = Number(r.changePercent) || 0;
    const net = smartNetOf(r);
    const qKey = classifyFallbackQuadrant(chg, net);
    quadrantStocks[qKey].set(t, {
      ticker: t,
      close: Number(r.close) || 0,
      change_percent: Math.round(chg * 10) / 10,
      smart_money_net: Math.round(net),
    });
  }

  for (const qr of quadrantResp?.records || []) {
    const t = String(qr.ticker || "").toUpperCase();
    const qKey = String(qr.quadrant || "");
    if (!t || !quadrantStocks[qKey] || quadrantStocks[qKey].has(t)) continue;
    quadrantStocks[qKey].set(t, {
      ticker: t,
      close: Number(qr.close) || 0,
      change_percent: Math.round((Number(qr.changePercent) || 0) * 10) / 10,
      smart_money_net: Math.round(Number(qr.smartMoneyNet ?? qr.flowNetValue) || 0),
    });
  }

  const quadrantDefs: Array<{
    id: string;
    name: string;
    title: string;
    philosophy: string;
    color: "emerald" | "amber" | "sky" | "rose";
  }> = [
    {
      id: "markup_akumulasi",
      name: "[MA] Markup + Akumulasi",
      title: "BULL ACCUMULATION",
      philosophy: "Harga Naik & Smart Money Masuk (Institusi Agresif Membeli Saham)",
      color: "emerald",
    },
    {
      id: "markup_distribusi",
      name: "[MD] Markup + Distribusi",
      title: "BULL DISTRIBUTION (TRAP)",
      philosophy: "Harga Naik tapi Bandar Jual (Jebakan Ritel / Bull Trap)",
      color: "amber",
    },
    {
      id: "markdown_akumulasi",
      name: "[DA] Markdown + Akumulasi",
      title: "BEAR ACCUMULATION",
      philosophy: "Harga Turun tapi Diam-diam Diserap Institusi (Weakness Absorption)",
      color: "sky",
    },
    {
      id: "markdown_distribusi",
      name: "[DD] Markdown + Distribusi",
      title: "BEAR DISTRIBUTION",
      philosophy: "Harga Turun & Bandar Terus Buang Barang (Wajib Dihindari)",
      color: "rose",
    },
  ];

  const quadrantMaps: Record<string, QuadrantMapDetail> = {};
  for (const def of quadrantDefs) {
    const list = Array.from(quadrantStocks[def.id].values()).sort(
      (a, b) => Math.abs(b.smart_money_net) - Math.abs(a.smart_money_net)
    );
    const countVal = qCounts[def.id as keyof QuadrantCounts] || list.length;
    quadrantMaps[def.id] = {
      id: def.id,
      name: def.name,
      title: def.title,
      philosophy: def.philosophy,
      stocks_count: countVal,
      color: def.color,
      stocks: list,
    };
  }

  // Macro pulse across unique tracked market records
  const netByTicker = new Map<string, { foreign: number; gov: number; smart: number }>();
  for (const r of allRanked) {
    const t = String(r.ticker || "");
    netByTicker.set(t, {
      foreign: Number(r.foreignNetValue) || 0,
      gov: Number(r.governmentNetValue) || 0,
      smart: smartNetOf(r),
    });
  }
  for (const qr of quadrantResp?.records || []) {
    const t = String(qr.ticker || "");
    if (!t || netByTicker.has(t)) continue;
    const f = Number(qr.foreignNetValue) || 0;
    const g = Number(qr.governmentNetValue) || 0;
    netByTicker.set(t, { foreign: f, gov: g, smart: Number(qr.smartMoneyNet ?? (f + g)) || 0 });
  }

  let foreignTotal = 0;
  let govTotal = 0;
  let smartTotal = 0;
  for (const v of netByTicker.values()) {
    foreignTotal += v.foreign;
    govTotal += v.gov;
    smartTotal += v.smart;
  }

  // Retail footprints (XL, XC, YP) aggregated per ticker across active horizon window
  const retailFootprints: RetailPulseItem[] = (["XL", "XC", "YP"] as const).map((code) =>
    aggregateBrokerFootprint(code, retailHistories[code] || [])
  );
  const retailTotal = retailFootprints.reduce((sum, item) => sum + item.total_net, 0);

  const retailBuyerMap = new Map<string, string[]>();
  for (const fp of retailFootprints) {
    for (const b of fp.top_bought) {
      const list = retailBuyerMap.get(b.ticker) || [];
      if (!list.includes(fp.broker_code)) list.push(fp.broker_code);
      retailBuyerMap.set(b.ticker, list);
    }
  }

  const sweetSpots: SweetSpotItem[] = accCandidates
    .slice(0, 4)
    .map((r) => buildSweetSpotItem(r, enrichedDetails[String(r.ticker)]));

  const traps: TrapItem[] = distCandidates
    .slice(0, 3)
    .map((r) => buildTrapItem(r, retailBuyerMap, enrichedDetails[String(r.ticker)]));

  const accLeadersText = accCandidates.slice(0, 2).map((r) => r.ticker).join(", ") || "Top Likuid";
  const distLeadersText = distCandidates.slice(0, 2).map((r) => r.ticker).join(", ") || "Big Caps";
  const summarySentence = `Sesi bursa s/d ${formatShortDateID(endDate)}: aliran asing bersih terpantau ${formatBillion(foreignTotal)} dengan akumulasi memimpin di ${accLeadersText}, sementara tekanan distribusi terjadi pada ${distLeadersText}.`;

  const totalTurnover =
    Number(snapshotResp?.totalTradeValue) ||
    allRanked.reduce((s, r) => s + (Number(r.turnoverValue) || 0), 0);

  const totalClassified =
    Number(quadrantResp?.totalTickers) ||
    qCounts.markup_akumulasi +
      qCounts.markup_distribusi +
      qCounts.markdown_akumulasi +
      qCounts.markdown_distribusi;

  const rangeLabel = formatDateRangeID(startDate, endDate);
  const statusMsg = isTodayPublished
    ? `Data live tersinkron hingga ${formatShortDateID(endDate)}.`
    : wibNow.isWeekday && wibNow.hourWib >= 16
    ? `Data bursa terbaru: ${formatShortDateID(endDate)} (EOD ${formatShortDateID(wibNow.dateStr)} belum rilis di feed Max MCP).`
    : `Data bursa terbaru: ${formatShortDateID(endDate)}.`;

  return {
    snapshot_date: endDate,
    horizon,
    horizon_start_date: startDate,
    data_freshness: {
      latest_date: endDate,
      today_wib: wibNow.dateStr,
      is_today_published: isTodayPublished,
      source: "max-mcp-live",
      synced_at: now.toISOString(),
      message: statusMsg,
    },
    market_summary: {
      date: endDate,
      quadrant_counts: qCounts,
      total_classified: totalClassified,
      smart_money_net: Math.round(smartTotal),
      total_turnover: Math.round(totalTurnover),
    },
    daily_insight: {
      horizon,
      horizon_label: HORIZON_LABELS[horizon],
      date_range: `${rangeLabel} (${horizon})`,
      macro_pulse: {
        foreign_net: Math.round(foreignTotal),
        government_net: Math.round(govTotal),
        retail_net: Math.round(retailTotal),
        summary_sentence: summarySentence,
      },
      sweet_spots: sweetSpots,
      traps,
      retail_footprints: retailFootprints,
    },
    top_accumulations: topAccumulations,
    top_distributions: topDistributions,
    quadrant_maps: quadrantMaps,
  };
}
