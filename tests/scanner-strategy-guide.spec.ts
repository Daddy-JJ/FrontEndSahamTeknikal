import { expect, test } from "@playwright/test";

const fixture = "http://127.0.0.1:3053";
const ids = ["MACD_EMA200_V1", "FRACTAL_BREAKOUT_V1", "RS_BREAKOUT_V1", "PULLBACK_RECLAIM_V1"];

test.beforeEach(async ({ context, request }) => {
  await request.post(fixture + "/__scenario", { data: { scenario: "scanner-complete" } });
  const userId = "22222222-2222-4222-8222-222222222222";
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: userId, aud: "authenticated", role: "authenticated", exp: expiry }]
    .map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".dGVzdA";
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify({
    access_token: token, refresh_token: "local-test-refresh", expires_at: expiry, user: { id: userId },
  })).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
});

test("strategy guide follows compact signal results without new data requests", async ({ page, request }, info) => {
  const errors: string[] = [];
  const chartRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", req => { if (new URL(req.url()).pathname.startsWith("/api/chart/")) chartRequests.push(req.url()); });
  await page.goto("/scanner?page=2");
  const guide = page.locator("#scanner-strategy-guide");
  await expect(guide).toBeVisible();
  for (const id of ids) {
    const card = guide.locator(`article[data-strategy="${id}"]`);
    await expect(card).toContainText(id);
    for (const label of ["Pemicu entry", "SL awal", "Fixed 2R", "SMA10", "Exit · dua eksperimen terpisah"]) await expect(card).toContainText(label);
  }
  for (const copy of ["baseline", "close hari sinyal", "0,15%", "0,25%"]) await expect(guide).toContainText(copy);
  await expect(guide).toContainText("dikeluarkan dari statistik utama");
  expect(await guide.evaluate(element => !element.closest(".terminal-workspace") && !!element.previousElementSibling?.matches(".terminal-workspace"))).toBe(true);
  if (test.info().project.name === "desktop") expect((await page.locator(".terminal-matrix").boundingBox())!.height).toBeLessThan(200);
  const before = await (await request.get(fixture + "/__calls")).json();
  await page.screenshot({ path: `test-results/scanner-guide-compact-${info.project.name}.png`, fullPage: true });
  await guide.getByText("Aturan lengkap dan syarat data", { exact: true }).first().click();
  const after = await (await request.get(fixture + "/__calls")).json();
  expect(after).toEqual(before);
  expect(after.mutations).toEqual([]);
  expect(after.calls.filter((call: { path: string }) => call.path.endsWith("scan_run_signals"))).toHaveLength(1);
  expect(after.calls.some((call: { path: string }) => /scan_run_items|read_chart/.test(call.path))).toBe(false);
  expect(errors).toEqual([]);
  expect(chartRequests).toEqual([]);
});

test("strategy cards reflow and stay below the unchanged detail workspace", async ({ page }, info) => {
  await page.goto("/scanner");
  const guide = page.locator("#scanner-strategy-guide");
  for (const [width, columns] of [[1440, 4], [1024, 2], [390, 1], [320, 1]]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(guide).toBeVisible();
    await expect.poll(() => guide.locator("[data-strategy-cards]").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: info.project.name === "desktop" ? 1440 : 390, height: 900 });
  const disclosure = guide.locator("summary").first();
  await disclosure.focus();
  await disclosure.press("Enter");
  await expect(disclosure.locator("..")).toHaveAttribute("open", "");
  expect((await disclosure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: `test-results/scanner-guide-${info.project.name}.png`, fullPage: true });
  if (info.project.name === "desktop") {
    await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
    await expect(page.locator(".terminal-workspace")).toHaveClass(/has-detail/);
    await expect.poll(async () => {
      const [box, cards] = await Promise.all([page.locator(".terminal-workspace").boundingBox(), guide.boundingBox()]);
      return cards!.y >= box!.y + box!.height;
    }).toBe(true);
  }
});

test("guide is educational on zero results and absent from quality and preparing states", async ({ page, request }) => {
  await request.post(fixture + "/__scenario", { data: { scenario: "scanner-no-signals" } });
  await page.goto("/scanner?section=signals");
  await expect(page.locator("#scanner-strategy-guide article")).toHaveCount(4);
  await request.post(fixture + "/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner?section=signals&strategy=MACD_EMA200_V1");
  await expect(page.locator(".terminal-empty")).toContainText("Tidak ada sinyal yang diterbitkan untuk strategi ini");
  await expect(page.locator("#scanner-strategy-guide article")).toHaveCount(4);
  await page.goto("/scanner?section=quality");
  await expect(page.locator("#scanner-strategy-guide")).toHaveCount(0);
  await request.post(fixture + "/__scenario", { data: { scenario: "scanner-partial" } });
  await page.goto("/scanner?section=signals");
  await expect(page.locator(".terminal-notice")).toContainText("Evaluasi parsial");
  await expect(page.locator("#scanner-strategy-guide article")).toHaveCount(4);
  await request.post(fixture + "/__scenario", { data: { scenario: "scanner-failed" } });
  await page.goto("/scanner?section=signals");
  await expect(page.getByRole("heading", { name: "Scan gagal", exact: true })).toBeVisible();
  await expect(page.locator("#scanner-strategy-guide article")).toHaveCount(4);
  await expect(page.locator(".terminal-notice")).toContainText("Run gagal");
  await request.post(fixture + "/__scenario", { data: { scenario: "scanner-empty" } });
  await page.goto("/scanner");
  await expect(page.locator("#scanner-strategy-guide")).toHaveCount(0);
});
