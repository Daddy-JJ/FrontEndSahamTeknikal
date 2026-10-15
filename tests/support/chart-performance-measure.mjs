// Usage: node --experimental-strip-types tests/support/chart-performance-measure.mjs <receipt-dir>
// Measures isolated production builds using an owned loopback HTTP double. No cloud credentials.
import { fork } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus, platform, arch, totalmem } from "node:os";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import { chartPerformanceFixture } from "../../src/lib/chart-perf-fixture.ts";
import { chartPerformanceEnv } from "./chart-performance-env.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const receipt = resolve(process.argv[2] ?? "");
const allowed = resolve(root, "test-results/chart-performance");
if (!relative(allowed, receipt) || relative(allowed, receipt).startsWith("..")) throw Error("receipt_must_be_owned_local_directory");
const manifest = JSON.parse(await readFile(resolve(receipt, "manifest.json"), "utf8"));
if (!manifest.buildComplete || manifest.nextVersion !== "16.3.8" || manifest.bundler !== "webpack") throw Error("isolated_builds_required");
for (const path of [manifest.baseline, manifest.final])
  if (relative(receipt, resolve(path)).startsWith("..")) throw Error("source_directory_not_owned");
const children = [];
async function start(file, cwd, mode, port) {
  const child = fork(file, [], { cwd, env: { ...chartPerformanceEnv(mode), ...(port ? { CHART_PERF_PORT: String(port) } : {}) },
    stdio: ["ignore", "inherit", "inherit", "ipc"], windowsHide: true });
  children.push(child);
  await new Promise((done, reject) => {
    const timer = setTimeout(() => reject(Error("benchmark_process_timeout")), 60000);
    const fail = error => { clearTimeout(timer); reject(error); };
    child.once("error", fail); child.once("exit", code => fail(Error("benchmark_process_exited:" + code)));
    child.on("message", message => { if (message?.ready) { clearTimeout(timer); done(); } });
  });
  return child;
}
async function stop(child) {
  if (child.exitCode !== null) return;
  await new Promise((done, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(Error("owned_benchmark_teardown_timeout")); }, 15000);
    child.once("exit", () => { clearTimeout(timer); done(); });
    child.send({ stop: true });
  });
}
function sessionCookie() {
  const id = "22222222-2222-4222-8222-222222222222";
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
    .map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".dGVzdA";
  const value = "base64-" + Buffer.from(JSON.stringify({ access_token: token, refresh_token: "local-perf-only", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id } })).toString("base64url");
  return { name: "sb-127-auth-token", value, domain: "127.0.0.1", path: "/" };
}
async function measuredPage(browser, url, chartPayload) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: "block" });
  await context.addCookies([sessionCookie()]);
  const page = await context.newPage();
  const errors = [], chunks = [], headers = [], pending = [];
  let chartRequests = 0;
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (request.url().includes("/api/chart/")) chartRequests++; });
  page.on("response", response => {
    if (response.request().resourceType() === "document") pending.push(response.allHeaders().then(value => headers.push(value)));
    if (/\/_next\/static\/.*\.js(?:\?|$)/.test(response.url())) pending.push(response.body().then(body => chunks.push({
      path: new URL(response.url()).pathname, decodedBytes: body.length, sha256: createHash("sha256").update(body).digest("hex"),
      // A package-specific string survives production minification; excludes the small lazy loader.
      chartLibrary: body.includes(Buffer.from("Cannot update oldest data")),
    })));
  });
  await page.route("**/*", route => {
    const location = new URL(route.request().url());
    if (location.hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    if (chartPayload && location.pathname === "/api/chart/ADRO") return route.fulfill({ status: 200, contentType: "application/json", body: chartPayload,
      headers: { "Cache-Control": "private, no-store" } });
    return route.continue();
  });
  await page.addInitScript(() => {
    window.__chartBench = { lcp: null, painted: null };
    new PerformanceObserver(list => { const entries = list.getEntries(); window.__chartBench.lcp = entries.at(-1)?.startTime ?? null; }).observe({ type: "largest-contentful-paint", buffered: true });
    const watch = new MutationObserver(() => {
      if (document.querySelector('[data-testid="chart-canvas"] canvas')) {
        watch.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__chartBench.painted = performance.now(); }));
      }
    });
    watch.observe(document, { childList: true, subtree: true });
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    if (chartPayload) await page.waitForFunction(() => window.__chartBench.painted !== null, undefined, { timeout: 30000 });
    else await page.waitForSelector('.terminal-run[aria-label="Ringkasan run"]', { timeout: 15000 });
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    await Promise.all(pending);
    const metrics = await page.evaluate(() => ({ ...window.__chartBench,
      priceResponseEnd: performance.getEntriesByType("resource").filter(entry => entry.name.includes("/api/chart/")).at(-1)?.responseEnd ?? null,
      overflow: document.documentElement.scrollWidth > innerWidth,
      priceRequestCount: performance.getEntriesByType("resource").filter(entry => entry.name.includes("/api/chart/")).length,
      canvasCount: document.querySelectorAll('[data-testid="chart-canvas"] canvas').length,
    }));
    const result = { ...metrics, chartRequests, errors, chunks, documentHeaders: headers,
      decodedJsBytes: chunks.reduce((total, chunk) => total + chunk.decodedBytes, 0),
      chartLibraryBytes: chunks.filter(chunk => chunk.chartLibrary).reduce((total, chunk) => total + chunk.decodedBytes, 0),
      responseToTwoFramesMs: metrics.painted === null || metrics.priceResponseEnd === null ? null : metrics.painted - metrics.priceResponseEnd };
    if (chartPayload) await page.screenshot({ path: resolve(receipt, "chart-500-production.png") });
    return result;
  } finally { await context.close(); }
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
let browser;
try {
  await start(resolve(root, "tests/support/journal-dev.mjs"), root, "live");
  await fetch("http://127.0.0.1:3053/__scenario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: "scanner-complete" }) });
  const server = resolve(root, "tests/support/chart-performance-server.mjs");
  await start(server, manifest.baseline, "live", 3062); await start(server, manifest.final, "live", 3063);
  browser = await chromium.launch({ channel: "msedge", headless: true, env: chartPerformanceEnv("fixture") });
  const baseline = [], final = [];
  // Alternating fresh contexts reduces order/cache bias. Same browser/device/loopback network.
  for (let index = 0; index < 5; index++) {
    const pair = index % 2 ? [["final", 3063], ["baseline", 3062]] : [["baseline", 3062], ["final", 3063]];
    for (const [name, port] of pair) (name === "baseline" ? baseline : final).push(await measuredPage(browser, `http://127.0.0.1:${port}/scanner`));
  }
  await fetch("http://127.0.0.1:3053/__scenario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: "empty" }) });
  await start(server, manifest.final, "fixture", 3064);
  const payload = JSON.stringify(chartPerformanceFixture());
  const chart = await measuredPage(browser, "http://127.0.0.1:3064/chart/ADRO?context=latest&view=followup&limit=500&indicators=sma10,ema200,macd", payload);
  const baselineMedian = median(baseline.map(sample => sample.lcp));
  const finalMedian = median(final.map(sample => sample.lcp));
  const gates = {
    lcpMeasured: [...baseline, ...final].every(sample => Number.isFinite(sample.lcp) && sample.lcp > 0),
    scannerClosed: [...baseline, ...final].every(sample => sample.chartRequests === 0 && sample.chartLibraryBytes === 0 && sample.canvasCount === 0),
    scannerLcpWithin10Percent: finalMedian <= baselineMedian * 1.1,
    initialPayloadWithin1MiB: Buffer.byteLength(payload) <= 1024 * 1024,
    chart500Within500Ms: chart.responseToTwoFramesMs !== null && chart.responseToTwoFramesMs >= 0 && chart.responseToTwoFramesMs <= 500,
    oneChartPayload: chart.chartRequests === 1 && chart.priceRequestCount === 1,
    chartLibraryDetectedWhenOpen: chart.chartLibraryBytes > 0,
    noBrowserErrorsOrOverflow: [...baseline, ...final, chart].every(sample => !sample.errors.length && !sample.overflow),
  };
  const report = { ...manifest, measuredAt: new Date().toISOString(), syntheticOnly: true,
    device: { platform: platform(), arch: arch(), cpu: cpus()[0]?.model, cpuCount: cpus().length, memoryBytes: totalmem(), browser: await browser.version(), channel: "msedge", viewport: "1440x1000", network: "loopback, no throttling, isolated fresh context each run" },
    baseline, final, baselineMedianLcpMs: baselineMedian, finalMedianLcpMs: finalMedian,
    lcpDeltaPercent: (finalMedian / baselineMedian - 1) * 100,
    medianDecodedJsDeltaBytes: median(final.map(s => s.decodedJsBytes)) - median(baseline.map(s => s.decodedJsBytes)),
    chart500: chart, initialPayloadBytes: Buffer.byteLength(payload), gates,
    status: Object.values(gates).every(Boolean) ? "PASS" : "NO-GO", limitations: ["Synthetic loopback transport; no production/cloud latency proof", "Canvas paint proxy uses observed canvas creation plus two animation frames", "Source snapshots are pinned by manifest fingerprints; no working tree build"] };
  await writeFile(resolve(receipt, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ receipt, status: report.status, baselineMedian, finalMedian, initialPayloadBytes: report.initialPayloadBytes, renderMs: chart.responseToTwoFramesMs, gates }, null, 2));
  if (report.status !== "PASS") process.exitCode = 1;
} finally {
  await browser?.close();
  for (const child of children.reverse()) await stop(child);
}
