import { test, expect, type Page } from "@playwright/test";
import { chartFixture } from "../src/lib/chart-fixture";
import { parseChartEnvelope } from "../src/lib/chart-contract";
import { writeFile } from "node:fs/promises";

const ownerId = "22222222-2222-4222-8222-222222222222";
const paperSource = "/journal?tab=paper&exit_key=ma10";
const overlay = (page: Page) => page.locator("#reporting-chart-overlay");
const tradeLink = (page: Page) => page.locator(".reporting-trades").getByRole("link", { name: "Chart TEST", exact: true });

function chartResponse(url: string) {
  const query = new URL(url).searchParams;
  const response = chartFixture();
  if (!response.success) throw new Error("Expected successful synthetic chart fixture");
  const result = { ...response, data: { ...response.data, ticker: "TEST", context: {
    ...response.data.context, kind: query.get("context"), id: query.get("context_id"),
    view: query.get("view"), signal_session: "2026-10-12",
    snapshot_cutoff: query.get("view") === "snapshot" ? "2026-10-12" : null,
    experiment: query.get("context") === "paper" ? "ma10" : null,
  }, signal_source: response.data.source } };
  if (!parseChartEnvelope(result, "fixture", "TEST")) throw new Error("Synthetic overlay response violates chart contract");
  return result;
}

const failure = (code: "BACKEND_NOT_READY" | "UNAUTHENTICATED") => ({
  contract_version: "ticker-chart-v1", success: false, data: null,
  error: { code, message: "synthetic fixture failure", request_id: "overlay-fixture", retryable: code === "BACKEND_NOT_READY" },
});

async function scrollState(page: Page) {
  return page.evaluate(() => ({
    y: Math.floor(window.scrollY),
    regions: [...document.querySelectorAll<HTMLElement>(".reporting-list, .table-scroll, .journal-table-scroll")]
      .map(region => ({ left: Math.floor(region.scrollLeft), top: Math.floor(region.scrollTop) })),
  }));
}

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "reporting-ready" } });
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: ownerId, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
    .map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".dGVzdA";
  const session = { access_token: token, refresh_token: "local-test-refresh", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: ownerId } };
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
});

test("reporting chart overlay opens lazily without navigating or changing ledger facts", async ({ page, request }) => {
  const calls: URL[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydrat|server rendered HTML/i.test(message.text())) errors.push(message.text()); });
  await page.route("**/api/chart/TEST?**", route => {
    calls.push(new URL(route.request().url()));
    return route.fulfill({ json: chartResponse(route.request().url()) });
  });
  await page.goto(paperSource);
  const sourceUrl = page.url();
  const facts = await page.locator(".reporting-trades").innerText();
  const trigger = tradeLink(page);
  const readsBefore = (await (await request.get("http://127.0.0.1:3053/__calls")).json()).calls;
  await expect(trigger).toHaveAttribute("href", /^\/chart\/TEST\?/);
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  expect(calls).toHaveLength(0);
  const openedAt = Date.now();
  await trigger.click();
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toHaveAttribute("open", "");
  await expect(overlay(page).getByTestId("chart-canvas")).toBeVisible();
  await writeFile(`test-results/chart-overlay-timing-${test.info().project.name}.json`, JSON.stringify({
    source: "local synthetic HTTP fixture", openToVisibleMs: Date.now() - openedAt,
  }, null, 2));
  expect(page.url()).toBe(sourceUrl);
  expect(calls).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem("chart-return-ui-v1:fixture"))).toBeNull();
  expect((await (await request.get("http://127.0.0.1:3053/__calls")).json()).calls).toEqual(readsBefore);
  expect(calls[0].searchParams.get("context")).toBe("paper");
  expect(calls[0].searchParams.get("context_id")).toBe("paper-test-v1");
  expect(calls[0].searchParams.get("view")).toBe("followup");
  await expect(overlay(page).getByRole("checkbox", { name: "SMA10", exact: true })).toBeChecked();
  expect(await page.locator(".reporting-trades").innerText()).toBe(facts);
  expect((await (await request.get("http://127.0.0.1:3053/__calls")).json()).mutations).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `test-results/chart-overlay-${test.info().project.name}.png` });
});

test("overlay close restores opener and both scroll axes without dismissing on backdrop", async ({ page }) => {
  await page.route("**/api/chart/TEST?**", route => route.fulfill({ json: chartResponse(route.request().url()) }));
  await page.goto(paperSource);
  const trigger = tradeLink(page);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const before = await scrollState(page);
  await trigger.click();
  const dialog = overlay(page);
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  const box = await dialog.boundingBox();
  if (box && box.x > 4) {
    await page.mouse.click(1, box.y + Math.min(20, box.height / 2));
    await expect(dialog).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect.poll(() => scrollState(page)).toEqual(before);
  await trigger.press("Enter");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Tutup overlay chart", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect.poll(() => scrollState(page)).toEqual(before);
});

test("signal overlay preserves snapshot identity and fullpage action reflects active view and indicators", async ({ page }) => {
  const calls: URL[] = [];
  await page.route("**/api/chart/TEST?**", route => {
    calls.push(new URL(route.request().url()));
    return route.fulfill({ json: chartResponse(route.request().url()) });
  });
  await page.goto("/analytics?tab=signals&strategy=MACD_EMA200_V1");
  const sourceUrl = page.url();
  const trigger = page.locator("#signal-observations").getByRole("link", { name: "Chart TEST Chart saat sinyal", exact: true });
  const href = new URL((await trigger.getAttribute("href"))!, sourceUrl);
  expect(calls).toHaveLength(0);
  await trigger.click();
  const dialog = overlay(page);
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  expect(calls[0].searchParams.get("context")).toBe("signal");
  expect(calls[0].searchParams.get("context_id")).toBe(href.searchParams.get("context_id"));
  expect(calls[0].searchParams.get("view")).toBe("snapshot");
  await dialog.getByRole("button", { name: "Perkembangan", exact: true }).click();
  await expect.poll(() => calls.at(-1)?.searchParams.get("view")).toBe("followup");
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  await dialog.getByRole("checkbox", { name: "SMA10", exact: true }).check();
  const fullpage = dialog.getByRole("link", { name: "Buka halaman penuh", exact: true });
  const fullpageHref = new URL((await fullpage.getAttribute("href"))!, sourceUrl);
  expect(fullpageHref.pathname).toBe("/chart/TEST");
  expect(fullpageHref.searchParams.get("context_id")).toBe(href.searchParams.get("context_id"));
  expect(fullpageHref.searchParams.get("view")).toBe("followup");
  expect(fullpageHref.searchParams.get("indicators")?.split(",")).toContain("sma10");
  expect(fullpageHref.searchParams.get("return_to")).toContain("tab=signals");
  expect(page.url()).toBe(sourceUrl);
});

test("overlay retry and authentication errors remain explicit and remove stale canvas", async ({ page, request }) => {
  let status: "BACKEND_NOT_READY" | "UNAUTHENTICATED" | "ready" = "BACKEND_NOT_READY";
  let calls = 0;
  await page.route("**/api/chart/TEST?**", route => {
    calls++;
    return route.fulfill(status === "ready"
      ? { json: chartResponse(route.request().url()) }
      : { status: status === "UNAUTHENTICATED" ? 401 : 503, json: failure(status) });
  });
  await page.goto("/analytics?tab=actual&exit_snapshot=fixed2r");
  const facts = await page.locator(".analytics-hero-stats").innerText();
  await tradeLink(page).click();
  const dialog = overlay(page);
  await expect(dialog.getByText("Backend chart belum siap.", { exact: true })).toBeVisible();
  await expect(dialog.getByTestId("chart-canvas")).toHaveCount(0);
  status = "ready";
  await dialog.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  status = "UNAUTHENTICATED";
  await dialog.getByRole("button", { name: "Muat ulang", exact: true }).click();
  await expect(dialog.getByText("Masuk untuk membaca chart.", { exact: true })).toBeVisible();
  await expect(dialog.getByTestId("chart-canvas")).toHaveCount(0);
  expect(calls).toBe(3);
  expect(await page.locator(".analytics-hero-stats").innerText()).toBe(facts);
  expect((await (await request.get("http://127.0.0.1:3053/__calls")).json()).mutations).toEqual([]);
});

test("repeated open is deduplicated and refresh or browser history cleans the overlay", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/chart/TEST?**", route => {
    calls++;
    return route.fulfill({ json: chartResponse(route.request().url()) });
  });
  await page.goto("/analytics?tab=actual&exit_snapshot=fixed2r");
  await page.goto(paperSource);
  await tradeLink(page).evaluate(link => { (link as HTMLElement).click(); (link as HTMLElement).click(); });
  await expect(overlay(page).getByTestId("chart-canvas")).toBeVisible();
  expect(calls).toBe(1);
  await page.reload();
  await expect(overlay(page)).toBeHidden();
  expect(calls).toBe(1);
  await tradeLink(page).click();
  await expect(overlay(page).getByTestId("chart-canvas")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/analytics\?tab=actual/);
  await expect(overlay(page)).toBeHidden();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("overlay is usable on narrow and short viewports with contained overflow and keyboard focus", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, "sessionStorage", { configurable: true,
    get() { throw new DOMException("synthetic storage disabled", "SecurityError"); } }));
  await page.route("**/api/chart/TEST?**", route => route.fulfill({ json: chartResponse(route.request().url()) }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 720, height: 450 }]) {
    await page.setViewportSize(viewport);
    await page.goto(paperSource);
    const trigger = tradeLink(page);
    await trigger.click();
    const dialog = overlay(page);
    await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
    const close = dialog.getByRole("button", { name: "Tutup overlay chart", exact: true });
    await expect(close).toBeVisible();
    const bounds = await close.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await close.focus();
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test("late response after closing cannot replace another context for the same ticker", async ({ page }) => {
  let pending: import("@playwright/test").Route | undefined;
  const calls: URL[] = [];
  await page.route("**/api/chart/TEST?**", route => {
    calls.push(new URL(route.request().url()));
    if (calls.length === 1) { pending = route; return; }
    return route.fulfill({ json: chartResponse(route.request().url()) });
  });
  await page.goto(paperSource);
  await tradeLink(page).click();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await expect(overlay(page).getByTestId("chart-canvas")).toHaveCount(0);
  await overlay(page).getByRole("button", { name: "Tutup overlay chart", exact: true }).click();
  await expect(overlay(page)).toBeHidden();
  await page.locator(".reporting-trades").getByRole("link", { name: "Chart TEST Saat sinyal", exact: true }).click();
  const dialog = overlay(page);
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  const signalHref = await dialog.getByRole("link", { name: "Buka halaman penuh", exact: true }).getAttribute("href");
  expect(calls[0].searchParams.get("context_id")).toBe("paper-test-v1");
  expect(calls[1].searchParams.get("context_id")).toBe("a".repeat(64));
  expect(calls[1].searchParams.get("context")).toBe("signal");
  // Release the old network response after B has rendered; its aborted consumer must stay inert.
  await pending!.fulfill({ json: chartResponse(pending!.request().url()) });
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Buka halaman penuh", exact: true })).toHaveAttribute("href", signalHref!);
  await expect(dialog.getByRole("button", { name: "Saat sinyal", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(calls).toHaveLength(2);
});

test("cross-tab signout and owner changes close the overlay and release its page lock", async ({ page }) => {
  await page.route("**/api/chart/TEST?**", route => route.fulfill({ json: chartResponse(route.request().url()) }));
  await page.goto(paperSource);
  const trigger = tradeLink(page);
  const events = [
    { event: "SIGNED_OUT", session: null },
    { event: "SIGNED_IN", session: { access_token: "synthetic-other-owner", user: { id: "33333333-3333-4333-8333-333333333333" } } },
  ];
  for (const event of events) {
    await trigger.click();
    await expect(overlay(page).getByTestId("chart-canvas")).toBeVisible();
    // This is the installed GoTrue client's actual cross-tab notification channel, not an app debug hook.
    await page.evaluate(async payload => {
      const channel = new BroadcastChannel("sb-127-auth-token");
      channel.postMessage(payload);
      await new Promise(resolve => setTimeout(resolve, 0));
      channel.close();
    }, event);
    await expect(overlay(page)).toBeHidden();
    await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.position)).not.toBe("fixed");
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    await expect(trigger).toBeFocused();
  }
});

test("rate-limit cooldown blocks repeated reads and forbidden retry removes chart data", async ({ page }) => {
  let state: "ready" | "RATE_LIMITED" | "FORBIDDEN" = "ready";
  let calls = 0;
  await page.clock.install();
  await page.route("**/api/chart/TEST?**", route => {
    calls++;
    return route.fulfill(state === "ready" ? { json: chartResponse(route.request().url()) } : {
      status: state === "RATE_LIMITED" ? 429 : 403,
      json: { contract_version: "ticker-chart-v1", success: false, data: null,
        error: { code: state, message: "synthetic fixture failure", request_id: "overlay-limits", retryable: state === "RATE_LIMITED" } },
    });
  });
  await page.goto(paperSource);
  await tradeLink(page).click();
  const dialog = overlay(page);
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  state = "RATE_LIMITED";
  await dialog.getByRole("button", { name: "Muat ulang", exact: true }).click();
  await expect(dialog.getByText("Batas baca tercapai. Tunggu 60 detik sebelum mencoba lagi.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Coba lagi", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Muat ulang", exact: true })).toBeDisabled();
  expect(calls).toBe(2);
  state = "FORBIDDEN";
  await page.clock.fastForward(60_001);
  await expect(dialog.getByRole("button", { name: "Coba lagi", exact: true })).toBeEnabled();
  await dialog.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(dialog.getByText("Akun tidak memiliki akses.", { exact: true })).toBeVisible();
  await expect(dialog.getByTestId("chart-canvas")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Coba lagi", exact: true })).toHaveCount(0);
  expect(calls).toBe(3);
});

test("maximum-length valid ticker keeps the close action reachable at 320 pixels", async ({ page }) => {
  const ticker = "ABCDEFGHIJKLMNOPQRST";
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route("**/api/chart/" + ticker + "?**", route => {
    const base = chartResponse(route.request().url());
    const response = { ...base, data: { ...base.data, ticker } };
    if (!parseChartEnvelope(response, "fixture", ticker)) throw new Error("Synthetic long-ticker fixture violates chart contract");
    return route.fulfill({ json: response });
  });
  await page.goto(paperSource);
  // Change only the existing local fixture link to exercise the supported contract boundary.
  await tradeLink(page).evaluate((link, symbol) => {
    const anchor = link as HTMLAnchorElement;
    const href = new URL(anchor.href);
    href.pathname = "/chart/" + symbol;
    anchor.href = href.toString();
    anchor.setAttribute("aria-label", "Synthetic chart " + symbol);
  }, ticker);
  await page.getByRole("link", { name: "Synthetic chart " + ticker, exact: true }).click();
  const dialog = overlay(page);
  await expect(dialog.getByTestId("chart-canvas")).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Chart " + ticker, exact: true })).toBeVisible();
  const close = dialog.getByRole("button", { name: "Tutup overlay chart", exact: true });
  const box = await close.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await close.click();
  await expect(dialog).toBeHidden();
});

test("canonical chart modifier opens a tab while the reporting page stays intact", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "Browser modifier navigation is a desktop flow");
  await context.route("**/api/chart/TEST?**", route => route.fulfill({ json: chartResponse(route.request().url()) }));
  await page.goto(paperSource);
  const href = await tradeLink(page).getAttribute("href");
  const popupReady = context.waitForEvent("page");
  await tradeLink(page).click({ modifiers: ["Control"] });
  const popup = await popupReady;
  await expect(popup).toHaveURL(new URL(href!, page.url()).href);
  await expect(overlay(page)).toBeHidden();
  await expect(page).toHaveURL(new RegExp("/journal\\?tab=paper&exit_key=ma10$"));
  await popup.close();
});

test("canonical rendered chart link navigates after JavaScript becomes unavailable", async ({ page, browser, context }, info) => {
  test.skip(info.project.name !== "desktop", "One browser context proves native anchor navigation");
  await page.goto(paperSource);
  const href = await tradeLink(page).getAttribute("href");
  const protocol = await context.newCDPSession(page);
  await protocol.send("Emulation.setScriptExecutionDisabled", { value: true });
  try {
    await tradeLink(page).click({ noWaitAfter: true });
    await expect(page).toHaveURL(new URL(href!, "http://127.0.0.1:3052").href);
  } finally { await protocol.send("Emulation.setScriptExecutionDisabled", { value: false }); await protocol.detach(); }
  // Diagnostic control: this original async detail route has no reporting overlay provider.
  // Keep initial App Router streaming support separate from a rendered anchor's fallback.
  const plain = await browser.newContext({ javaScriptEnabled: false, storageState: await context.storageState() });
  try {
    const control = await plain.newPage();
    await control.goto("http://127.0.0.1:3052/journal/paper/paper-test-v1", { waitUntil: "domcontentloaded" });
    const attached = await control.locator(".journal-facts").waitFor({ state: "attached", timeout: 5000 }).then(() => true, () => false);
    const result = { route: "/journal/paper/paper-test-v1", overlayProvider: false, finalFactsAttached: attached,
      factsVisible: await control.locator(".journal-facts").isVisible(), loadingVisible: await control.getByRole("main", { name: "Memuat workspace" }).isVisible() };
    await writeFile("test-results/chart-overlay-no-js-control.json", JSON.stringify(result, null, 2));
    await test.info().attach("no-js-initial-control", { body: JSON.stringify(result), contentType: "application/json" });
  } finally { await plain.close(); }
});
