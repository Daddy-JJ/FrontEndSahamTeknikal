import { test, expect } from "@playwright/test";
import { chartFixture } from "../src/lib/chart-fixture";
const ownerId = "22222222-2222-4222-8222-222222222222";
test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "reporting-ready" } });
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: ownerId, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
    .map(v => Buffer.from(JSON.stringify(v)).toString("base64url")).join(".") + ".dGVzdA";
  const session = { access_token: token, refresh_token: "local-test-refresh", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: ownerId } };
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
});
test("paper detail chart is explicit, preserves source trade and does not change ledger facts", async ({ page, request }) => {
  let chartCalls = 0;
  await page.route("**/api/chart/TEST?**", route => {
    chartCalls++;
    const url = new URL(route.request().url());
    expect(url.searchParams.get("context")).toBe("paper");
    expect(url.searchParams.get("context_id")).toBe("paper-test-v1");
    expect(url.searchParams.get("view")).toBe("followup");
    const response = chartFixture();
    if (!response.success) throw Error("fixture");
    const data = response.data;
    return route.fulfill({ json: { ...response, data: { ...data, ticker: "TEST", context: {
      ...data.context, kind: "paper", id: "paper-test-v1", signal_session: "2026-10-12", experiment: "ma10",
    }, signal_source: data.source } } });
  });
  const returnTo = "/analytics?tab=paper&from=2026-09-01&exit_key=ma10&strategy=MACD_EMA200_V1&page=2";
  await page.goto("/journal/paper/paper-test-v1?return_to=" + encodeURIComponent(returnTo));
  await expect(page.getByRole("link", { name: "Kembali ke hasil" })).toHaveAttribute("href", returnTo);
  const facts = await page.locator(".journal-facts").innerText();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  expect(chartCalls).toBe(0);
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  expect(chartCalls).toBe(1);
  expect(await page.locator(".journal-facts").innerText()).toBe(facts);
  await expect(page.getByRole("checkbox", { name: "SMA10", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Tutup chart" }).click();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await (await request.get("http://127.0.0.1:3053/__calls")).json()).mutations).toEqual([]);
});
test("analytics chart links preserve cohort and never load per-row charts", async ({ page }) => {
  let chartCalls = 0;
  page.on("request", req => { if (req.url().includes("/api/chart/")) chartCalls++; });
  await page.goto("/analytics?tab=actual&from=2026-09-01&to=2026-09-30&exit_snapshot=fixed2r");
  const link = page.locator(".reporting-trades").getByRole("link", { name: "Chart TEST" });
  const href = new URL((await link.getAttribute("href"))!, "http://127.0.0.1");
  expect(href.pathname).toBe("/chart/TEST");
  expect(href.searchParams.get("context")).toBe("actual");
  expect(href.searchParams.get("context_id")).toBe("11111111-1111-4111-8111-111111111111");
  expect(href.searchParams.get("return_to")).toContain("exit_snapshot=fixed2r");
  const detailHref = await page.locator(".reporting-trades").getByRole("link", { name: "Lihat →" }).getAttribute("href");
  expect(new URL(detailHref!, "http://127.0.0.1").searchParams.get("return_to")).toContain("from=2026-09-01");
  expect(chartCalls).toBe(0);
  await page.goto("/analytics?tab=signals&strategy=MACD_EMA200_V1");
  const signalChart = page.locator("#signal-observations").getByRole("link", { name: "Chart TEST Chart saat sinyal" }).first();
  const signalHref = new URL((await signalChart.getAttribute("href"))!, "http://127.0.0.1");
  expect(signalHref.searchParams.get("context")).toBe("signal");
  expect(signalHref.searchParams.get("view")).toBe("snapshot");
  expect(signalHref.searchParams.get("context_id")).toMatch(/^[a-f0-9]{64}$/);
  expect(signalHref.searchParams.get("return_to")).toContain("tab=signals");
  expect(chartCalls).toBe(0);
});
test("actual detail chart stays separate and fails explicitly without mutating manual forms", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "draft" } });
  let chartCalls = 0;
  await page.route("**/api/chart/TEST?**", route => {
    chartCalls++;
    const url = new URL(route.request().url());
    expect(url.searchParams.get("context")).toBe("actual");
    expect(url.searchParams.get("context_id")).toBe("11111111-1111-4111-8111-111111111111");
    return route.fulfill({ status: 503, json: { contract_version: "ticker-chart-v1", success: false, data: null,
      error: { code: "BACKEND_NOT_READY", message: "not_ready", request_id: "fixture", retryable: true } } });
  });
  await page.goto("/journal/11111111-1111-4111-8111-111111111111?return_to=" + encodeURIComponent("/analytics?tab=actual&exit_snapshot=fixed2r"));
  const facts = await page.locator(".journal-metrics").innerText();
  expect(chartCalls).toBe(0);
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Catat pembelian" })).toBeVisible();
  expect(await page.locator(".journal-metrics").innerText()).toBe(facts);
  expect(chartCalls).toBe(1);
  expect((await (await request.get("http://127.0.0.1:3053/__calls")).json()).mutations).toEqual([]);
});
test("analytics chart roundtrip restores the exact cohort and UI scroll once", async ({ page }) => {
  await page.route("**/api/chart/TEST?**", route => {
    const response = chartFixture();
    if (!response.success) throw Error("fixture");
    return route.fulfill({ json: { ...response, data: { ...response.data, ticker: "TEST", context: {
      ...response.data.context, kind: "actual", id: "11111111-1111-4111-8111-111111111111",
    } } } });
  });
  const source = "/analytics?tab=actual&from=2026-09-01&to=2026-09-30&exit_snapshot=fixed2r";
  await page.goto(source);
  const chartLink = page.locator(".reporting-trades").getByRole("link", { name: "Chart TEST", exact: true });
  await chartLink.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>(".table-scroll").forEach(table => { table.scrollLeft = Math.min(100, table.scrollWidth - table.clientWidth); });
  });
  await chartLink.click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("chart-return-ui-v1:fixture") ?? "null"));
  expect(saved).not.toBeNull();
  expect(saved.y).toBeGreaterThan(0);
  expect(saved.page).toContain("exit_snapshot=fixed2r");
  expect(Object.keys(saved).sort()).toEqual(["mode", "page", "recordedAt", "regions", "version", "y"]);
  await page.getByRole("link", { name: "← Kembali ke daftar asal", exact: true }).click();
  await expect(page).toHaveURL(/\/analytics\?/);
  expect(new URL(page.url()).searchParams.get("exit_snapshot")).toBe("fixed2r");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("chart-return-ui-v1:fixture"))).toBeNull();
  expect(await page.evaluate(() => Math.floor(window.scrollY))).toBeCloseTo(saved.y, -1);
  const positions = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".reporting-list, .table-scroll, .journal-table-scroll")].slice(0, 24).map(table => ({ left: Math.floor(table.scrollLeft), top: Math.floor(table.scrollTop) })));
  for (const region of saved.regions) expect(positions[region.index]).toEqual({ left: region.left, top: region.top });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("disabled position storage is benign and navigation remains usable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, "sessionStorage", { configurable: true,
    get() { throw new DOMException("synthetic storage disabled", "SecurityError"); } }));
  await page.route("**/api/chart/TEST?**", route => route.fulfill({ status: 503, json: {
    contract_version: "ticker-chart-v1", success: false, data: null,
    error: { code: "BACKEND_NOT_READY", message: "not_ready", request_id: "fixture", retryable: true },
  } }));
  await page.goto("/analytics?tab=actual&exit_snapshot=fixed2r");
  await expect(page.locator(".analytics-stat-card").first()).toContainText("Rp1.000");
  await page.locator(".reporting-trades").getByRole("link", { name: "Chart TEST", exact: true }).click();
  await expect(page.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "← Kembali ke daftar asal", exact: true }).click();
  await expect(page).toHaveURL(/exit_snapshot=fixed2r/);
  await expect(page.locator(".analytics-stat-card").first()).toContainText("Rp1.000");
  expect(errors).toEqual([]);
});
