/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTickerDetail, type TickerDetailPayload } from "@/lib/screener-server";
import { getCorporateCalendar, type CalendarEventItem } from "@/lib/calendar-service";
import {
  fetchTickerAccumZonesUpstream,
  fetchTickerBrokerSummaryUpstream,
  fetchTickerIntelUpstream,
  fetchTickerNewsUpstream,
  fetchTickerOwnershipUpstream,
} from "@/lib/idx-upstream";
import { callMaxTradeMcp } from "@/lib/mcp-broker-flow";
import {
  buildRecommendationSection,
  buildTechnicalBestPlan,
  buildTechnicalScenarios,
  normalizeWindowKey,
  sanitizeUpstreamCopy,
  stripMaxV7Deep,
  type BestTradingPlan,
  type RecommendationSection,
  type TechnicalScenario,
} from "@/lib/ticker-plan-builder";
import { formatPlainYearMonthID, formatWibTimestamp } from "@/lib/temporal-dates";
import { SIGNAL_DISPLAY_META } from "@/lib/screener-types";

export type FacetKey =
  | "rekomendasi"
  | "bandar"
  | "broker"
  | "analisisTeknikal"
  | "proIntel"
  | "ownership"
  | "aksiKorporasi"
  | "news";

export interface FacetProvenance {
  status: "ok" | "fallback" | "partial" | "unavailable";
  provenance: "observed" | "derived" | "proxy" | "mixed";
  sourceLabel: string;
  asOfDate: string | null;
  cachedAt: string | null;
  stale: boolean;
  note?: string;
}

export interface BandarWindowSummary {
  key: "1D" | "3D" | "5D" | "30D";
  tradingDays: number;
  verdict: string;
  tone: "bullish" | "bearish" | "caution" | "neutral";
  score: number;
  confidencePct: number;
  concentrationPct: number;
  consistencyPct: number;
  smartNet: number;
  smartPctOfValue: number;
  foreignNet: number;
  governmentNet: number;
  localNet: number;
  retailProxy: number;
  reasons: string[];
  topBuyers: { code: string; group: string; netValue: number; pctOfTicker: number; consistency: number; status: string }[];
  topSellers: { code: string; group: string; netValue: number; pctOfTicker: number; consistency: number; status: string }[];
  dailyTimeline: {
    date: string;
    close: number;
    changePct: number;
    smartMoneyNet: number;
    foreignNet: number;
    governmentNet: number;
    state: string;
    topBuyerCode?: string;
    topSellerCode?: string;
  }[];
}

export interface BrokerZoneBand {
  side: "ACCUMULATION" | "DISTRIBUTION";
  avg: number;
  low: number;
  high: number;
  strength: string;
  activeBrokers: number;
  totalNetValue: number;
  foreign: number;
  government: number;
  localInstitutional: number;
  brokers: { code: string; avgPrice: number; netValue: number; days: number; groups: string[] }[];
}

export interface BrokerSection {
  verdict: string;
  tone: "bullish" | "bearish" | "caution" | "neutral";
  dailySignal: string;
  day30Signal: string;
  headline: string;
  note: string;
  confidencePct: number;
  dailyBuyers: { code: string; netValue: number; avgPrice?: number; pct?: number; consistency?: number }[];
  dailySellers: { code: string; netValue: number; avgPrice?: number; pct?: number; consistency?: number }[];
  topAccumulators30d: { code: string; group: string; netValue: number; activeDays: number; consistency: number; status: string }[];
  topDistributors30d: { code: string; group: string; netValue: number; activeDays: number; consistency: number; status: string }[];
  zones15d: {
    periodDays: number;
    smartMoneyPosition: string;
    totalNetFlow: number;
    foreign: number;
    government: number;
    localInstitutional: number;
    accumulation: BrokerZoneBand | null;
    distribution: BrokerZoneBand | null;
  };
  pressure: {
    latestLabel: string;
    verdict: string;
    accumulationDays: number;
    distributionDays: number;
    absorptionDays: number;
    churnDays: number;
    avgAccumulationScore: number;
    avgDistributionScore: number;
    avgAbsorptionScore: number;
  };
  groupBattle: {
    asingNet: number;
    lokalNet: number;
    bumnNet: number;
    dominantGroup: string;
  };
  rotation: {
    verdict: string;
    notable: {
      brokerCode: string;
      rotationLabel: string;
      fromStatus: string;
      toStatus: string;
      deltaNetValue: number;
      toConsistencyScore: number;
    }[];
  };
  fingerprint: {
    actorClass: string;
    topBuyerCode: string;
    topSellerCode: string;
    notes: string[];
  };
}

export interface OwnershipSection {
  latestPeriod: string | null;
  latestPeriodDisplay: string;
  previousPeriod: string | null;
  holdersDate: string | null;
  periodsAvailable: string[];
  foreignPct: number | null;
  foreignChange: number | null;
  foreignTrend: string;
  holders: {
    investorName: string;
    investorType: string;
    localForeign: "L" | "F" | string;
    totalShares: number;
    percentage: number;
    prevPercentage: number | null;
    changePct: number | null;
    history: Record<string, { percentage: number; shares: number }>;
  }[];
  typeBreakdown: { code: string; count: number; pct: number }[];
}

export interface NewsItem {
  title: string;
  source: string;
  link: string;
  pubDateRaw: string;
  pubDateDisplay: string;
}

export interface TickerIntelligencePayload {
  ticker: string;
  companyName: string | null;
  sector: string;
  sectorSlug: string;
  generatedAt: string;
  technicalDetail: TickerDetailPayload;
  sources: Record<FacetKey, FacetProvenance>;
  recommendation: RecommendationSection;
  bandar: {
    verdict: string;
    tone: "bullish" | "bearish" | "caution" | "neutral";
    score: number;
    score100: number;
    confidencePct: number;
    concentrationPct: number;
    concentrationLabel: string;
    consistencyPct: number;
    primaryWindow: "1D" | "3D" | "5D" | "30D";
    conflictWarning: string | null;
    windows: Record<"1D" | "3D" | "5D" | "30D", BandarWindowSummary>;
    evidenceHeadline: string;
    evidenceDetail: string;
    alerts: { title: string; detail: string; tone: string; type: string }[];
  };
  broker: BrokerSection;
  technical: {
    momentumStrip: {
      activeSignalLabel: string;
      activeSignalTone: "bullish" | "caution" | "neutral";
      regime: string;
      regimeAction: string;
      rsi14: number | null;
      rsiZone: string;
      adx14: number | null;
      adxStrength: string;
      plusDi: number | null;
      minusDi: number | null;
      trendShort: "UP" | "DOWN";
      trendMedium: "UP" | "DOWN";
      trendLong: "UP" | "DOWN";
      volumeRatio: number | null;
      volumeSignal: string;
    };
    bestPlan: BestTradingPlan;
    emaStack: {
      ema21: number | null;
      ema50: number | null;
      ema200: number | null;
      alignmentLabel: string;
      priceVsEma: string;
    };
    scenarios: TechnicalScenario[];
  };
  proIntel: {
    conclusionTitle: string;
    conclusionDetail: string;
    conclusionTone: "bullish" | "bearish" | "caution" | "neutral";
    whyMoved: {
      title: string;
      verdict: string;
      changePct: number;
      volumeRatio: number | null;
      narrative: string;
      drivers: string[];
      source: string;
    };
    flowStory: {
      net1d: number;
      net5d: number;
      net30d: number;
      summary: string;
      divergenceNote: string;
    };
    riskRadar: {
      verdict: string;
      flags: string[];
      caveat: string;
    };
    bandarAlerts: { title: string; detail: string; tone: string; type: string }[];
    s1Confluence: {
      status: string;
      position: string;
      distancePct: number | null;
      weeklyS1: number | null;
      monthlyS1: number | null;
      avgS1: number | null;
      summary: string;
    } | null;
    retailProxy: {
      label: string;
      netValue: number;
      source: string;
    } | null;
    dataConsistency: {
      coverageLabel: string;
      warnings: string[];
    };
  };
  ownership: OwnershipSection;
  corporateActions: {
    upcomingCount: number;
    stale: boolean;
    events: CalendarEventItem[];
  };
  news: NewsItem[];
}

function asTone(raw: unknown): "bullish" | "bearish" | "caution" | "neutral" {
  const s = String(raw || "").toLowerCase();
  if (s === "bullish" || s.includes("accum")) return "bullish";
  if (s === "bearish" || s.includes("dist")) return "bearish";
  if (s === "caution" || s.includes("mixed") || s.includes("watch") || s.includes("rot")) return "caution";
  return "neutral";
}

function sanitizeHttpUrl(raw: unknown): string | null {
  if (!raw) return null;
  try {
    const u = new URL(String(raw));
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

function mapZoneSide(raw: any, side: "ACCUMULATION" | "DISTRIBUTION"): BrokerZoneBand | null {
  if (!raw || typeof raw !== "object") return null;
  const fb = raw.flow_breakdown || {};
  return {
    side,
    avg: Number(raw.avg || 0),
    low: Number(raw.low || 0),
    high: Number(raw.high || 0),
    strength: String(raw.strength || "MODERATE"),
    activeBrokers: Number(raw.active_brokers || 0),
    totalNetValue: Number(raw.total_net_value || 0),
    foreign: Number(fb.foreign || 0),
    government: Number(fb.government || 0),
    localInstitutional: Number(fb.local_institutional || 0),
    brokers: Array.isArray(raw.brokers)
      ? raw.brokers.slice(0, 8).map((b: any) => ({
          code: String(b.code || b.name || "-"),
          avgPrice: Number(b.avg_price || 0),
          netValue: Number(b.net_value || 0),
          days: Number(b.days || 0),
          groups: Array.isArray(b.investor_groups) ? b.investor_groups.map(String) : [],
        }))
      : [],
  };
}

function mapBandarWindow(key: "1D" | "3D" | "5D" | "30D", raw: any): BandarWindowSummary {
  const w = raw && typeof raw === "object" ? raw : {};
  const cr = w.concentration_risk || {};
  return {
    key,
    tradingDays: Number(w.trading_days || (key === "1D" ? 1 : key === "3D" ? 3 : key === "5D" ? 5 : 30)),
    verdict: sanitizeUpstreamCopy(String(w.verdict || "NETRAL")),
    tone: asTone(w.tone),
    score: Number(w.score || 0),
    confidencePct: Number(w.confidence || 0),
    concentrationPct: Number(w.concentration_pct ?? cr.pct ?? 0),
    consistencyPct: Number(w.consistency_pct || 0),
    smartNet: Number(w.smart_net || 0),
    smartPctOfValue: Number(w.smart_pct_of_value || 0),
    foreignNet: Number(w.foreign_net || 0),
    governmentNet: Number(w.government_net || 0),
    localNet: Number(w.local_net || 0),
    retailProxy: Number(w.retail_proxy || 0),
    reasons: Array.isArray(w.reasons) ? w.reasons.map((r: unknown) => sanitizeUpstreamCopy(String(r))) : [],
    topBuyers: Array.isArray(w.top_buyers)
      ? w.top_buyers.slice(0, 6).map((b: any) => ({
          code: String(b.code || b.name || "-"),
          group: String(b.group || "LOKAL"),
          netValue: Number(b.net_value || 0),
          pctOfTicker: Number(b.net_pct_of_ticker || 0),
          consistency: Number(b.consistency || 0),
          status: String(b.status || "NEUTRAL"),
        }))
      : [],
    topSellers: Array.isArray(w.top_sellers)
      ? w.top_sellers.slice(0, 6).map((s: any) => ({
          code: String(s.code || s.name || "-"),
          group: String(s.group || "LOKAL"),
          netValue: Number(s.net_value || 0),
          pctOfTicker: Number(s.net_pct_of_ticker || 0),
          consistency: Number(s.consistency || 0),
          status: String(s.status || "NEUTRAL"),
        }))
      : [],
    dailyTimeline: Array.isArray(w.daily_timeline)
      ? w.daily_timeline.slice(-15).map((d: any) => ({
          date: String(d.date || ""),
          close: Number(d.close || 0),
          changePct: Number(d.changePct || 0),
          smartMoneyNet: Number(d.smartMoneyNet || 0),
          foreignNet: Number(d.foreignNetValue || 0),
          governmentNet: Number(d.governmentNetValue || 0),
          state: String(d.priceFlowState || ""),
          topBuyerCode: d.topBuyer?.code ? String(d.topBuyer.code) : undefined,
          topSellerCode: d.topSeller?.code ? String(d.topSeller.code) : undefined,
        }))
      : [],
  };
}

/**
 * Assemble complete 8-tab Ticker Intelligence Console payload with bounded parallel calls,
 * explicit provenance tracking, MCP fallbacks, and zero MaxV7/legacy-screener leakage.
 */
export async function getTickerIntelligence(tickerRaw: string): Promise<TickerIntelligencePayload | null> {
  const ticker = tickerRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!ticker || ticker.length < 2) return null;

  const detail = await getTickerDetail(ticker);
  if (!detail) return null;

  const [upIntelRes, upAccumRes, upBsumRes, upOwnRes, corpRes, upNewsRes] = await Promise.all([
    fetchTickerIntelUpstream(ticker),
    fetchTickerAccumZonesUpstream(ticker),
    fetchTickerBrokerSummaryUpstream(ticker),
    fetchTickerOwnershipUpstream(ticker),
    getCorporateCalendar({ ticker, upcomingOnly: false, limit: 30 }),
    fetchTickerNewsUpstream(ticker),
  ]);

  const rawIntelPayload = upIntelRes.ok && upIntelRes.data ? stripMaxV7Deep(upIntelRes.data) : null;
  const rawAccum = upAccumRes.ok && upAccumRes.data ? stripMaxV7Deep(upAccumRes.data) : null;
  const rawBsum = upBsumRes.ok && upBsumRes.data ? stripMaxV7Deep(upBsumRes.data) : null;
  const rawNews = upNewsRes.ok && upNewsRes.data ? upNewsRes.data : null;

  // Ownership fallback via max-trade MCP if upstream ownership endpoint fails
  let rawOwn = upOwnRes.ok && upOwnRes.data && upOwnRes.data.status === "ok" ? upOwnRes.data : null;
  let ownershipSource: FacetProvenance = {
    status: rawOwn ? (upOwnRes.staleFromCache ? "partial" : "ok") : "unavailable",
    provenance: "observed",
    sourceLabel: "KSEI via IDX Upstream",
    asOfDate: rawOwn?.holders_date ? String(rawOwn.holders_date) : null,
    cachedAt: upOwnRes.fetchedAt,
    stale: upOwnRes.staleFromCache,
  };

  if (!rawOwn) {
    try {
      const mcpOwn = (await callMaxTradeMcp("get_ownership_holders", { ticker }, 8_000)) as any;
      if (mcpOwn && Array.isArray(mcpOwn.holders ?? mcpOwn.records)) {
        const list = (mcpOwn.holders ?? mcpOwn.records) as any[];
        rawOwn = {
          status: "ok",
          latest_period: mcpOwn.period ?? null,
          previous_period: null,
          holders_date: mcpOwn.asOfDate ?? mcpOwn.date ?? null,
          periods_available: mcpOwn.period ? [String(mcpOwn.period)] : [],
          foreign_pct: mcpOwn.foreignPct ?? null,
          foreign_change: mcpOwn.foreignChange ?? null,
          foreign_trend: "FLAT",
          holders: list.map((h) => ({
            investor_name: h.investorName ?? h.investor_name ?? "-",
            investor_type: h.investorType ?? h.investor_type ?? "-",
            local_foreign: h.localForeign ?? h.local_foreign ?? "-",
            total_shares: Number(h.shares ?? h.total_shares ?? 0),
            percentage: Number(h.percentage ?? 0),
            prev_percentage: h.prevPercentage ?? null,
            change_pct: h.changePct ?? null,
          })),
          holder_trend: {},
          type_breakdown: {},
        };
        ownershipSource = {
          status: "fallback",
          provenance: "observed",
          sourceLabel: "max-trade MCP Ownership",
          asOfDate: rawOwn.holders_date,
          cachedAt: new Date().toISOString(),
          stale: true,
          note: "Upstream KSEI matrix tidak terjangkau; menampilkan pemegang saham periode terbaru via max-trade MCP.",
        };
      }
    } catch {
      ownershipSource.note = "Data kepemilikan KSEI sedang tidak tersedia.";
    }
  }

  // Build technical metrics locally
  const bars = detail.bars;
  const lastBar = bars[bars.length - 1];
  const recentLow = bars.slice(-20).reduce((m, b) => (b.low < m ? b.low : m), bars[0].low);
  const avgVol20 =
    bars.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / Math.max(1, Math.min(20, bars.length - 1));
  const lastVolRatio = avgVol20 > 0 ? Math.round((lastBar.volume / avgVol20) * 100) / 100 : null;
  const lastE21 = detail.ema21[detail.ema21.length - 1] ?? null;
  const lastE50 = detail.ema50[detail.ema50.length - 1] ?? null;
  const lastE200 = detail.ema200[detail.ema200.length - 1] ?? null;
  const lastRsi = detail.rsi14[detail.rsi14.length - 1] ?? null;
  const lastAdx = detail.adx14[detail.adx14.length - 1] ?? null;
  const lastFractal = detail.fractals[detail.fractals.length - 1] ?? null;

  const intelNode = rawIntelPayload?.intelligence || {};
  const overviewNode = rawIntelPayload?.overview || {};
  const bandarRaw = intelNode.bandar || {};
  const brokerRaw = intelNode.broker || {};
  const proRaw = intelNode.pro || {};
  const intelMeta = intelNode.intel || {};
  const evidenceTabs = intelMeta?.evidence?.tabs || {};
  const rawWindows = bandarRaw.windows || {};

  const win1d = mapBandarWindow("1D", rawWindows["1H"] || rawWindows["1D"]);
  const win3d = mapBandarWindow("3D", rawWindows["3H"] || rawWindows["3D"]);
  const win5d = mapBandarWindow("5D", rawWindows["5H"] || rawWindows["5D"]);
  const win30d = mapBandarWindow("30D", rawWindows["30H"] || rawWindows["30D"]);

  // Local fallback values when upstream windows are missing
  if (!upIntelRes.ok) {
    win1d.smartNet = detail.smart_money.foreign_net_1d ?? 0;
    win1d.foreignNet = detail.smart_money.foreign_net_1d ?? 0;
    win1d.verdict = detail.smart_money.broksum_label;
    win1d.confidencePct = detail.smart_money.confidence_pct;
    win5d.smartNet = detail.smart_money.foreign_net_5d ?? 0;
  }

  const bandarPrimaryWindow = normalizeWindowKey(String(bandarRaw.primary_window || "5H"));
  const bandarVerdict = sanitizeUpstreamCopy(
    String(bandarRaw.verdict || detail.smart_money.broksum_label || "NETRAL")
  );
  const bandarTone = asTone(bandarRaw.tone || (detail.smart_money.score >= 2 ? "bullish" : "neutral"));
  const bandarConflict =
    Math.sign(win5d.smartNet) !== 0 &&
    Math.sign(win30d.smartNet) !== 0 &&
    Math.sign(win5d.smartNet) !== Math.sign(win30d.smartNet)
      ? `Divergensi horizon: 5D net ${win5d.smartNet >= 0 ? "buy" : "sell"} vs 30D masih ${win30d.smartNet >= 0 ? "akumulasi" : "distribusi"}.`
      : null;

  const accumZonesParsed = {
    periodDays: Number(rawAccum?.period_days || 15),
    smartMoneyPosition: String(rawAccum?.smart_money_position || "NEUTRAL"),
    totalNetFlow: Number(rawAccum?.total_net_flow || 0),
    foreign: Number(rawAccum?.smart_money_flow?.foreign || 0),
    government: Number(rawAccum?.smart_money_flow?.government || 0),
    localInstitutional: Number(rawAccum?.smart_money_flow?.local_institutional || 0),
    accumulation: mapZoneSide(rawAccum?.accumulation || brokerRaw?.absorption?.accumulation, "ACCUMULATION"),
    distribution: mapZoneSide(rawAccum?.distribution || brokerRaw?.absorption?.distribution, "DISTRIBUTION"),
  };

  const bsumPressure = rawBsum?.pressure || {};
  const bsumRot = rawBsum?.rotation || {};
  const actorMap = rawBsum?.actorMap || {};

  const topAccum30d = Array.isArray(brokerRaw.top_accumulators)
    ? brokerRaw.top_accumulators.slice(0, 8).map((r: any) => ({
        code: String(r.code || "-"),
        group: String(r.group || "LOKAL"),
        netValue: Number(r.net_value || r.netValue || 0),
        activeDays: Number(r.active_days || r.activeDays || 0),
        consistency: Number(r.consistency || 0),
        status: String(r.status || "ACCUMULATION"),
      }))
    : detail.smart_money.top_buyers.map((b) => ({
        code: b.broker,
        group: "LOKAL",
        netValue: b.buyValue,
        activeDays: 1,
        consistency: 0,
        status: "BUY",
      }));

  const topDist30d = Array.isArray(brokerRaw.top_distributors)
    ? brokerRaw.top_distributors.slice(0, 8).map((r: any) => ({
        code: String(r.code || "-"),
        group: String(r.group || "ASING"),
        netValue: Number(r.net_value || r.netValue || 0),
        activeDays: Number(r.active_days || r.activeDays || 0),
        consistency: Number(r.consistency || 0),
        status: String(r.status || "DISTRIBUTION"),
      }))
    : detail.smart_money.top_sellers.map((s) => ({
        code: s.broker,
        group: "ASING",
        netValue: -Math.abs(s.sellValue),
        activeDays: 1,
        consistency: 0,
        status: "SELL",
      }));

  const asingNet = Number(actorMap?.ASING?.netValue ?? win5d.foreignNet ?? 0);
  const bumnNet = Number(actorMap?.BUMN?.netValue ?? actorMap?.GOVERNMENT?.netValue ?? win5d.governmentNet ?? 0);
  const lokalNet = Number(actorMap?.LOKAL?.netValue ?? win5d.localNet ?? 0);
  const maxAbsGroup = Math.max(Math.abs(asingNet), Math.abs(bumnNet), Math.abs(lokalNet));
  const dominantGroup =
    maxAbsGroup === 0
      ? "BERIMBANG"
      : maxAbsGroup === Math.abs(asingNet)
        ? `ASING (${asingNet >= 0 ? "BUY" : "SELL"})`
        : maxAbsGroup === Math.abs(bumnNet)
          ? `BUMN/GOV (${bumnNet >= 0 ? "BUY" : "SELL"})`
          : `LOKAL (${lokalNet >= 0 ? "BUY" : "SELL"})`;

  const brokerEvidenceTab = evidenceTabs.broker || {};
  const bsumConclusion = rawBsum?.conclusion || {};
  const brokerVerdictText = sanitizeUpstreamCopy(
    String(
      bsumConclusion.signalLabel === "ACCUMULATION"
        ? "AKUMULASI BROKER"
        : bsumConclusion.signalLabel === "DISTRIBUTION"
          ? "DISTRIBUSI BROKER"
          : detail.smart_money.broksum_label
    )
  );
  const brokerSection: BrokerSection = {
    verdict: brokerVerdictText || "MIXED / NETRAL",
    tone: asTone(brokerEvidenceTab.tone || bsumConclusion.signalLabel),
    dailySignal: String(bsumPressure.latestLabel || detail.smart_money.broksum_label || "NETRAL"),
    day30Signal: topDist30d[0] && Math.abs(topDist30d[0].netValue) > Math.abs(topAccum30d[0]?.netValue || 0) * 1.25 ? "DISTRIBUSI 30D" : topAccum30d[0] ? "AKUMULASI 30D" : "NETRAL 30D",
    headline: sanitizeUpstreamCopy(String(bsumConclusion.headline || brokerEvidenceTab.headline || "Perbandingan tekanan beli vs jual broker.")),
    note: sanitizeUpstreamCopy(String(bsumConclusion.reasons?.[0] || brokerEvidenceTab.detail || "")),
    confidencePct: Number(bsumConclusion.confidence ?? detail.smart_money.confidence_pct ?? 0),
    dailyBuyers: Array.isArray(brokerEvidenceTab.dailyBuyers)
      ? brokerEvidenceTab.dailyBuyers.slice(0, 6).map((b: any) => ({
          code: String(b.code || "-"),
          netValue: Number(b.netValue || 0),
          avgPrice: b.avgPrice ? Number(b.avgPrice) : undefined,
        }))
      : detail.smart_money.top_buyers.map((b) => ({
          code: b.broker,
          netValue: b.buyValue,
          avgPrice: b.avgPrice,
        })),
    dailySellers: Array.isArray(brokerEvidenceTab.dailySellers)
      ? brokerEvidenceTab.dailySellers.slice(0, 6).map((s: any) => ({
          code: String(s.code || "-"),
          netValue: Number(s.netValue || 0),
          avgPrice: s.avgPrice ? Number(s.avgPrice) : undefined,
        }))
      : detail.smart_money.top_sellers.map((s) => ({
          code: s.broker,
          netValue: -Math.abs(s.sellValue),
          avgPrice: s.avgPrice,
        })),
    topAccumulators30d: topAccum30d,
    topDistributors30d: topDist30d,
    zones15d: accumZonesParsed,
    pressure: {
      latestLabel: String(bsumPressure.latestLabel || "-"),
      verdict: String(bsumPressure.verdict || "-"),
      accumulationDays: Number(bsumPressure.accumulationDays || 0),
      distributionDays: Number(bsumPressure.distributionDays || 0),
      absorptionDays: Number(bsumPressure.absorptionDays || 0),
      churnDays: Number(bsumPressure.churnDays || 0),
      avgAccumulationScore: Number(bsumPressure.avgAccumulationScore || 0),
      avgDistributionScore: Number(bsumPressure.avgDistributionScore || 0),
      avgAbsorptionScore: Number(bsumPressure.avgAbsorptionScore || 0),
    },
    groupBattle: {
      asingNet,
      lokalNet,
      bumnNet,
      dominantGroup,
    },
    rotation: {
      verdict: String(bsumRot.verdict || "-"),
      notable: Array.isArray(bsumRot.notable)
        ? bsumRot.notable.slice(0, 8).map((r: any) => ({
            brokerCode: String(r.brokerCode || "-"),
            rotationLabel: String(r.rotationLabel || "-"),
            fromStatus: String(r.fromStatus || "-"),
            toStatus: String(r.toStatus || "-"),
            deltaNetValue: Number(r.deltaNetValue || 0),
            toConsistencyScore: Number(r.toConsistencyScore || 0),
          }))
        : [],
    },
    fingerprint: {
      actorClass: String(brokerRaw?.fingerprint?.style || bsumConclusion.label || "Campuran Institusi & Ritel"),
      topBuyerCode: topAccum30d[0]?.code || detail.smart_money.top_buyers[0]?.broker || "-",
      topSellerCode: topDist30d[0]?.code || detail.smart_money.top_sellers[0]?.broker || "-",
      notes: Array.isArray(brokerRaw.notes)
        ? brokerRaw.notes.map((n: unknown) => sanitizeUpstreamCopy(String(n))).filter(Boolean)
        : Array.isArray(bsumConclusion.reasons)
          ? bsumConclusion.reasons.map((n: unknown) => sanitizeUpstreamCopy(String(n))).filter(Boolean)
          : [],
    },
  };

  const bestPlan = buildTechnicalBestPlan({
    close: detail.close,
    recentLow,
    ema21: lastE21,
    ema50: lastE50,
    ema200: lastE200,
    pivots: detail.pivots,
    fractalCeiling: lastFractal?.ceiling ?? null,
    fractalFloor: lastFractal?.floor ?? null,
    fibonacci: detail.fibonacci,
    regime: detail.regime,
    smartMoneyScore: detail.smart_money.score,
    bandar5dNet: win5d.smartNet || detail.smart_money.foreign_net_5d,
    bandar30dNet: win30d.smartNet,
    accumZone: accumZonesParsed.accumulation,
    volumeRatio: lastVolRatio,
  });

  const recommendation = buildRecommendationSection({
    ticker,
    close: detail.close,
    changePct: detail.change_pct,
    regime: detail.regime,
    regimeAction: detail.regime_action,
    smartMoneyScore: detail.smart_money.score,
    smartMoneyLabel: detail.smart_money.label,
    signals: detail.signals,
    bestPlan,
    bandar: {
      verdict: bandarVerdict,
      tone: bandarTone,
      confidencePct: Number(bandarRaw.confidence ?? detail.smart_money.confidence_pct ?? 0),
      net1d: win1d.smartNet || detail.smart_money.foreign_net_1d,
      net5d: win5d.smartNet || detail.smart_money.foreign_net_5d,
      net30d: win30d.smartNet,
      topBuyerSummary: topAccum30d[0] ? `Top buyer ${topAccum30d[0].code}` : undefined,
    },
    broker: {
      verdict: brokerSection.verdict,
      tone: brokerSection.tone,
      note: brokerSection.headline,
    },
    pivots: detail.pivots,
    ema21: lastE21,
    adxLatest: lastAdx ?? null,
    volumeRatio: lastVolRatio,
    upstreamRecEvidence: evidenceTabs.recommendation || null,
  });

  const activeSig = detail.signals[0] ?? null;
  const rsiZone =
    lastRsi === null ? "N/A" : lastRsi >= 70 ? "OVERBOUGHT" : lastRsi <= 30 ? "OVERSOLD" : "NEUTRAL";
  const emaAlign =
    lastE21 && lastE50 && lastE200
      ? detail.close > lastE21 && lastE21 > lastE50 && lastE50 > lastE200
        ? "BULLISH STACK"
        : detail.close < lastE21 && lastE21 < lastE50
          ? "BEARISH ALIGNMENT"
          : "MIXED / TRANSISI"
      : "PARSIAL";

  const ownershipParsed = rawOwn || {};
  const holderTrendMap = (ownershipParsed.holder_trend && typeof ownershipParsed.holder_trend === "object"
    ? ownershipParsed.holder_trend
    : {}) as Record<string, any[]>;

  const ownershipSection: OwnershipSection = {
    latestPeriod: ownershipParsed.latest_period ? String(ownershipParsed.latest_period) : null,
    latestPeriodDisplay: formatPlainYearMonthID(ownershipParsed.latest_period),
    previousPeriod: ownershipParsed.previous_period ? String(ownershipParsed.previous_period) : null,
    holdersDate: ownershipParsed.holders_date ? String(ownershipParsed.holders_date) : null,
    periodsAvailable: Array.isArray(ownershipParsed.periods_available)
      ? ownershipParsed.periods_available.map(String)
      : [],
    foreignPct: ownershipParsed.foreign_pct !== undefined && ownershipParsed.foreign_pct !== null ? Number(ownershipParsed.foreign_pct) : null,
    foreignChange:
      ownershipParsed.foreign_change !== undefined && ownershipParsed.foreign_change !== null
        ? Number(ownershipParsed.foreign_change)
        : null,
    foreignTrend: String(ownershipParsed.foreign_trend || "FLAT"),
    holders: Array.isArray(ownershipParsed.holders)
      ? ownershipParsed.holders.map((h: any) => {
          const name = String(h.investor_name || "-");
          const trendArr = Array.isArray(holderTrendMap[name]) ? holderTrendMap[name] : [];
          const history: Record<string, { percentage: number; shares: number }> = {};
          for (const pt of trendArr) {
            if (pt?.period) {
              history[String(pt.period)] = {
                percentage: Number(pt.percentage || 0),
                shares: Number(pt.shares || 0),
              };
            }
          }
          return {
            investorName: name,
            investorType: String(h.investor_type || "-"),
            localForeign: String(h.local_foreign || "-"),
            totalShares: Number(h.total_shares || 0),
            percentage: Number(h.percentage || 0),
            prevPercentage: h.prev_percentage !== null && h.prev_percentage !== undefined ? Number(h.prev_percentage) : null,
            changePct: h.change_pct !== null && h.change_pct !== undefined ? Number(h.change_pct) : null,
            history,
          };
        })
      : [],
    typeBreakdown:
      ownershipParsed.type_breakdown && typeof ownershipParsed.type_breakdown === "object"
        ? Object.entries(ownershipParsed.type_breakdown as Record<string, any>).map(([code, v]) => ({
            code,
            count: Number(v?.count || 0),
            pct: Number(v?.pct || 0),
          }))
        : [],
  };

  const newsItems: NewsItem[] = Array.isArray(rawNews?.items)
    ? rawNews.items
        .map((n: any): NewsItem | null => {
          const safeLink = sanitizeHttpUrl(n?.link);
          if (!safeLink || !n?.title) return null;
          return {
            title: sanitizeUpstreamCopy(String(n.title)),
            source: String(n.source || "Berita Pasar"),
            link: safeLink,
            pubDateRaw: String(n.pubDate || ""),
            pubDateDisplay: formatWibTimestamp(n.pubDate),
          };
        })
        .filter((x): x is NewsItem => Boolean(x))
    : [];

  const upWhy = proRaw.why_moved || {};
  const proIntelSection: TickerIntelligencePayload["proIntel"] = {
    conclusionTitle: recommendation.verdict,
    conclusionDetail: recommendation.headline,
    conclusionTone: recommendation.tone,
    whyMoved: {
      title: sanitizeUpstreamCopy(String(upWhy.title || `Pergerakan Harga ${ticker}`)),
      verdict: sanitizeUpstreamCopy(String(upWhy.verdict || detail.smart_money.broksum_label || detail.regime)),
      changePct: detail.change_pct,
      volumeRatio: lastVolRatio,
      narrative: sanitizeUpstreamCopy(
        String(
          upWhy.narrative ||
            `${ticker} ditutup ${detail.change_pct >= 0 ? "naik" : "turun"} ${Math.abs(detail.change_pct).toFixed(2)}% pada ${detail.latest_date}${lastVolRatio ? ` dengan volume ${lastVolRatio.toFixed(2)}x rata-rata 20 hari` : ""}.`
        )
      ),
      drivers: Array.isArray(upWhy.drivers) ? upWhy.drivers.map((d: unknown) => sanitizeUpstreamCopy(String(d))) : [],
      source: String(upWhy.source || "OHLCV + broksum EOD; observasional."),
    },
    flowStory: {
      net1d: win1d.smartNet || detail.smart_money.foreign_net_1d || 0,
      net5d: win5d.smartNet || detail.smart_money.foreign_net_5d || 0,
      net30d: win30d.smartNet,
      summary: sanitizeUpstreamCopy(String(intelMeta?.divergence?.note || bandarConflict || "Membandingkan arus institusi 1D, 5D, dan 30D.")),
      divergenceNote: String(intelMeta?.divergence?.label || (bandarConflict ? "HORIZON_DIVERGENCE" : "ALIGNED")),
    },
    riskRadar: {
      verdict: sanitizeUpstreamCopy(String(proRaw?.risk_radar?.verdict || (detail.regime === "MARKDOWN" ? "PERLU HATI-HATI" : "AMAN / NORMAL"))),
      flags: Array.isArray(proRaw?.risk_radar?.flags)
        ? proRaw.risk_radar.flags.map((f: any) => sanitizeUpstreamCopy(typeof f === "string" ? f : JSON.stringify(f)))
        : [],
      caveat: String(proRaw?.risk_radar?.caveat || "Deteksi statistik pola transaksi, bukan tuduhan hukum."),
    },
    bandarAlerts: Array.isArray(proRaw.bandar_alerts)
      ? proRaw.bandar_alerts.map((a: any) => ({
          title: sanitizeUpstreamCopy(String(a.title || "Alert Bandar")),
          detail: sanitizeUpstreamCopy(String(a.detail || "")),
          tone: String(a.tone || "neutral"),
          type: String(a.type || "INFO"),
        }))
      : [],
    s1Confluence: intelMeta.s1_confluence
      ? {
          status: String(intelMeta.s1_confluence.status || "ok"),
          position: String(intelMeta.s1_confluence.position || "-"),
          distancePct:
            intelMeta.s1_confluence.distance_pct !== undefined ? Number(intelMeta.s1_confluence.distance_pct) : null,
          weeklyS1: intelMeta.s1_confluence.weekly_s1 ? Number(intelMeta.s1_confluence.weekly_s1) : null,
          monthlyS1: intelMeta.s1_confluence.monthly_s1 ? Number(intelMeta.s1_confluence.monthly_s1) : null,
          avgS1: intelMeta.s1_confluence.avg_s1 ? Number(intelMeta.s1_confluence.avg_s1) : null,
          summary: sanitizeUpstreamCopy(String(intelMeta.s1_confluence.summary || "")),
        }
      : null,
    retailProxy: intelMeta.retail_proxy
      ? {
          label: sanitizeUpstreamCopy(String(intelMeta.retail_proxy.label || "-")),
          netValue: Number(intelMeta.retail_proxy.net_value || 0),
          source: String(intelMeta.retail_proxy.source || "Proxy residual lawan smart money; bukan data ritel aktual."),
        }
      : null,
    dataConsistency: {
      coverageLabel: upIntelRes.ok ? `Upstream Intel + OHLCV Lokal (${detail.latest_date})` : `Mode Fallback Lokal (${detail.latest_date})`,
      warnings: [
        ...(upIntelRes.staleFromCache ? ["Snapshot upstream intelligence berasal dari cache sementara."] : []),
        ...(upAccumRes.ok ? [] : ["Zona akumulasi broker 15D tidak terjangkau; menggunakan fallback lokal."]),
        ...(corpRes.stale ? ["Jadwal aksi korporasi menampilkan snapshot cache upstream."] : []),
      ],
    },
  };

  const tickerCompany =
    detail.company_name ||
    String(overviewNode?.snapshot?.company_name || "").trim() ||
    corpRes.events[0]?.companyName ||
    null;

  return {
    ticker,
    companyName: tickerCompany && tickerCompany !== "-" ? tickerCompany : null,
    sector: detail.sector,
    sectorSlug: detail.sector_slug,
    generatedAt: new Date().toISOString(),
    technicalDetail: detail,
    sources: {
      rekomendasi: {
        status: upIntelRes.ok ? "ok" : "fallback",
        provenance: "derived",
        sourceLabel: "SahamTeknikal 3-Rule + Flow",
        asOfDate: detail.latest_date,
        cachedAt: upIntelRes.fetchedAt,
        stale: upIntelRes.staleFromCache,
      },
      bandar: {
        status: upIntelRes.ok ? (upIntelRes.staleFromCache ? "partial" : "ok") : "fallback",
        provenance: "proxy",
        sourceLabel: upIntelRes.ok ? "IDX Upstream + Broksum" : "max-trade MCP Fallback",
        asOfDate: detail.latest_date,
        cachedAt: upIntelRes.fetchedAt,
        stale: upIntelRes.staleFromCache,
      },
      broker: {
        status: upBsumRes.ok || upAccumRes.ok ? "ok" : "fallback",
        provenance: "mixed",
        sourceLabel: upBsumRes.ok ? "Broker Intel + Zones 15D" : "max-trade MCP Broksum",
        asOfDate: detail.latest_date,
        cachedAt: upBsumRes.fetchedAt ?? upAccumRes.fetchedAt,
        stale: upBsumRes.staleFromCache || upAccumRes.staleFromCache,
      },
      analisisTeknikal: {
        status: "ok",
        provenance: "derived",
        sourceLabel: "OHLCV EOD Lokal",
        asOfDate: detail.latest_date,
        cachedAt: null,
        stale: false,
      },
      proIntel: {
        status: upIntelRes.ok ? "ok" : "fallback",
        provenance: "mixed",
        sourceLabel: "IDX Pro Intel + Lokal",
        asOfDate: detail.latest_date,
        cachedAt: upIntelRes.fetchedAt,
        stale: upIntelRes.staleFromCache,
      },
      ownership: ownershipSource,
      aksiKorporasi: {
        status: corpRes.status === "unavailable" ? "unavailable" : corpRes.status,
        provenance: "observed",
        sourceLabel: "IDX / KSEI Calendar",
        asOfDate: corpRes.todayDate,
        cachedAt: corpRes.cacheFetchedAt ?? corpRes.fetchedAt,
        stale: corpRes.stale,
      },
      news: {
        status: upNewsRes.ok ? (upNewsRes.staleFromCache ? "partial" : "ok") : "unavailable",
        provenance: "observed",
        sourceLabel: "Google News RSS",
        asOfDate: newsItems[0]?.pubDateDisplay ?? null,
        cachedAt: upNewsRes.fetchedAt,
        stale: Boolean(rawNews?.stale) || upNewsRes.staleFromCache,
      },
    },
    recommendation,
    bandar: {
      verdict: bandarVerdict,
      tone: bandarTone,
      score: Number(bandarRaw.score || 0),
      score100: Number(bandarRaw.score_100 || 0),
      confidencePct: Number(bandarRaw.confidence ?? detail.smart_money.confidence_pct ?? 0),
      concentrationPct: Number(bandarRaw.concentration_pct || win5d.concentrationPct || 0),
      concentrationLabel: String(bandarRaw?.concentration_risk?.label || win5d.verdict || "-"),
      consistencyPct: Number(bandarRaw.consistency_pct || win5d.consistencyPct || 0),
      primaryWindow: bandarPrimaryWindow,
      conflictWarning: bandarConflict,
      windows: {
        "1D": win1d,
        "3D": win3d,
        "5D": win5d,
        "30D": win30d,
      },
      evidenceHeadline: sanitizeUpstreamCopy(String(evidenceTabs.bandar?.headline || `${bandarVerdict} · Window utama ${bandarPrimaryWindow}`)),
      evidenceDetail: sanitizeUpstreamCopy(String(evidenceTabs.bandar?.detail || win5d.reasons.join(" · "))),
      alerts: proIntelSection.bandarAlerts,
    },
    broker: brokerSection,
    technical: {
      momentumStrip: {
        activeSignalLabel: activeSig
          ? SIGNAL_DISPLAY_META[activeSig.signal_type]?.label || activeSig.signal_type
          : "NONE",
        activeSignalTone: activeSig ? "bullish" : "neutral",
        regime: detail.regime,
        regimeAction: detail.regime_action,
        rsi14: lastRsi,
        rsiZone,
        adx14: lastAdx?.adx ?? null,
        adxStrength: lastAdx?.strength ?? "WEAK",
        plusDi: lastAdx?.plusDi ?? null,
        minusDi: lastAdx?.minusDi ?? null,
        trendShort: lastE21 && detail.close >= lastE21 ? "UP" : "DOWN",
        trendMedium: lastE50 && detail.close >= lastE50 ? "UP" : "DOWN",
        trendLong: lastE200 && detail.close >= lastE200 ? "UP" : "DOWN",
        volumeRatio: lastVolRatio,
        volumeSignal:
          lastVolRatio === null ? "NORMAL" : lastVolRatio >= 1.5 ? "HIGH" : lastVolRatio <= 0.7 ? "LOW" : "NORMAL",
      },
      bestPlan,
      emaStack: {
        ema21: lastE21,
        ema50: lastE50,
        ema200: lastE200,
        alignmentLabel: emaAlign,
        priceVsEma: [
          lastE21 ? `Price ${detail.close >= lastE21 ? ">" : "<"} EMA21` : null,
          lastE50 ? `Price ${detail.close >= lastE50 ? ">" : "<"} EMA50` : null,
          lastE200 ? `Price ${detail.close >= lastE200 ? ">" : "<"} EMA200` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
      scenarios: buildTechnicalScenarios({
        close: detail.close,
        plan: bestPlan,
        pivots: detail.pivots,
        ema21: lastE21,
      }),
    },
    proIntel: proIntelSection,
    ownership: ownershipSection,
    corporateActions: {
      upcomingCount: corpRes.events.filter((e) => e.status !== "HISTORICAL").length,
      stale: corpRes.stale,
      events: corpRes.events,
    },
    news: newsItems,
  };
}
