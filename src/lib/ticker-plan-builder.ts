/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ADXPoint,
  FibonacciLevels,
  PivotPoints,
} from "./technical-indicators.ts";
import { roundIdxTick } from "./technical-indicators.ts";
import type { ScreeningSignalRow, SmartMoneyLabel, StockRegime, StockRegimeAction } from "./screener-types.ts";
import { formatPctID, formatPriceID, formatRupiahCompact } from "./format-id.ts";
import { SIGNAL_DISPLAY_META } from "./screener-types.ts";

export interface BestTradingPlan {
  modeLabel: string;
  title: string;
  subtitle: string;
  roleLabel: string;
  roleTone: "bullish" | "caution" | "bearish" | "neutral";
  waitOnly: boolean;
  confidenceScore: number;
  entryLabel: string;
  entryCenter: number;
  entryBandLow: number;
  entryBandHigh: number;
  entrySource: string;
  sl: number;
  slSource: string;
  tp1: number;
  tp1Source: string;
  tp2: number;
  tp2Source: string;
  rr1: number;
  rr2: number;
  basis: string[];
  confirmations: string[];
  risks: string[];
}

export interface TechnicalScenario {
  title: string;
  tone: "bullish" | "caution" | "bearish";
  trigger: string;
  target: string;
  invalidation: string;
}

export interface RecommendationSection {
  verdict: string;
  tone: "bullish" | "caution" | "bearish" | "neutral";
  alignmentLabel: "SELARAS" | "PARSIAL" | "BELUM SELARAS";
  headline: string;
  actionTitle: string;
  actionHint: string;
  evidenceHeadline: string;
  evidenceDetail: string;
  evidenceAsOfDate: string | null;
  evidenceCards: {
    label: string;
    value: string;
    tone: "bullish" | "caution" | "bearish" | "neutral";
    meta: string;
  }[];
  statusCards: {
    key: "bandar" | "broker" | "teknikal" | "strategi";
    eyebrow: string;
    title: string;
    detail: string;
    tone: "bullish" | "caution" | "bearish" | "neutral";
  }[];
  supporting: string[];
  holdingBack: string[];
}

const BANNED_COPY_PATTERNS: [RegExp, string][] = [
  [/maxv7\s*lama\s*sudah\s*selesai[^.;]*[.;]?/gi, "Setup teknikal lama sudah selesai masa berlakunya; fokus ke struktur harga & flow terbaru."],
  [/tunggu\s+signal\s+maxv7\s+baru\s*(?:atau\s+setup\s+teknikal\s+baru)?/gi, "Tunggu konfirmasi sinyal 3-strategi SahamTeknikal atau reclaim teknikal baru"],
  [/eksekusi\s+grid\s+(?:tetap\s+)?di\s+tab\s+maxv7/gi, "Baca level eksekusi & invalidasi pada tab Analisa Teknikal"],
  [/tab\s+maxv7/gi, "tab Analisa Teknikal"],
  [/maxv7\s+lifecycle/gi, "lifecycle setup SahamTeknikal"],
  [/maxv7/gi, "SahamTeknikal"],
  [/\bEARLY\s*SWEEP\b/gi, "Setup Teknikal Awal"],
  [/\bBETA\s*BREAKOUT\b/gi, "Breakout Konfirmasi"],
  [/\bSMART\s*GAMMA\b/gi, "Akumulasi Momentum"],
  [/\bSMART\s*SNIPER\b/gi, "Setup Presisi"],
  [/\bV-?SHAPE\b/gi, "Rebound Teknikal"],
];

/**
 * Strip legacy MaxV7 / removed strategy copy from any upstream sentence cleanly.
 */
export function sanitizeUpstreamCopy(input: string | null | undefined): string {
  if (!input) return "";
  let out = String(input).trim();
  for (const [pattern, replacement] of BANNED_COPY_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

/**
 * Deeply strip any object properties matching `maxv7` while keeping array/object structure safe.
 */
export function stripMaxV7Deep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripMaxV7Deep(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.toLowerCase().includes("maxv7")) continue;
      if (typeof v === "string") {
        clean[k] = sanitizeUpstreamCopy(v);
      } else {
        clean[k] = stripMaxV7Deep(v);
      }
    }
    return clean as T;
  }
  if (typeof value === "string") {
    return sanitizeUpstreamCopy(value) as unknown as T;
  }
  return value;
}

export function normalizeWindowKey(raw: string): "1D" | "3D" | "5D" | "30D" {
  const up = raw.toUpperCase().replace("H", "D");
  if (up === "1D" || up === "3D" || up === "5D" || up === "30D") return up;
  if (up.includes("30")) return "30D";
  if (up.includes("5")) return "5D";
  if (up.includes("3")) return "3D";
  return "1D";
}

/**
 * Derive Best Trading Plan purely from technicals, pivots, Fibonacci, accumulation zone & flow.
 */
export function buildTechnicalBestPlan(params: {
  close: number;
  recentLow: number;
  ema21: number | null;
  ema50: number | null;
  ema200: number | null;
  pivots: PivotPoints | null;
  fractalCeiling: number | null;
  fractalFloor: number | null;
  fibonacci: FibonacciLevels | null;
  regime: StockRegime;
  smartMoneyScore: number;
  bandar5dNet: number | null;
  bandar30dNet: number | null;
  accumZone: { avg?: number; low?: number; high?: number } | null;
  volumeRatio: number | null;
}): BestTradingPlan {
  const {
    close,
    recentLow,
    ema21,
    ema50,
    ema200,
    pivots,
    fractalCeiling,
    fractalFloor,
    fibonacci,
    regime,
    smartMoneyScore,
    bandar5dNet,
    bandar30dNet,
    accumZone,
    volumeRatio,
  } = params;

  const zoneAvg = Number(accumZone?.avg || 0);
  const zoneLow = Number(accumZone?.low || 0);
  const zoneHigh = Number(accumZone?.high || 0);
  const zoneNear = zoneAvg > 0 && zoneAvg <= close * 1.03 && zoneAvg >= close * 0.7;
  const zoneAbove = zoneAvg > 0 && zoneAvg > close * 1.03 && zoneAvg <= close * 1.12;

  let entryCenter = roundIdxTick(close, "nearest");
  let entryBandLow = roundIdxTick(close * 0.985, "down");
  let entryBandHigh = roundIdxTick(close * 1.01, "up");
  let entrySource = "area harga terkini & support terdekat";
  let waitOnly = regime === "MARKDOWN" || smartMoneyScore === 0;

  if (zoneNear && zoneAvg > 0) {
    entryCenter = roundIdxTick(zoneAvg, "nearest");
    entryBandLow = zoneLow > 0 ? roundIdxTick(zoneLow, "down") : roundIdxTick(zoneAvg * 0.975, "down");
    entryBandHigh = zoneHigh > 0 ? roundIdxTick(zoneHigh, "up") : roundIdxTick(zoneAvg * 1.02, "up");
    entrySource = "area avg akumulasi broker 15D";
  } else if (regime === "CONSOLIDATING" && fractalCeiling && fractalCeiling > close) {
    entryCenter = roundIdxTick(fractalCeiling, "up");
    entryBandLow = roundIdxTick(fractalCeiling * 0.99, "down");
    entryBandHigh = roundIdxTick(fractalCeiling * 1.015, "up");
    entrySource = "trigger breakout Fractal Ceiling";
    waitOnly = true;
  } else if (regime === "MARKDOWN" && ema21 && ema21 > close) {
    entryCenter = roundIdxTick(ema21, "up");
    entryBandLow = roundIdxTick(ema21 * 0.99, "down");
    entryBandHigh = roundIdxTick(ema21 * 1.02, "up");
    entrySource = "trigger reclaim EMA21";
    waitOnly = true;
  } else if (zoneAbove && zoneAvg > 0) {
    entryCenter = roundIdxTick(zoneAvg, "nearest");
    entryBandLow = zoneLow > 0 ? roundIdxTick(zoneLow, "down") : roundIdxTick(zoneAvg * 0.98, "down");
    entryBandHigh = zoneHigh > 0 ? roundIdxTick(zoneHigh, "up") : roundIdxTick(zoneAvg * 1.015, "up");
    entrySource = "reclaim area broker 15D";
    waitOnly = true;
  } else if (ema21 && ema21 > 0 && close >= ema21) {
    entryCenter = roundIdxTick((close + ema21) / 2, "nearest");
    entryBandLow = roundIdxTick(ema21 * 0.995, "down");
    entryBandHigh = roundIdxTick(close * 1.005, "up");
    entrySource = "pullback sehat di atas EMA21";
  }

  const slCandidates: { value: number; source: string }[] = [];
  const pushSl = (v: number | null | undefined, source: string) => {
    if (!v || v <= 0) return;
    const snapped = roundIdxTick(v, "down");
    if (snapped > 0 && snapped < Math.min(entryCenter, entryBandLow || entryCenter)) {
      slCandidates.push({ value: snapped, source });
    }
  };
  pushSl(pivots ? pivots.s1 * 0.992 : null, "break di bawah S1 Pivot");
  pushSl(recentLow * 0.992, "low terdekat");
  pushSl(fractalFloor, "Fractal Floor");
  pushSl(zoneLow > 0 ? zoneLow * 0.988 : null, "bawah zona akumulasi 15D");
  pushSl(ema50 && ema50 < entryCenter ? ema50 * 0.99 : null, "break EMA50");

  slCandidates.sort((a, b) => b.value - a.value);
  const slPick =
    slCandidates[0] ??
    {
      value: roundIdxTick((entryBandLow || entryCenter) * 0.965, "down"),
      source: "batas risiko -3.5% dari area pantau",
    };

  const targetCandidates: { value: number; source: string }[] = [];
  const floorBase = Math.max(entryCenter, entryBandHigh, close);
  const pushTarget = (v: number | null | undefined, source: string) => {
    if (!v || v <= 0) return;
    const snapped = roundIdxTick(v, "up");
    if (snapped > floorBase * 1.008 && snapped <= floorBase * 1.35) {
      targetCandidates.push({ value: snapped, source });
    }
  };
  pushTarget(pivots?.p, "Pivot harian");
  pushTarget(pivots?.r1, "Resistance R1");
  pushTarget(pivots?.r2, "Resistance R2");
  pushTarget(fractalCeiling, "Fractal Ceiling");
  pushTarget(ema50, "EMA50");
  pushTarget(ema200, "EMA200");
  if (fibonacci?.levels) {
    for (const lv of fibonacci.levels) {
      if (lv.ratio === "0.382" || lv.ratio === "0.236" || lv.ratio === "0.0") {
        pushTarget(lv.price, `Fibonacci ${lv.ratio}`);
      }
    }
  }
  targetCandidates.sort((a, b) => a.value - b.value);

  const tp1Pick =
    targetCandidates[0] ??
    {
      value: roundIdxTick(floorBase * 1.035, "up"),
      source: "proyeksi teknikal +3.5%",
    };
  const tp2Pick =
    targetCandidates.find((t) => t.value > tp1Pick.value * 1.015) ??
    {
      value: roundIdxTick(Math.max(floorBase * 1.07, tp1Pick.value * 1.03), "up"),
      source: "proyeksi lanjutan",
    };

  const riskDenom = Math.max(1, entryCenter - slPick.value);
  const rr1 = Math.round(((tp1Pick.value - entryCenter) / riskDenom) * 100) / 100;
  const rr2 = Math.round(((tp2Pick.value - entryCenter) / riskDenom) * 100) / 100;

  let score = 45;
  if (regime === "MARKUP") score += 20;
  else if (regime === "CONSOLIDATING") score += 8;
  else score -= 18;
  score += smartMoneyScore * 10;
  if ((bandar5dNet ?? 0) > 0) score += 8;
  if ((bandar30dNet ?? 0) > 0) score += 6;
  if ((volumeRatio ?? 0) >= 1.2 && regime !== "MARKDOWN") score += 6;
  score = Math.max(15, Math.min(95, score));

  const basis: string[] = [];
  if (zoneNear && zoneAvg > 0) basis.push(`Area broker 15D terdeteksi di ${formatPriceID(zoneLow)}–${formatPriceID(zoneHigh)}.`);
  if (pivots) basis.push(`Peta Pivot S1 ${formatPriceID(pivots.s1)} · P ${formatPriceID(pivots.p)} · R1 ${formatPriceID(pivots.r1)}.`);
  if (ema21) basis.push(`Harga saat ini ${close >= ema21 ? "di atas" : "di bawah"} EMA21 (${formatPriceID(ema21)}).`);

  const confirmations: string[] = [];
  if (regime === "MARKDOWN" && ema21) confirmations.push(`Tunggu harga reclaim & bertahan di atas EMA21 (${formatPriceID(ema21)}).`);
  else if (fractalCeiling && close < fractalCeiling) confirmations.push(`Konfirmasi breakout volume di atas ${formatPriceID(fractalCeiling)}.`);
  else confirmations.push("Pertahankan close harian di atas area support / EMA21.");
  if ((bandar5dNet ?? 0) <= 0) confirmations.push("Flow Bandar 5D berbalik net buy atau tekanan jual mereda.");
  if ((volumeRatio ?? 0) < 1.1) confirmations.push("Volume naik minimal 1.2x rata-rata 20 hari saat breakout.");

  const risks: string[] = [];
  if (regime === "MARKDOWN") risks.push("Struktur tren masih bearish di bawah EMA21/EMA50; rawan false bounce.");
  risks.push(` setup batal jika breakdown valid di bawah ${formatPriceID(slPick.value)} (${slPick.source}).`);
  if ((bandar5dNet ?? 0) < 0) risks.push(`Outflow Bandar 5D masih negatif (${formatRupiahCompact(bandar5dNet, true)}).`);

  const chaseRisk = !waitOnly && entryBandHigh > 0 && close > entryBandHigh * 1.035;
  if (chaseRisk) waitOnly = true;

  const roleTone: BestTradingPlan["roleTone"] =
    regime === "MARKDOWN" ? "bearish" : waitOnly ? "caution" : score >= 65 ? "bullish" : "neutral";
  const roleLabel =
    regime === "MARKDOWN"
      ? "Defensif / Tunggu Reclaim"
      : chaseRisk
        ? "Tunggu Pullback"
        : waitOnly
          ? "Tunggu Konfirmasi"
          : "Best Setup Aktif";

  return {
    modeLabel: "ANALISA TEKNIKAL · BEST TRADING PLAN",
    title:
      regime === "MARKDOWN"
        ? "Simulasi area pantau jika reclaim — belum buy aktif"
        : chaseRisk
          ? "Harga sudah menjauh dari area ideal — tunggu retest"
          : waitOnly
            ? "Trigger pantau breakout / konfirmasi flow"
            : "Best plan terukur: area entry, invalidasi, target",
    subtitle: waitOnly
      ? "Level di bawah adalah zona pantau teknikal & validasi risiko. Tunggu konfirmasi harga serta dukungan Smart Money sebelum eksekusi."
      : "Level disusun dari struktur EMA21/50/200, Pivot, Fibonacci, dan area akumulasi broker 15D.",
    roleLabel,
    roleTone,
    waitOnly,
    confidenceScore: score,
    entryLabel: waitOnly ? "Area / Trigger Pantau" : "Area Entry Teknis",
    entryCenter,
    entryBandLow,
    entryBandHigh,
    entrySource,
    sl: slPick.value,
    slSource: slPick.source,
    tp1: tp1Pick.value,
    tp1Source: tp1Pick.source,
    tp2: tp2Pick.value,
    tp2Source: tp2Pick.source,
    rr1,
    rr2,
    basis,
    confirmations,
    risks,
  };
}

export function buildTechnicalScenarios(params: {
  close: number;
  plan: BestTradingPlan;
  pivots: PivotPoints | null;
  ema21: number | null;
}): TechnicalScenario[] {
  const { close, plan, pivots, ema21 } = params;
  const triggerUp = ema21 && ema21 > close ? Math.max(ema21, pivots?.r1 ?? ema21) : pivots?.r1 ?? plan.tp1;
  return [
    {
      title: "Skenario Bullish / Konfirmasi Lanjut",
      tone: "bullish",
      trigger: `Close kuat di atas ${formatPriceID(triggerUp)} dengan volume > 1.2x avg & Smart Money net positif.`,
      target: `TP1 ${formatPriceID(plan.tp1)} -> TP2 ${formatPriceID(plan.tp2)} (R:R hingga ${plan.rr2.toFixed(2)}x).`,
      invalidation: `Gagal bertahan di atas ${formatPriceID(plan.entryBandLow)}.`,
    },
    {
      title: "Skenario Sideways / Retest Support",
      tone: "caution",
      trigger: `Harga berkonsolidasi di rentang ${formatPriceID(plan.entryBandLow)}–${formatPriceID(plan.entryBandHigh)} sambil broker menyerap suplai.`,
      target: `Tunggu pantulan terkonfirmasi di area ${formatPriceID(plan.entryCenter)} sebelum entry.`,
      invalidation: `Breakdown volume tinggi menembus ${formatPriceID(plan.sl)}.`,
    },
    {
      title: "Skenario Bearish / Invalidasi Setup",
      tone: "bearish",
      trigger: `Break di bawah ${formatPriceID(plan.sl)} (${plan.slSource}) diikuti outflow lanjutan.`,
      target: pivots ? `Potensi uji ulang support bawah S2 di ${formatPriceID(pivots.s2)}.` : "Prioritaskan proteksi modal / cut loss disiplin.",
      invalidation: `Reclaim cepat kembali ke atas ${formatPriceID(pivots?.p ?? plan.entryCenter)}.`,
    },
  ];
}

/**
 * Re-synthesize clean REKOMENDASI section aligned with SahamTeknikal's 3 strategies + Smart Money (zero MaxV7).
 */
export function buildRecommendationSection(params: {
  ticker: string;
  close: number;
  changePct: number;
  regime: StockRegime;
  regimeAction: StockRegimeAction;
  smartMoneyScore: number;
  smartMoneyLabel: SmartMoneyLabel;
  signals: ScreeningSignalRow[];
  bestPlan: BestTradingPlan;
  bandar: {
    verdict: string;
    tone: string;
    confidencePct: number;
    net1d: number | null;
    net5d: number | null;
    net30d: number | null;
    topBuyerSummary?: string;
    topSellerSummary?: string;
  };
  broker: {
    verdict: string;
    tone: string;
    note: string;
  };
  pivots: PivotPoints | null;
  ema21: number | null;
  adxLatest: ADXPoint | null;
  volumeRatio: number | null;
  upstreamRecEvidence?: Record<string, any> | null;
}): RecommendationSection {
  const {
    ticker,
    close,
    changePct,
    regime,
    smartMoneyScore,
    signals,
    bestPlan,
    bandar,
    broker,
    pivots,
    ema21,
    volumeRatio,
    upstreamRecEvidence,
  } = params;

  const latestSig = signals[0] ?? null;
  const sigLabel = latestSig ? SIGNAL_DISPLAY_META[latestSig.signal_type]?.label || latestSig.signal_type : null;
  const bandarBull = bandar.tone === "bullish" || (bandar.net5d ?? 0) > 0;
  const brokerBull = broker.tone === "bullish";

  let verdict = "WAIT AND SEE / HINDARI DULU";
  let tone: RecommendationSection["tone"] = "caution";
  let alignmentLabel: RecommendationSection["alignmentLabel"] = "BELUM SELARAS";
  let actionTitle = "Jangan paksa entry";
  let actionHint = "Pantau konfirmasi harga & flow di tab Analisa Teknikal";

  if (regime === "MARKUP" && smartMoneyScore >= 2 && (bandarBull || brokerBull)) {
    verdict = latestSig ? `BUY / IKUTI SETUP ${sigLabel?.toUpperCase()}` : "SIAP ENTRY · TREN & FLOW SELARAS";
    tone = "bullish";
    alignmentLabel = smartMoneyScore === 3 ? "SELARAS" : "PARSIAL";
    actionTitle = `Area entry terukur ${formatPriceID(bestPlan.entryBandLow)}–${formatPriceID(bestPlan.entryBandHigh)}`;
    actionHint = `SL ${formatPriceID(bestPlan.sl)} · Target TP1 ${formatPriceID(bestPlan.tp1)} (R:R ${bestPlan.rr1.toFixed(2)}x)`;
  } else if (regime === "CONSOLIDATING" && (smartMoneyScore >= 2 || brokerBull)) {
    verdict = "PANTAU BREAKOUT / AKUMULASI TERUKUR";
    tone = "caution";
    alignmentLabel = "PARSIAL";
    actionTitle = `Tunggu breakout terkonfirmasi di atas ${formatPriceID(bestPlan.entryCenter)}`;
    actionHint = "Perhatikan volume & kelanjutan serapan broker pada tab Broker / Analisa Teknikal";
  } else if (regime === "MARKDOWN") {
    verdict = "WAIT AND SEE / HINDARI DULU";
    tone = "bearish";
    alignmentLabel = "BELUM SELARAS";
    actionTitle = "Jangan paksa entry saat tren turun";
    actionHint = ema21
      ? `Tunggu reclaim EMA21 (${formatPriceID(ema21)}) dan pembalikan flow Bandar`
      : "Tunggu perbaikan struktur tren di tab Analisa Teknikal";
  }

  const parts: string[] = [];
  if (latestSig) {
    parts.push(`Sinyal terbaru ${sigLabel} terdeteksi pada ${latestSig.signal_date} (Entry ${formatPriceID(latestSig.entry_price)}).`);
  } else {
    parts.push(`${ticker} berada di fase ${regime} (${changePct >= 0 ? "+" : ""}${formatPctID(changePct, false)}).`);
  }
  parts.push(`Zona terbaik saat ini di ${formatPriceID(bestPlan.entryBandLow)}–${formatPriceID(bestPlan.entryBandHigh)} (${bestPlan.entrySource}).`);
  parts.push(`Smart Money Score ${smartMoneyScore}/3 (${bandar.verdict}; ${broker.verdict}).`);
  if (bestPlan.confirmations[0]) {
    parts.push(`Konfirmasi: ${bestPlan.confirmations[0]}`);
  }

  const rawEvCards = Array.isArray(upstreamRecEvidence?.evidence) ? upstreamRecEvidence.evidence : [];
  const evidenceCards =
    rawEvCards.length > 0
      ? rawEvCards.slice(0, 4).map((c: any) => ({
          label: sanitizeUpstreamCopy(String(c.label || "INDIKATOR")),
          value: sanitizeUpstreamCopy(String(c.value || "-")),
          tone: (c.tone === "bullish" || c.tone === "bearish" || c.tone === "caution" ? c.tone : "neutral") as
            | "bullish"
            | "caution"
            | "bearish"
            | "neutral",
          meta: sanitizeUpstreamCopy(String(c.meta || "")),
        }))
      : [
          {
            label: "FLOW INSTITUSI 5D",
            value: formatRupiahCompact(bandar.net5d, true),
            tone: (bandar.net5d ?? 0) > 0 ? ("bullish" as const) : (bandar.net5d ?? 0) < 0 ? ("bearish" as const) : ("neutral" as const),
            meta: "5D · SMART MONEY FLOW",
          },
          {
            label: "FLOW INSTITUSI 30D",
            value: formatRupiahCompact(bandar.net30d, true),
            tone: (bandar.net30d ?? 0) > 0 ? ("bullish" as const) : (bandar.net30d ?? 0) < 0 ? ("bearish" as const) : ("neutral" as const),
            meta: "30D · SMART MONEY FLOW",
          },
          {
            label: "BANDAR 1D",
            value: formatRupiahCompact(bandar.net1d, true),
            tone: (bandar.net1d ?? 0) > 0 ? ("bullish" as const) : (bandar.net1d ?? 0) < 0 ? ("bearish" as const) : ("neutral" as const),
            meta: `1D · CONF ${bandar.confidencePct.toFixed(0)}%`,
          },
          {
            label: "HARGA VS S1 / EMA21",
            value: `${formatPriceID(close)} / ${formatPriceID(pivots?.s1 ?? ema21)}`,
            tone: ema21 && close >= ema21 ? ("bullish" as const) : ("caution" as const),
            meta: "OHLCV & PIVOT",
          },
        ];

  const supporting: string[] = [];
  if (smartMoneyScore >= 2) supporting.push(`Smart Money Score ${smartMoneyScore}/3 mendukung akumulasi.`);
  if ((bandar.net30d ?? 0) > 0) supporting.push(`Flow institusi 30D masih net buy ${formatRupiahCompact(bandar.net30d, true)}.`);
  if (brokerBull) supporting.push(`${broker.verdict}: ${sanitizeUpstreamCopy(broker.note)}`);
  if (regime === "MARKUP") supporting.push("Harga berada di atas EMA21 & EMA50 (fase MARKUP).");
  if (latestSig) supporting.push(`Terdeteksi sinyal ${sigLabel} (${latestSig.signal_date}).`);
  if (supporting.length === 0) supporting.push("Belum ada konfirmasi beli serempak antara teknikal dan flow institusi.");

  const holdingBack: string[] = [];
  if (regime === "MARKDOWN") holdingBack.push("Struktur tren besar masih bearish di bawah EMA21/EMA50.");
  if ((bandar.net5d ?? 0) < 0) holdingBack.push(`Flow Bandar 5D masih net sell ${formatRupiahCompact(bandar.net5d, true)}.`);
  if (ema21 && close < ema21) holdingBack.push(`Harga belum mampu reclaim EMA21 (${formatPriceID(ema21)}).`);
  if ((volumeRatio ?? 1) >= 1.5 && changePct < -2) {
    holdingBack.push(`Volume jual besar (${volumeRatio?.toFixed(2)}x rata-rata) menekan harga turun.`);
  }
  if (holdingBack.length === 0) holdingBack.push("Tetap awasi batas invalidasi SL dan konsistensi flow harian.");

  return {
    verdict,
    tone,
    alignmentLabel,
    headline: parts.join(" "),
    actionTitle,
    actionHint,
    evidenceHeadline: sanitizeUpstreamCopy(String(upstreamRecEvidence?.headline || `Ringkasan flow & struktur harga ${ticker}`)),
    evidenceDetail: sanitizeUpstreamCopy(
      String(
        upstreamRecEvidence?.detail ||
          `Flow 5D ${formatRupiahCompact(bandar.net5d, true)} dan 30D ${formatRupiahCompact(bandar.net30d, true)} dibandingkan posisi harga terhadap S1 / EMA21.`
      )
    ),
    evidenceAsOfDate: upstreamRecEvidence?.asOfDate ? String(upstreamRecEvidence.asOfDate) : null,
    evidenceCards,
    statusCards: [
      {
        key: "strategi",
        eyebrow: "SAHAMTEKNIKAL 3-RULE",
        title: latestSig ? `${sigLabel} (${latestSig.signal_date})` : "Belum ada sinyal aktif hari ini",
        detail: latestSig
          ? `Entry ${formatPriceID(latestSig.entry_price)} · TP1 ${formatPriceID(latestSig.tp1)} · SL ${formatPriceID(latestSig.stop_loss)}`
          : `Regime ${regime} · Smart Money ${smartMoneyScore}/3`,
        tone: latestSig ? (tone === "bearish" ? "caution" : "bullish") : "neutral",
      },
      {
        key: "bandar",
        eyebrow: "BANDAR",
        title: `${bandar.verdict} (${bandar.confidencePct.toFixed(0)}%)`,
        detail: `Flow 5D ${formatRupiahCompact(bandar.net5d, true)} · 30D ${formatRupiahCompact(bandar.net30d, true)}`,
        tone: (bandar.tone === "bullish" || bandar.tone === "bearish" || bandar.tone === "caution"
          ? bandar.tone
          : "neutral"),
      },
      {
        key: "broker",
        eyebrow: "BROKER",
        title: sanitizeUpstreamCopy(broker.verdict),
        detail: sanitizeUpstreamCopy(broker.note) || `${bandar.topBuyerSummary || "Belum ada broker dominan"}`,
        tone: (broker.tone === "bullish" || broker.tone === "bearish" || broker.tone === "caution"
          ? broker.tone
          : "neutral"),
      },
      {
        key: "teknikal",
        eyebrow: "TEKNIKAL",
        title: regime === "MARKUP" ? "Struktur tren naik sehat" : regime === "MARKDOWN" ? "Tren masih tertekan" : "Fase konsolidasi / tunggu pemicu",
        detail: `${ema21 ? `EMA21 ${formatPriceID(ema21)}` : "EMA21 -"}${pivots ? ` · S1 ${formatPriceID(pivots.s1)} · R1 ${formatPriceID(pivots.r1)}` : ""}${volumeRatio ? ` · Vol ${volumeRatio.toFixed(2)}x` : ""}`,
        tone: regime === "MARKUP" ? "bullish" : regime === "MARKDOWN" ? "bearish" : "caution",
      },
    ],
    supporting,
    holdingBack,
  };
}
