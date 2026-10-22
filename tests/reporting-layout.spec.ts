import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "reporting-ready" } });
  const id = "22222222-2222-4222-8222-222222222222";
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
    .map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".dGVzdA";
  const session = { access_token: token, refresh_token: "local-test-refresh", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id } };
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
});

test("journal modes share navigation and full-width compact filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const tab of ["paper", "actual"]) {
    await page.goto("/journal?tab=" + tab);
    const tabs = page.getByRole("navigation", { name: "Mode Jurnal", exact: true });
    await expect(tabs).toBeVisible();
    await expect(tabs.locator('a[aria-current="page"]')).toHaveAttribute("href", "/journal?tab=" + tab);
    const main = await page.locator(".journal-main").boundingBox();
    const filter = page.locator(".reporting-filter-panel");
    await expect(filter).toBeVisible();
    const bounds = await filter.boundingBox();
    expect(bounds!.width).toBeGreaterThan(main!.width * 0.94);
    const inputTops = await filter.locator('input:not([type="hidden"]),select,button[type="submit"]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().bottom));
    expect(Math.max(...inputTops) - Math.min(...inputTops)).toBeLessThan(3);
    await expect(filter.locator("form")).toHaveAttribute("method", "get");
  }
});

test("reporting tables stay semantic and contain horizontal scrolling on narrow screens", async ({ page }, info) => {
  for (const route of ["/journal?tab=paper", "/journal?tab=actual", "/analytics?tab=paper", "/analytics?tab=actual", "/analytics?tab=signals"]) {
    await page.goto(route);
    const regions = page.locator(".reporting-table-region");
    expect(await regions.count()).toBeGreaterThan(0);
    for (const width of [1280, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const regionsFit = await regions.evaluateAll(nodes => nodes.every(node => {
        const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
        return rect.left >= -1 && rect.right <= innerWidth + 1 && ["auto", "scroll"].includes(style.overflowX)
          && node.getAttribute("role") === "region" && node.getAttribute("tabindex") === "0" && Boolean(node.getAttribute("aria-label"));
      }));
      expect(regionsFit, route + " table containment at " + width).toBe(true);
      expect(await regions.locator("table").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).display === "table"))).toBe(true);
      expect(await regions.locator("tbody tr").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).display === "table-row"))).toBe(true);
    }
    if (route === "/journal?tab=paper") {
      await page.setViewportSize({ width: info.project.name === "mobile" ? 390 : 1280, height: 900 });
      await page.screenshot({ path: "test-results/reporting-layout-journal-" + info.project.name + ".png", fullPage: true });
    }
  }
});

test("analytics curve and strategy share a row only on wide screens without extra reads", async ({ page, request }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydration/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/analytics?tab=paper");
  const curve = page.getByRole("heading", { name: "Kurva P&L net kumulatif", exact: true }).locator("..");
  const strategies = page.getByRole("heading", { name: "Performa per strategi", exact: true }).locator("..");
  for (const width of [1440, 1280, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const a = await curve.boundingBox(), b = await strategies.boundingBox();
    if (width >= 1280) {
      expect(Math.abs(a!.y - b!.y)).toBeLessThan(3);
      expect(b!.x).toBeGreaterThanOrEqual(a!.x + a!.width);
    } else expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
  }
  await expect(page.locator(".analytics-stat-card").first()).toContainText("Rp1.834.875");
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.filter((call: { path: string }) => call.path.endsWith("read_trade_reporting_v1"))).toHaveLength(1);
  expect(calls.some((call: { path: string }) => call.path.includes("/api/chart/") || call.path.includes("read_ticker_chart"))).toBe(false);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: info.project.name === "mobile" ? 390 : 1440, height: 900 });
  await page.screenshot({ path: "test-results/reporting-layout-analytics-" + info.project.name + ".png", fullPage: true });
});

test("a keyboard user can scroll journal rows without moving the whole page sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/journal?tab=paper");
  const region = page.locator("#reporting-trades .reporting-table-region");
  await expect(region).toBeVisible();
  await region.focus();
  await expect(region).toBeFocused();
  expect(await region.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await region.focus();
  await page.keyboard.press("Tab");
  await expect(region.getByRole("link").first()).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 700 });
    const action = region.locator("tbody tr").last().locator("td").last().getByRole("link").last();
    // Enter the table again after resize; refocusing the already-active link does not move focus.
    await region.focus();
    await action.focus();
    await expect(action).toBeFocused();
    await expect.poll(async () => {
      const link = await action.boundingBox(), bounds = await region.boundingBox();
      return Boolean(link && bounds && link.x >= bounds.x && link.x + link.width <= bounds.x + bounds.width + 1);
    }, { message: "The focused row action is visible after the browser finishes scrolling", timeout: 3000 }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("profit loss and missing results retain distinct canonical presentation", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "reporting-oracle" } });
  await page.goto("/journal?tab=paper");
  for (const [selector, token] of [["td.positive", "--green"], ["td.negative", "--red"], ["td.reporting-null", "--muted"]]) {
    const cell = page.locator(".reporting-trades " + selector).first();
    await expect(cell).toBeVisible();
    const colors = await cell.evaluate((node, variable) => {
      const style = getComputedStyle(node), hex = style.getPropertyValue(variable).trim().slice(1);
      return { actual: style.color, expected: "rgb(" + [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(", ") + ")" };
    }, token);
    expect(colors.actual).toBe(colors.expected);
  }
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "actual-draft-empty" } });
  await page.goto("/journal?tab=actual");
  const zero = page.locator(".reporting-table-region tbody tr td:nth-child(8) span").first();
  await expect(zero).toHaveText("Rp0");
  expect(await zero.evaluate(node => getComputedStyle(node).color === getComputedStyle(node.parentElement!).color)).toBe(true);
});

test("enlarged desktop-equivalent layout fits a short viewport", async ({ browser, context }, info) => {
  // CSS viewport/density equivalent to viewing 1440x900 at 200%; not a browser-toolbar zoom test.
  const enlarged = await browser.newContext({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2, storageState: await context.storageState() });
  try {
    const page = await enlarged.newPage();
    await page.goto("http://127.0.0.1:3052/analytics?tab=paper");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const curve = await page.getByRole("heading", { name: "Kurva P&L net kumulatif", exact: true }).locator("..").boundingBox();
    const strategies = await page.getByRole("heading", { name: "Performa per strategi", exact: true }).locator("..").boundingBox();
    expect(strategies!.y).toBeGreaterThanOrEqual(curve!.y + curve!.height);
    await expect(page.getByRole("button", { name: "Terapkan cohort" })).toBeEnabled();
    expect(await page.locator(".reporting-table-region").evaluateAll(nodes => nodes.every(node => node.clientHeight <= innerHeight * 0.7 + 1))).toBe(true);
    await page.screenshot({ path: "test-results/reporting-layout-enlarged-" + info.project.name + ".png", fullPage: true });
  } finally { await enlarged.close(); }
});
