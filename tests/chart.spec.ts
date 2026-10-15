import { test, expect } from "@playwright/test";
import { chartFixture } from "../src/lib/chart-fixture";
import { previewChart } from '../src/lib/chart-preview-scenarios';
import { chartFailure } from '../src/lib/chart-reader';
const codes = [
  "INVALID_REQUEST",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "REVISION_UNAVAILABLE",
  "SNAPSHOT_UNAVAILABLE",
  "RATE_LIMITED",
  "BACKEND_NOT_READY",
  "DATA_UNAVAILABLE",
  "CONTRACT_ERROR",
  "UPSTREAM_ERROR",
  "INTERNAL_ERROR",
];
test('manual zoom survives indicator toggles and container resizing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/dev/chart?scenario=perf500');
  await page.getByRole('button', { name: 'Buka chart', exact: true }).click();
  const canvas = page.getByTestId('chart-canvas');
  const range = page.getByLabel('Rentang waktu terlihat', { exact: true });
  await expect(canvas).toBeVisible();
  await expect(range).toContainText(/\d{4}-\d{2}-\d{2}/);
  const initial = await range.textContent();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + 100);
  await page.mouse.wheel(0, -300);
  await expect.poll(() => range.textContent()).not.toBe(initial);
  const zoomed = await range.textContent();
  for (const label of ['SMA10', 'EMA200', 'MACD', 'MACD']) {
    await page.getByLabel(label, { exact: true }).click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(range).toHaveText(zoomed!);
  }
  await page.locator('[aria-label="Chart ADRO"]').evaluate(el => { (el as HTMLElement).style.maxWidth = '700px'; });
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(720);
  await expect(range).toHaveText(zoomed!);
  expect(errors).toEqual([]);
});
test('chart controls group by purpose and canvas follows available height', async ({ page }) => {
  let reads = 0;
  await page.route('**/api/chart/ADRO?**', route => {
    reads++;
    return route.fulfill({ json: chartFixture() });
  });
  await page.goto('/dev/chart?scenario=http');
  await page.getByRole('button', { name: 'Buka chart', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Chart ADRO', exact: true });
  await expect(panel.getByRole('group', { name: 'Aksi chart', exact: true })).toBeVisible();
  await expect(panel.getByRole('group', { name: 'Rentang chart', exact: true })).toBeVisible();
  await expect(panel.getByRole('group', { name: 'Indikator chart', exact: true })).toBeVisible();
  await panel.evaluate(el => { (el as HTMLElement).style.maxWidth = '700px'; });
  const groupRects = await panel.getByRole('group').evaluateAll(groups => groups.map(group => {
    const { x, y, right, bottom } = group.getBoundingClientRect();
    return { x, y, right, bottom };
  }));
  for (let i = 0; i < groupRects.length; i++) for (let j = i + 1; j < groupRects.length; j++) {
    const a = groupRects[i], b = groupRects[j];
    expect(a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1).toBe(true);
  }
  await panel.evaluate(el => { (el as HTMLElement).style.maxWidth = '520px'; });
  const groupPositions = await panel.getByRole('group').evaluateAll(groups => groups.map(group => group.getBoundingClientRect().x));
  expect(Math.max(...groupPositions) - Math.min(...groupPositions)).toBeLessThanOrEqual(2);
  for (const height of await panel.getByRole('button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height)))
    expect(height).toBeGreaterThanOrEqual(44);
  const canvas = page.getByTestId('chart-canvas');
  await panel.evaluate(el => (el as HTMLElement).style.setProperty('--chart-available-height', '600px'));
  await expect.poll(async () => (await canvas.boundingBox())!.height).toBe(600);
  await page.getByLabel('MACD', { exact: true }).check();
  await expect.poll(async () => (await canvas.boundingBox())!.height).toBe(600);
  await panel.evaluate(el => (el as HTMLElement).style.setProperty('--chart-available-height', '200px'));
  await expect.poll(async () => (await canvas.boundingBox())!.height).toBe(440);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(reads).toBe(1);
});
test("explicit opening loads renderer concurrently with a pending price request", async ({ page, browser }) => {
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto("http://127.0.0.1:3058/dev/chart");
  await warmPage.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(warmPage.getByTestId("chart-canvas")).toBeVisible();
  await warmPage.waitForLoadState("networkidle");
  await warm.close();
  let rendererChunks = 0, reads = 0;
  page.on("response", response => {
    if (response.url().includes("/_next/static/chunks/") && response.url().endsWith(".js"))
      void response.text().then(body => {
        if (body.includes("Cannot update oldest data")) rendererChunks++;
      }).catch(() => {});
  });
  let release!: () => void;
  const pending = new Promise<void>(done => { release = done; });
  await page.route("**/api/chart/ADRO?**", async route => {
    reads++;
    await pending;
    await route.fulfill({ json: chartFixture() });
  });
  await page.goto("/dev/chart?scenario=http");
  expect(reads).toBe(0);
  expect(rendererChunks).toBe(0);
  try {
    await page.getByRole("button", { name: "Buka chart", exact: true }).click();
    await expect.poll(() => reads).toBe(1);
    await expect.poll(() => rendererChunks, { timeout: 10000 }).toBeGreaterThan(0);
    await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  } finally { release(); }
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  expect(reads).toBe(1);
});
test("lazy chunk failure stays inside chart and explicit retry recovers", async ({ page, browser }) => {
  test.skip(process.env.CHART_SMOKE_WEBPACK !== "true", "Turbopack development auto-reloads missing chunks; this isolated failure probe uses webpack.");
  // Compile the on-demand dev chunk in a separate context first. A compilation-time
  // Fast Refresh otherwise remounts the target panel and invalidates the fault experiment.
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto("http://127.0.0.1:3058/dev/chart");
  await warmPage.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(warmPage.getByTestId("chart-canvas")).toBeVisible();
  await warmPage.waitForLoadState("networkidle");
  await warm.close();
  let blocked = 0, reads = 0;
  const brokenChunk = async (route: import("@playwright/test").Route) => {
    const url = route.request().url();
    // Block the actual renderer module, not the small async-loader shim.
    if (url.includes("chart-canvas_tsx") && !url.includes("async-loader")) {
      blocked++;
      return route.abort("failed");
    }
    return route.continue();
  };
  await page.route("**/_next/static/chunks/*.js", brokenChunk);
  await page.route("**/api/chart/ADRO?**", route => {
    reads++;
    return route.fulfill({ json: chartFixture() });
  });
  await page.goto("/dev/chart?scenario=http");
  const parent = page.getByRole("heading", { name: "Chart component — fixture development", exact: true });
  await expect(parent).toBeVisible();
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  const chart = page.locator('[aria-label="Chart ADRO"]');
  await expect(chart.getByRole("alert")).toContainText("INTERNAL_ERROR");
  expect(blocked).toBeGreaterThan(0);
  await expect(parent).toBeVisible();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  await expect(chart.getByText("Tabel OHLC & indikator — alternatif canvas", { exact: true })).toBeVisible();
  expect(reads).toBe(1);
  await page.unroute("**/_next/static/chunks/*.js", brokenChunk);
  await chart.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  await expect(chart.getByRole("alert")).toHaveCount(0);
  expect(reads).toBe(2);
  await expect(parent).toBeVisible();
});
test('expired access during paging removes previous prices and canvas', async ({page}) => {
  let reads = 0;
  await page.route('**/api/chart/ADRO?**', route => {
    reads++;
    return route.fulfill({status: reads === 1 ? 200 : 401, contentType: 'application/json', body: JSON.stringify(reads === 1 ? previewChart('paging') : chartFailure('UNAUTHENTICATED', 'expired-test'))});
  });
  await page.goto('/dev/chart?scenario=http');
  await page.getByRole('button', {name: 'Buka chart', exact: true}).click();
  await expect(page.getByTestId('chart-canvas')).toBeVisible();
  await page.getByRole('button', {name: 'Histori lebih lama', exact: true}).click();
  await expect(page.locator('[aria-label="Chart ADRO"]').getByRole('alert')).toContainText('UNAUTHENTICATED');
  await expect(page.getByTestId('chart-canvas')).toHaveCount(0);
  await expect(page.getByText('Tabel OHLC & indikator — alternatif canvas')).toHaveCount(0);
});
test('a response wider than the requested limit fails the chart boundary', async ({page}) => {
  const raw = chartFixture();
  if (!raw.success) throw Error('fixture');
  await page.route('**/api/chart/ADRO?**', route => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({...raw, data: {...raw.data, pagination: {...raw.data.pagination, limit: 500}}})}));
  await page.goto('/dev/chart?scenario=http');
  await page.getByRole('button', {name: 'Buka chart', exact: true}).click();
  await expect(page.locator('[aria-label="Chart ADRO"]').getByRole('alert')).toContainText('CONTRACT_ERROR');
  await expect(page.getByTestId('chart-canvas')).toHaveCount(0);
});
test("closed chart is lazy; fixture candles, gaps and canonical money are accessible", async ({
  page,
}, testInfo) => {
  const chunks: string[] = [];
  const inspected: Promise<void>[] = [];
  let reads = 0;
  page.on("response", (response) => {
    if (
      response.url().includes("/_next/static/chunks/") &&
      response.url().endsWith(".js")
    )
      inspected.push(
        response
          .text()
          .then((body) => {
            if (
              body.includes("/node_modules/lightweight-charts/dist/") &&
              body.includes("function createChart(")
            )
              chunks.push(response.url());
          })
          .catch(() => {}),
      );
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/chart/ADRO?**", (route) => {
    reads++;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(chartFixture()),
    });
  });
  await page.goto("/dev/chart?scenario=http");
  await expect(page.getByText("FIXTURE DEV — DATA SINTETIS")).toBeVisible();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  await Promise.all(inspected);
  expect(chunks).toHaveLength(0);
  expect(reads).toBe(0);
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(
    page.getByTestId("chart-canvas").locator("canvas").first(),
  ).toBeVisible();
  await Promise.all(inspected);
  expect(chunks.length).toBeGreaterThan(0);
  expect(reads).toBe(1);
  await page.screenshot({
    path: testInfo.outputPath("chart-open.png"),
    fullPage: true,
  });
  await expect(page.getByText(/kelengkapan Parsial/)).toBeVisible();
  await page.getByText("Tabel OHLC & indikator — alternatif canvas").click();
  const row = page.getByRole("row").filter({ hasText: "2026-10-09" });
  await expect(row).toContainText("missing_bar");
  await expect(row).not.toContainText("Rp0");
  await expect(
    page.getByRole("row").filter({ hasText: "2026-10-08" }),
  ).toContainText("Rp1.000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("indicator toggles, viewport, refresh and repeated disposal stay stable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/dev/chart");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  await page.getByLabel("MACD", { exact: true }).check();
  await page.getByLabel("SMA10", { exact: true }).uncheck();
  await page.getByLabel("EMA200", { exact: true }).uncheck();
  await page.getByRole("button", { name: "3 bulan" }).click();
  await expect(page.getByRole("button", { name: "3 bulan" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Reset zoom" }).click();
  await page.getByRole("button", { name: "Muat ulang" }).click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  await page.getByRole("button", { name: "Tutup chart" }).click();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Buka chart", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
  expect(errors).toEqual([]);
});
for (let group = 0; group < codes.length; group += 4) {
test(`backend errors ${group + 1}–${Math.min(group + 4, codes.length)} stay explicit without fallback`, async ({
  page,
}) => {
  for (const code of codes.slice(group, group + 4)) {
    await page.goto("/dev/chart?scenario=" + code);
    await page.getByRole("button", { name: "Buka chart", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Chart ADRO" }).getByRole("alert"),
    ).toContainText(code);
    await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
    if (code === "RATE_LIMITED")
      await expect(
        page.getByRole("button", { name: "Coba lagi" }),
      ).toBeDisabled();
    if (code === "UNAUTHENTICATED")
      await expect(
        page.getByRole("link", { name: "Masuk", exact: true }),
      ).toBeVisible();
  }
});
}
test("empty held sessions and invalid payload are distinct", async ({
  page,
}) => {
  await page.goto("/dev/chart?scenario=empty");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(
    page.getByText("Belum ada candle valid pada jendela ini.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  await page.goto("/dev/chart?scenario=invalid");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Chart ADRO" }).getByRole("alert"),
  ).toContainText("CONTRACT_ERROR");
});
test("closing an in-flight load discards the response and permits reopening", async ({
  page,
}) => {
  await page.goto("/dev/chart?scenario=slow");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByText("Memuat data chart…")).toBeVisible();
  await page.getByRole("button", { name: "Tutup chart" }).click();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByTestId("chart-canvas")).toBeVisible();
});
test("older bars and overlay-only pages append pinned revisions; revision races stay explicit", async ({
  page,
}) => {
  await page.goto("/dev/chart?scenario=paging");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await page.getByRole("button", { name: "Histori lebih lama" }).click();
  await page.getByText("Tabel OHLC & indikator — alternatif canvas").click();
  await expect(
    page.getByRole("row").filter({ hasText: "2026-10-07" }),
  ).toContainText("Rp990");
  await expect(
    page.getByRole("button", { name: "Histori lebih lama" }),
  ).toHaveCount(0);
  await page.goto("/dev/chart?scenario=overlay-paging");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Histori lebih lama" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Event berikutnya" }).click();
  await page.getByText("Level & event canonical (2)").click();
  await expect(page.getByRole('listitem').filter({hasText: /entry_fill.*fill simulasi/})).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Event berikutnya" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Histori lebih lama" }),
  ).toBeEnabled();
  await page.goto("/dev/chart?scenario=revision-race");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await page.getByRole("button", { name: "Histori lebih lama" }).click();
  await expect(
    page.getByRole("region", { name: "Chart ADRO" }).getByRole("alert"),
  ).toContainText("REVISION_UNAVAILABLE");
});
test("HTTP chart bounds fail safely and standalone missing auth does not fetch prices", async ({
  request,
  page,
}) => {
  const invalid = await request.get("/api/chart/ADRO?owner=arbitrary");
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()["cache-control"]).toBe("private, no-store");
  expect((await invalid.json()).error.code).toBe("INVALID_REQUEST");
  const absent = await request.get("/api/chart/ADRO");
  expect(absent.status()).toBe(503);
  expect((await absent.json()).error.code).toBe("BACKEND_NOT_READY");
  await page.goto("/chart/ADRO");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Konfigurasi backend chart belum siap" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buka chart", exact: true }),
  ).toHaveCount(0);
});
test("twenty open/close/resize cycles dispose canvases and restore keyboard focus", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dev/chart");
  const counts = new Map<number, number>();
  for (let cycle = 0; cycle < 20; cycle++) {
    const width = [1440, 1024, 390, 320][cycle % 4];
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "Buka chart", exact: true }).click();
    const canvases = page.getByTestId("chart-canvas").locator("canvas");
    await expect(canvases.first()).toBeVisible();
    const count = await canvases.count();
    if (counts.has(width)) expect(count).toBe(counts.get(width));
    else counts.set(width, count);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Tutup chart" }).focus();
    if (cycle % 2 === 0) await page.keyboard.press("Escape");
    else await page.getByRole("button", { name: "Tutup chart" }).click();
    await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Buka chart", exact: true }),
    ).toBeFocused();
  }
  expect(errors).toEqual([]);
});
test("rapid ticker A→B selection cannot render or overwrite with A response", async ({
  page,
}) => {
  await page.goto("/dev/chart?scenario=race");
  await page.getByRole("button", { name: "Buka chart", exact: true }).click();
  await expect(page.getByText("Memuat data chart…")).toBeVisible();
  await page.getByRole("button", { name: "Pilih INDY" }).click();
  await expect(
    page
      .getByRole("region", { name: "Chart INDY" })
      .getByTestId("chart-canvas"),
  ).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.getByRole("region", { name: "Chart ADRO" })).toHaveCount(0);
  await page.getByRole("button", { name: "Pilih ADRO" }).click();
  await expect(page.getByTestId("chart-canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Pilih INDY" }).click();
  await expect(
    page
      .getByRole("region", { name: "Chart INDY" })
      .getByTestId("chart-canvas"),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Chart INDY" }).getByRole("alert"),
  ).toHaveCount(0);
});
