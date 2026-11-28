import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendationSection,
  buildTechnicalBestPlan,
  normalizeWindowKey,
  sanitizeUpstreamCopy,
  stripMaxV7Deep,
} from "../src/lib/ticker-plan-builder.ts";
import {
  clearUpstreamCache,
  fetchUpstreamJson,
} from "../src/lib/idx-upstream.ts";

test("sanitizeUpstreamCopy & stripMaxV7Deep remove MaxV7 and retired screeners completely", () => {
  const dirty = {
    summary: {
      headline: "EARLY SWEEP 65d sudah selesai; tunggu signal MaxV7 baru atau setup teknikal baru.",
      state: "MAXV7 INVALID / SIGNAL SELESAI",
    },
    maxv7: { score: 99, verdict: "SHOULD_BE_DELETED" },
    nested: [
      { text: "Lihat BETA BREAKOUT dan SMART GAMMA serta SMART SNIPER dan V-SHAPE di tab MaxV7." },
    ],
  };

  const cleaned = stripMaxV7Deep(dirty);
  const serialized = JSON.stringify(cleaned);
  assert.equal(Object.hasOwn(cleaned, "maxv7"), false);
  assert.equal(/maxv7/i.test(serialized), false);
  assert.equal(/early\s*sweep/i.test(serialized), false);
  assert.equal(/beta\s*breakout/i.test(serialized), false);
  assert.equal(/smart\s*gamma/i.test(serialized), false);
  assert.equal(/smart\s*sniper/i.test(serialized), false);
  assert.equal(/v-?shape/i.test(serialized), false);
  assert.ok(sanitizeUpstreamCopy("tunggu signal MaxV7 baru").includes("3-strategi SahamTeknikal"));
  assert.equal(normalizeWindowKey("30H"), "30D");
});

test("buildTechnicalBestPlan & buildRecommendationSection synthesize coherent actions without MaxV7", () => {
  const plan = buildTechnicalBestPlan({
    close: 2170,
    recentLow: 2080,
    ema21: 2200,
    ema50: 2410,
    ema200: 4040,
    pivots: { date: "2026-11-27", p: 2220, r1: 2300, r2: 2420, s1: 2130, s2: 2050 },
    fractalCeiling: 2320,
    fractalFloor: 2060,
    fibonacci: null,
    regime: "MARKDOWN",
    smartMoneyScore: 0,
    bandar5dNet: -33_170_000_000,
    bandar30dNet: -7_000_000_000,
    accumZone: { avg: 2167, low: 2135, high: 2200 },
    volumeRatio: 1.93,
  });

  assert.equal(plan.waitOnly, true);
  assert.ok(plan.sl < plan.entryCenter);
  assert.ok(plan.tp1 > plan.entryCenter);
  assert.ok(plan.tp2 > plan.tp1);
  assert.ok(plan.rr1 > 0);

  const rec = buildRecommendationSection({
    ticker: "BREN",
    close: 2170,
    changePct: -4.82,
    regime: "MARKDOWN",
    regimeAction: "SELL / AVOID",
    smartMoneyScore: 0,
    smartMoneyLabel: "NOT CONFIRMED",
    signals: [],
    bestPlan: plan,
    bandar: {
      verdict: "DISTRIBUSI",
      tone: "bearish",
      confidencePct: 62,
      net1d: -17_870_000_000,
      net5d: -33_170_000_000,
      net30d: -7_000_000_000,
    },
    broker: {
      verdict: "MIXED / NETRAL",
      tone: "caution",
      note: "Buyer dan seller aktif bertarung",
    },
    pivots: { date: "2026-11-27", p: 2220, r1: 2300, r2: 2420, s1: 2130, s2: 2050 },
    ema21: 2200,
    adxLatest: null,
    volumeRatio: 1.93,
    upstreamRecEvidence: null,
  });

  assert.equal(rec.alignmentLabel, "BELUM SELARAS");
  assert.equal(rec.statusCards.length, 4);
  assert.deepEqual(
    rec.statusCards.map((c) => c.key),
    ["strategi", "bandar", "broker", "teknikal"]
  );
  assert.equal(/maxv7/i.test(JSON.stringify(rec)), false);
});

test("fetchUpstreamJson degrades gracefully to stale grace cache when upstream fails", async () => {
  clearUpstreamCache();
  const prevEnv = process.env.IDX_TERMINAL_API_BASE;
  const origFetch = globalThis.fetch;

  try {
    process.env.IDX_TERMINAL_API_BASE = "https://mock.invalid";
    let mode = "ok";
    globalThis.fetch = async () => {
      if (mode === "ok") {
        return new Response(JSON.stringify({ status: "ok", items: [1, 2] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error("Simulated network failure");
    };

    const first = await fetchUpstreamJson("/api/test-cache", { ttlMs: 1, timeoutMs: 500 });
    assert.equal(first.ok, true);
    assert.equal(first.staleFromCache, false);

    // Wait >1ms so TTL expires while grace window (30m) stays alive
    await new Promise((r) => setTimeout(r, 15));
    mode = "fail";

    const second = await fetchUpstreamJson("/api/test-cache", { ttlMs: 1, timeoutMs: 500 });
    assert.equal(second.ok, true);
    assert.equal(second.staleFromCache, true);
    assert.match(second.error ?? "", /Simulated network failure/);
  } finally {
    globalThis.fetch = origFetch;
    if (prevEnv === undefined) delete process.env.IDX_TERMINAL_API_BASE;
    else process.env.IDX_TERMINAL_API_BASE = prevEnv;
    clearUpstreamCache();
  }
});
