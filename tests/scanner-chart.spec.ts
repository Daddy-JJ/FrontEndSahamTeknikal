import { expect, test } from "@playwright/test";
import { chartFailure } from "../src/lib/chart-reader";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseChartEnvelope, type ChartData } from "../src/lib/chart-contract";

// Isolated HTTP double only: explicitly synthetic, never used by application
// source or as a production fallback. Date remapping keeps all cutoffs coherent.
function syntheticScannerChart(url: URL) {
  const raw = parseChartEnvelope(JSON.parse(readFileSync(join(__dirname, "fixtures", "ticker-chart-v1.json"), "utf8")), "fixture", "DEMO-A");
  if (!raw?.success) throw Error("synthetic chart fixture invalid");
  const original = raw.data;
  const days = ["2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-28"];
  const mappedDay = (value: string) => days[original.sessions.indexOf(value)];
  const followup = url.searchParams.get("view") === "followup";
  const cutoff = followup ? "2026-09-29" : "2026-09-28";
  const sessions = followup ? [...days, cutoff] : days;
  const mappedBars = original.bars.map(bar => ({ ...bar, session: mappedDay(bar.session) }));
  const bars = followup ? [...mappedBars, { ...mappedBars.at(-1)!, session: cutoff }] : mappedBars;
  const signalSource = { ...original.source, provider: "yfinance", scope: "forward", price_basis: "unadjusted",
    provider_version: "synthetic-http-double-test-only", history_start: "2026-08-03", resolved_cutoff: "2026-09-28", last_market_session: "2026-09-28",
    fetched_at: "2026-09-28T14:00:00Z", stored_at: "2026-09-28T14:00:00Z" };
  const indicators = Object.fromEntries(Object.entries(original.indicators).map(([key, indicator]) => {
    const points = indicator.points.map(point => ({ ...point, session: mappedDay(point.session) }));
    return [key, { ...indicator, eligible_from: indicator.eligible_from ? "2026-08-17" : null,
      points: followup ? [...points, { ...points.at(-1)!, session: cutoff }] : points }];
  })) as ChartData["indicators"];
  const data = { ...original, ticker: "TEST001", data_mode: "live", sessions, bars, indicators, revision: (followup ? "9" : "8").repeat(64),
    signal_source: signalSource, source: followup ? { ...signalSource, resolved_cutoff: cutoff, last_market_session: cutoff,
      series_id: "88888888-8888-4888-8888-888888888888", input_digest: "f".repeat(64), resolved_input_digest: "f".repeat(64),
      fetched_at: "2026-09-29T14:00:00Z", stored_at: "2026-09-29T14:00:00Z" } : signalSource,
    context: { ...original.context, kind: "signal", id: url.searchParams.get("context_id"), view: followup ? "followup" : "snapshot",
      signal_session: "2026-09-28", snapshot_cutoff: followup ? null : "2026-09-28", engine_source_revision: "synthetic-http-engine-test-only" },
    quality: { ...original.quality, expected_session: cutoff },
    pagination: { ...original.pagination, window_from: days[0], window_to: cutoff, limit: 250, returned_slots: sessions.length, has_more: false, next_cursor: null } };
  const result = { ...raw, data };
  if (!parseChartEnvelope(result, "live", "TEST001")) throw Error("synthetic remapping violates chart contract");
  return result;
}

const runId = "11111111-1111-4111-8111-111111111111";
test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  const userId = "22222222-2222-4222-8222-222222222222";
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: userId, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
    .map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".dGVzdA";
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify({ access_token: token,
    refresh_token: "local-test-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId } })).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
});

test("scanner reasons stay lazy; selected chart keeps canonical identity, URL, refresh and back", async ({ page }) => {
  const chartRequests: URL[] = [];
  await page.route("**/api/chart/**", async route => {
    chartRequests.push(new URL(route.request().url()));
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify(chartFailure("BACKEND_NOT_READY", "scanner-local-test")) });
  });
  const parent = `/scanner?run=${runId}&section=signals&page=1&date=2026-09-28&strategy=FRACTAL_BREAKOUT_V1`;
  await page.goto(parent);
  const first = page.getByRole("button", { name: "Detail TEST001", exact: true });
  await first.click();
  const detail = page.locator("#scanner-detail");
  await expect(detail.getByRole("tab", { name: "Alasan sinyal", exact: true })).toHaveAttribute("aria-selected", "true");
  expect(chartRequests).toHaveLength(0);
  const selected = new URL(page.url());
  expect(selected.searchParams.get("detail_kind")).toBe("signal");
  expect(selected.searchParams.get("detail")).toMatch(/^[a-f0-9]{64}$/);
  await detail.getByRole("tab", { name: "Chart", exact: true }).click();
  await expect(detail.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  expect(chartRequests).toHaveLength(1);
  expect(chartRequests[0].searchParams.get("context")).toBe("signal");
  expect(chartRequests[0].searchParams.get("context_id")).toBe(selected.searchParams.get("detail"));
  expect(chartRequests[0].searchParams.get("view")).toBe("snapshot");
  const enlarged = new URL(await detail.getByRole("link", { name: /Perbesar chart/ }).getAttribute("href") ?? "", page.url());
  expect(enlarged.searchParams.get("return_to")).toContain(`run=${runId}`);
  expect(enlarged.searchParams.get("return_to")).toContain("strategy=FRACTAL_BREAKOUT_V1");
  await page.reload();
  await expect(detail.getByRole("tab", { name: "Chart", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(detail.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detail).not.toBeVisible();
  const closed = new URL(page.url());
  expect(closed.searchParams.get("detail")).toBeNull();
  for (const [key, value] of new URL(parent, page.url()).searchParams) expect(closed.searchParams.get(key)).toBe(value);
  await first.click();
  await detail.getByRole("tab", { name: "Data & sumber", exact: true }).click();
  await expect(detail.getByRole("heading", { name: "Sumber keputusan tersimpan" })).toBeVisible();
  await page.goBack();
  await expect(detail).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("quality chart is explicitly latest and invalid or off-page selection has no chart request", async ({ page, request }) => {
  const chartRequests: URL[] = [];
  await page.route("**/api/chart/**", async route => {
    chartRequests.push(new URL(route.request().url()));
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify(chartFailure("BACKEND_NOT_READY", "scanner-local-test")) });
  });
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-failed" } });
  await page.goto(`/scanner?run=${runId}&section=quality&page=1&detail=TEST001&detail_kind=quality&panel=chart`);
  const detail = page.locator("#scanner-detail");
  await expect(detail.getByText(/Chart harga terbaru, bukan snapshot run terpilih/)).toBeVisible();
  await expect(detail.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  expect(chartRequests).toHaveLength(1);
  expect(chartRequests[0].searchParams.get("context")).toBe("latest");
  expect(chartRequests[0].searchParams.has("context_id")).toBe(false);
  await detail.getByRole("button", { name: /^(?:Tutup detail|Kembali ke daftar, tutup detail) TEST001$/ }).click();
  await expect(page.getByRole("button", { name: "Detail TEST001", exact: true })).toBeFocused();
  await page.goto(`/scanner?run=${runId}&section=quality&page=2&detail=TEST001&detail_kind=quality&panel=chart`);
  await expect(page.getByText(/Detail yang dipilih tidak tersedia pada halaman ini/)).toBeVisible();
  expect(chartRequests).toHaveLength(1);
  await page.goto(`/scanner?run=${runId}&section=quality&detail=../bad&detail_kind=quality&panel=chart`);
  await expect(page.getByRole("heading", { name: "Halaman scanner tidak valid" })).toBeVisible();
  expect(chartRequests).toHaveLength(1);
});

test("full chart roundtrip restores scanner cohort and table scroll without storing financial data", async ({ page }) => {
  await page.route("**/api/chart/**", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify(chartFailure("BACKEND_NOT_READY", "scanner-local-test")) }));
  await page.goto(`/scanner?run=${runId}&section=signals&page=1&date=2026-09-28&strategy=FRACTAL_BREAKOUT_V1`);
  await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
  const detail = page.locator("#scanner-detail");
  await detail.getByRole("tab", { name: "Chart", exact: true }).click();
  await expect(detail.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  const expectedMatrix = await page.locator(".terminal-matrix").evaluate((matrix: HTMLElement) => {
    matrix.scrollTop = 150; matrix.scrollLeft = 150;
    return { top: matrix.scrollTop, left: matrix.scrollLeft, maxLeft: matrix.scrollWidth - matrix.clientWidth };
  });
  await page.evaluate(() => window.scrollTo({ top: 100 }));
  await detail.getByRole("link", { name: /Perbesar chart/ }).click();
  await expect(page).toHaveURL(/\/chart\/TEST001\?/);
  const stored = await page.evaluate(() => {
    const key = Object.keys(sessionStorage).find(key => key.startsWith("scanner.ui.scroll.v1:"));
    return key ? JSON.parse(sessionStorage.getItem(key)!) : null;
  });
  expect(stored).not.toBeNull();
  expect(Object.keys(stored).sort()).toEqual(["matrixLeft", "matrixTop", "windowY"]);
  expect(stored.matrixLeft).toBe(expectedMatrix.left);
  expect(stored.matrixTop).toBe(expectedMatrix.top);
  if (expectedMatrix.maxLeft > 0) expect(stored.matrixLeft).toBeGreaterThan(0);
  await page.getByRole("link", { name: /Kembali ke daftar asal/ }).click();
  await expect(page.locator("#scanner-detail").getByRole("tab", { name: "Chart", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect.poll(() => page.locator(".terminal-matrix").evaluate(matrix => matrix.scrollLeft)).toBe(stored.matrixLeft);
  await expect.poll(() => page.locator(".terminal-matrix").evaluate(matrix => matrix.scrollTop)).toBe(stored.matrixTop);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(stored.windowY);
  const restored = new URL(page.url());
  expect(restored.searchParams.get("run")).toBe(runId);
  expect(restored.searchParams.get("date")).toBe("2026-09-28");
  expect(restored.searchParams.get("strategy")).toBe("FRACTAL_BREAKOUT_V1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("integrated scanner canvas renders explicit synthetic prices and snapshot/followup safely", async ({ page }, testInfo) => {
  const reads: URL[] = [], errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/chart/**", route => {
    const url = new URL(route.request().url());
    reads.push(url);
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(syntheticScannerChart(url)) });
  });
  await page.goto(`/scanner?run=${runId}&section=signals&page=1`);
  await page.evaluate(() => {
    const notice = document.createElement("div");
    notice.dataset.syntheticChartProof = "true";
    notice.textContent = "TEST HTTP DOUBLE — DATA HARGA SINTETIS";
    notice.setAttribute("style", "position:fixed;bottom:4px;left:4px;z-index:100000;background:#332400;color:#ffce75;border:1px solid #ffce75;padding:5px;font:12px monospace");
    document.body.append(notice);
  });
  const ticker = page.getByRole("button", { name: "Detail TEST001", exact: true });
  await ticker.click();
  const detail = page.locator("#scanner-detail");
  expect(reads).toHaveLength(0);
  await detail.getByRole("tab", { name: "Chart", exact: true }).click();
  await expect(detail.getByTestId("chart-canvas").locator("canvas").first()).toBeVisible();
  await page.evaluate(() => {
    const notice = document.querySelector("[data-synthetic-chart-proof]");
    if (notice) document.querySelector("#scanner-detail")?.append(notice);
  });
  await expect(detail.getByText("TEST HTTP DOUBLE — DATA HARGA SINTETIS", { exact: true })).toBeVisible();
  if (testInfo.project.name === "tablet") {
    const bounds = await detail.boundingBox();
    expect(bounds?.width, "Tablet chart drawer needs enough space for the plot").toBeGreaterThanOrEqual(640);
  }
  expect(reads).toHaveLength(1);
  expect(reads[0].searchParams.get("context_id")).toBe("1".padStart(64, "0"));
  await expect(detail.getByRole("checkbox", { name: "EMA200", exact: true })).not.toBeChecked();
  await expect(detail.getByRole("checkbox", { name: "MACD", exact: true })).not.toBeChecked();
  await detail.getByRole("checkbox", { name: "EMA200", exact: true }).check();
  await detail.getByRole("checkbox", { name: "MACD", exact: true }).check();
  const full = new URL(await detail.getByRole("link", { name: /Perbesar chart/ }).getAttribute("href") ?? "", page.url());
  expect(full.searchParams.get("indicators")).toBe("ema200,macd");
  await detail.getByText("Tabel OHLC & indikator — alternatif canvas", { exact: true }).click();
  await expect(detail.getByRole("row").filter({ hasText: "2026-09-28" })).toContainText("Rp1.146,5344");
  await expect(detail.getByRole("row").filter({ hasText: "2026-09-29" })).toHaveCount(0);
  await detail.getByText("Tabel OHLC & indikator — alternatif canvas", { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Capture the actual viewport after restoring the pane header. Full-page
  // capture expands a fixed native dialog and can conceal its real mobile UX.
  await detail.getByRole("tabpanel").evaluate((pane: HTMLElement) => { pane.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath(`scanner-chart-integrated-${testInfo.project.name}.png`), fullPage: false });
  if (testInfo.project.name !== "desktop") {
    await detail.getByTestId("chart-canvas").scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`scanner-chart-plot-${testInfo.project.name}.png`), fullPage: false });
  }
  await detail.getByRole("button", { name: "Perkembangan", exact: true }).click();
  await expect(detail.getByText(/Harga sampai 2026-09-29/)).toBeVisible();
  expect(reads).toHaveLength(2);
  expect(reads[1].searchParams.get("view")).toBe("followup");
  await detail.getByRole("button", { name: "Saat sinyal", exact: true }).click();
  await expect(detail.getByText(/Harga sampai 2026-09-28/)).toBeVisible();
  expect(reads).toHaveLength(3);
  expect(reads[2].searchParams.get("view")).toBe("snapshot");
  await page.keyboard.press("Escape");
  await expect(detail).not.toBeVisible();
  await expect(ticker).toBeFocused();
  expect(errors).toEqual([]);
});

test("workspace keeps equal stable panes across tabs and explicit expand", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop geometry uses CSS viewport pixels");
  let reads = 0;
  await page.route("**/api/chart/**", route => {
    reads++;
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify(chartFailure("BACKEND_NOT_READY", "layout-test")) });
  });
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/scanner?run=${runId}&section=signals&page=1`);
    await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
    const detail = page.locator("#scanner-detail");
    const results = page.locator(".terminal-results");
    const first = await results.boundingBox();
    expect(first).not.toBeNull();
    for (const name of ["Alasan sinyal", "Chart", "Data & sumber"]) {
      await detail.getByRole("tab", { name, exact: true }).click();
      const left = (await results.boundingBox())!, right = (await detail.boundingBox())!;
      expect(Math.abs(left.width - right.width), `${width}px equal pane width on ${name}`).toBeLessThanOrEqual(2);
      for (const box of [left, right]) {
        expect(Math.abs(box.y - first!.y)).toBeLessThanOrEqual(2);
        expect(Math.abs(box.height - first!.height)).toBeLessThanOrEqual(2);
      }
    }
    const beforeExpand = reads;
    await detail.getByRole("button", { name: "Perbesar detail", exact: true }).click();
    await expect(results).not.toBeVisible();
    await expect(detail.getByRole("tab", { name: "Data & sumber", exact: true })).toHaveAttribute("aria-selected", "true");
    await detail.getByRole("button", { name: "Kembali 50:50", exact: true }).click();
    await expect(results).toBeVisible();
    expect(reads).toBe(beforeExpand);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("chart survives breakpoint and expand during an in-flight price request", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One controlled desktop/mobile roundtrip");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  let reads = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/chart/**", async route => {
    reads++;
    await gate;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(syntheticScannerChart(new URL(route.request().url()))) });
  });
  try {
    await page.goto(`/scanner?run=${runId}&section=signals&page=1`);
    const ticker = page.getByRole("button", { name: "Detail TEST001", exact: true });
    await ticker.click();
    const detail = page.locator("#scanner-detail");
    await detail.getByRole("tab", { name: "Chart", exact: true }).click();
    await expect.poll(() => reads).toBe(1);
    await detail.getByRole("button", { name: "Perbesar detail", exact: true }).click();
    for (const width of [1279, 1280, 1279]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(detail).toBeVisible();
      await expect.poll(() => detail.evaluate(node => node.matches(":modal"))).toBe(width < 1280);
    }
    release();
    await expect(detail.getByTestId("chart-canvas").locator("canvas").first()).toBeVisible();
    expect(reads).toBe(1);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(detail.getByRole("button", { name: "Kembali 50:50", exact: true })).toBeVisible();
    await expect(page.locator(".terminal-results")).not.toBeVisible();
    await detail.getByRole("button", { name: "Kembali 50:50", exact: true }).click();
    await expect(page.locator(".terminal-results")).toBeVisible();
    expect(reads).toBe(1);
    await page.keyboard.press("Escape");
    await expect(detail).not.toBeVisible();
    await expect(ticker).toBeFocused();
    await ticker.click();
    await expect(detail.getByRole("button", { name: "Perbesar detail", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally { release(); }
});

test("split quality table keeps ticker visible and scrolls independently of details", async ({ page, request }, info) => {
  test.skip(info.project.name !== "desktop", "Split-table geometry is desktop only");
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-failed" } });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/scanner?run=${runId}&section=quality&page=1`);
  await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
  const detail = page.locator("#scanner-detail");
  await detail.getByRole("tab", { name: "Data & sumber", exact: true }).click();
  const body = detail.getByRole("tabpanel");
  const before = await body.evaluate(node => node.scrollTop);
  const matrix = page.locator(".terminal-matrix");
  await matrix.evaluate(node => { node.scrollLeft = 300; node.scrollTop = 100; });
  expect(await matrix.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  const firstCell = (await matrix.locator("tbody td").first().boundingBox())!;
  const bounds = (await matrix.boundingBox())!;
  expect(Math.abs(firstCell.x - bounds.x)).toBeLessThanOrEqual(2);
  expect(await body.evaluate(node => node.scrollTop)).toBe(before);
  await expect(page.getByRole("navigation", { name: "Halaman scanner", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("mobile detail keeps a single full-screen frame and reachable tabs", async ({ page }, info) => {
  test.skip(info.project.name === "desktop", "Touch/tablet modal frame");
  await page.route("**/api/chart/**", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify(chartFailure("BACKEND_NOT_READY", "layout-mobile-test")) }));
  await page.goto(`/scanner?run=${runId}&section=signals&page=1`);
  const ticker = page.getByRole("button", { name: "Detail TEST001", exact: true });
  await ticker.click();
  const detail = page.locator("#scanner-detail");
  const first = (await detail.boundingBox())!;
  expect(first.width).toBe(page.viewportSize()!.width);
  for (const name of ["Alasan sinyal", "Chart", "Data & sumber"]) {
    await detail.getByRole("tab", { name, exact: true }).click();
    const next = (await detail.boundingBox())!;
    expect(next).toEqual(first);
    await detail.getByRole("tabpanel").evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect(detail.getByRole("tablist")).toBeInViewport();
    await expect(detail.getByRole("button", { name: /^(?:Tutup detail|Kembali ke daftar, tutup detail) TEST001$/ })).toBeInViewport();
  }
  await expect(detail.getByRole("button", { name: "Perbesar detail", exact: true })).toHaveCount(0);
  await detail.getByRole("tabpanel").focus();
  await expect(detail.getByRole("tabpanel")).toBeFocused();
  await detail.getByRole("tab", { name: "Data & sumber", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(detail.getByRole("tab", { name: "Alasan sinyal", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(detail.getByRole("tab", { name: "Data & sumber", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(detail).not.toBeVisible();
  await expect(ticker).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("detail body scroll resets for a new ticker without changing the selected tab", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Select another ticker from the split list");
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto(`/scanner?run=${runId}&section=signals&page=1`);
  await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
  const detail = page.locator("#scanner-detail");
  const body = detail.getByRole("tabpanel");
  await body.evaluate(node => { node.scrollTop = node.scrollHeight; });
  expect(await body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Detail TEST002", exact: true }).click();
  await expect(detail.getByRole("heading", { name: "Detail TEST002", exact: true })).toBeVisible();
  await expect.poll(() => body.evaluate(node => node.scrollTop)).toBe(0);
  await expect(detail.getByRole("tab", { name: "Alasan sinyal", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("workspace remains usable at 200 percent CSS zoom on a short viewport", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Explicit CSS zoom stress, not browser-chrome zoom");
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.route("**/api/chart/**", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify(chartFailure("BACKEND_NOT_READY", "zoom-layout-test")) }));
  await page.goto(`/scanner?run=${runId}&section=signals&page=1`);
  await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const detail = page.locator("#scanner-detail");
  for (const name of ["Alasan sinyal", "Chart", "Data & sumber"]) {
    await detail.getByRole("tab", { name, exact: true }).click();
    await expect(detail.getByRole("tab", { name, exact: true })).toBeInViewport();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await detail.getByRole("tabpanel").focus();
  await expect(detail.getByRole("tabpanel")).toBeFocused();
  await detail.getByRole("button", { name: "Perbesar detail", exact: true }).click();
  await expect(page.locator(".terminal-results")).not.toBeVisible();
  await detail.getByRole("button", { name: "Kembali 50:50", exact: true }).click();
  await expect(page.locator(".terminal-results")).toBeVisible();
});
