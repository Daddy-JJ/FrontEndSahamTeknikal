import test from "node:test";
import assert from "node:assert/strict";
import {
  collectLocalMultiHorizonMap,
  fetchTickerMultiHorizon,
  getHorizonTop3NetValue,
  summarizeCrossHorizonOverlap,
} from "../src/lib/broker-flow.ts";
import { synthesizeTickerHorizonDetail } from "../src/lib/mcp-broker-flow.ts";

test("collectLocalMultiHorizonMap returns distinct 2D/5D/10D without cloning fallbacks", () => {
  const cdiaMap = collectLocalMultiHorizonMap("cdia", "5D");
  assert.ok(cdiaMap.horizons["2D"], "CDIA must include 2D");
  assert.ok(cdiaMap.horizons["5D"], "CDIA must include 5D");
  assert.ok(cdiaMap.horizons["10D"], "CDIA must include 10D");
  assert.notEqual(
    cdiaMap.horizons["2D"]?.bandar_avg_cost,
    cdiaMap.horizons["5D"]?.bandar_avg_cost
  );
  assert.notEqual(
    cdiaMap.horizons["5D"]?.bandar_avg_cost,
    cdiaMap.horizons["10D"]?.bandar_avg_cost
  );

  // Honest partial state for quadrant-only fallback ticker (no fake 3-row cloning)
  const isatMap = collectLocalMultiHorizonMap("ISAT", "5D");
  assert.ok(isatMap.horizons["5D"]?.is_horizon_fallback, "ISAT should mark fallback honestly");
  assert.equal(isatMap.horizons["2D"], undefined, "ISAT fallback must not fabricate 2D row");
  assert.equal(isatMap.horizons["10D"], undefined, "ISAT fallback must not fabricate 10D row");
});

test("summarizeCrossHorizonOverlap detects consistent accumulators and modal trend", () => {
  const { horizons } = collectLocalMultiHorizonMap("CDIA", "5D");
  const summary = summarizeCrossHorizonOverlap(horizons);

  assert.deepEqual(summary.availableHorizons, ["2D", "5D", "10D"]);
  const codes = summary.consistentAccumulators.map((b) => b.code);
  assert.ok(codes.includes("MG"), "MG appears across multiple CDIA horizons");
  assert.ok(codes.includes("AK"), "AK appears across multiple CDIA horizons");
  assert.equal(summary.costProgression["2D"], 384.89);
  assert.equal(summary.costProgression["5D"], 363.19);
  assert.ok(summary.costTrendNote.length > 10);
});

test("fetchTickerMultiHorizon returns all 3 local horizons or honest null", async () => {
  const multi = await fetchTickerMultiHorizon("AMMN", "5D", false);
  assert.ok(multi);
  assert.equal(multi.ticker, "AMMN");
  assert.equal(multi.activeHorizon, "5D");
  assert.ok(multi.horizons["2D"]);
  assert.ok(multi.horizons["5D"]);
  assert.ok(multi.horizons["10D"]);
  assert.equal(multi.active.bandar_avg_cost, 3313.12);

  const missing = await fetchTickerMultiHorizon("ZZZZ_INVALID", "5D", false);
  assert.equal(missing, null);
});

test("synthesizeTickerHorizonDetail captures signal telemetry, top3 sum, and structured why", () => {
  const detail = synthesizeTickerHorizonDetail({
    ticker: "MEDC",
    closePrice: 1185,
    changePct: 1.28,
    period: "2D",
    label: "2 Hari (24 - 25 Nov 2026)",
    range: "24 - 25 Nov 2026",
    buyersResp: {
      records: [
        {
          code: "CP",
          name: "KB Valbury Sekuritas",
          investorGroups: ["FOREIGN"],
          netSide: "BUY",
          netValue: 23_470_810_500,
          netVolume: 198_834,
          buyAvgPrice: 1182.16,
        },
        {
          code: "AK",
          name: "UBS Sekuritas",
          investorGroups: ["FOREIGN"],
          netSide: "BUY",
          netValue: 11_778_990_000,
          netVolume: 98_202,
          buyAvgPrice: 1189.69,
        },
        {
          code: "DR",
          name: "RHB Sekuritas",
          investorGroups: ["FOREIGN"],
          netSide: "BUY",
          netValue: 7_124_842_500,
          netVolume: 60_003,
          buyAvgPrice: 1187.52,
        },
      ],
    },
    sellersResp: {
      records: [
        {
          code: "OD",
          name: "BRI Danareksa",
          investorGroups: ["GOVERNMENT"],
          netSide: "SELL",
          netValue: -22_903_779_000,
          netVolume: -193_000,
          sellAvgPrice: 1186.72,
        },
      ],
    },
    signalResp: {
      label: "STRONG_ACCUMULATION",
      score: 70.75,
      components: { brokerConcentration: 24.94 },
      evidence: { accumulationConsistencyPct: 100 },
      summary: { foreignNetValue: 27_613_219_500, foreignNetTurnoverPct: 23.3 },
    },
  });

  assert.equal(detail.ticker, "MEDC");
  assert.equal(detail.top_accumulators.length, 3);
  assert.equal(getHorizonTop3NetValue(detail), 42_374_643_000);
  assert.equal(detail.top_accumulators_net_value, 42_374_643_000);
  assert.equal(detail.foreign_net_value, 27_613_219_500);
  assert.equal(detail.signal_label, "STRONG_ACCUMULATION");
  assert.equal(detail.signal_score, 70.75);
  assert.equal(detail.consistency_pct, 100);
  assert.ok(detail.why_insight.includes("Inisiasi 48j"), "2D insight should reflect phase");
  assert.ok(detail.why_insight.includes("CP"), "Insight should mention top buyer");
  assert.ok(detail.why_insight.includes("OD"), "Insight should mention counterparty");
  assert.ok(detail.why_insight.includes("100%"), "Insight should mention consistency %");
});
