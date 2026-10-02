import { expect, test } from "@playwright/test";

const runId = "11111111-1111-4111-8111-111111111111";
test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-empty" } });
  const userId = "22222222-2222-4222-8222-222222222222";
  const token = [{ alg: "HS256", typ: "JWT" }, { sub: userId, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
    .map(v => Buffer.from(JSON.stringify(v)).toString("base64url")).join(".") + ".dGVzdA";
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify({
    access_token: token, refresh_token: "local-test-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId },
  })).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
});

test("unpublished is preparing, never no-signal or fixture fallback", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pemindaian live sedang disiapkan." })).toBeVisible();
  await expect(page.getByText(/Ini bukan hasil no signal/)).toBeVisible();
  await expect(page.getByText("Mode demo", { exact: true })).toHaveCount(0);
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((c: { path: string }) => c.path.includes("scan_run_items") || c.path.includes("scan_run_signals"))).toBe(false);
});

test("anonymous and outsider never fetch scan rows", async ({ page, context, request }) => {
  const cookies = await context.cookies();
  await context.clearCookies();
  await page.goto("/scanner");
  await expect(page.getByText("Masuk dengan akun owner untuk membaca hasil scan melalui RLS.")).toBeVisible();
  await context.addCookies(cookies);
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "outsider" } });
  await page.goto("/scanner");
  await expect(page.getByRole("heading", { name: "Akses scanner ditolak" })).toBeVisible();
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((c: { path: string }) => c.path.includes("scan_run"))).toBe(false);
});

test("partial exposes denominator, skip reasons and global RS hold", async ({ page, request }, info) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-partial" } });
  await page.goto("/scanner?section=quality");
  await expect(page.getByRole("heading", { name: "Scan parsial" })).toBeVisible();
  await expect(page.getByText("99 / 100", { exact: true })).toBeVisible();
  await expect(page.getByText("Corporate action belum direkonsiliasi", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/Ranking RS ditahan untuk seluruh/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/scanner-partial-${info.project.name}.png`, fullPage: true });
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
  const itemReads = calls.filter((c: { path: string }) => c.path.endsWith("scan_run_items"));
  expect(itemReads).toHaveLength(1);
  expect(itemReads[0].query.limit).toBe("26");
  expect(calls.some((c: { path: string }) => c.path.includes("scan_run_signals"))).toBe(false);
  const runRead = calls.find((c: { path: string }) => c.path.endsWith("scan_runs"));
  expect(runRead.query.namespace).toBe("eq.forward");
  expect(runRead.query.data_mode).toBe("eq.live");
  expect(runRead.query.select.split(",")).not.toContain("snapshot");
});

test("expired window and late cohort never claim fresh forward entry", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-late" } });
  await page.goto("/scanner");
  await expect(page.getByText(/Window entry sudah berakhir/)).toBeVisible();
  await expect(page.getByText(/LATE \/ MODEL ONLY/).first()).toBeVisible();
  await expect(page.getByText("Reference close · bukan fill").first()).toBeVisible();
  await expect(page.getByText(/Harga next-open dan biaya transaksi belum diketahui/).first()).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});

test("signal pages pin immutable run and fetch only bounded continuation", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner");
  await expect(page.locator(".scanner-row")).toHaveCount(25);
  await page.getByRole("link", { name: "Berikutnya →" }).click();
  await expect(page).toHaveURL(new RegExp(`run=${runId}.*page=2`));
  await expect(page.locator(".scanner-row")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "TEST026 · FRACTAL_BREAKOUT_V1" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Berikutnya →" })).toHaveCount(0);
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const reads = calls.filter((c: { path: string }) => c.path.endsWith("scan_run_signals"));
  expect(reads).toHaveLength(2);
  expect(reads.map((r: { query: { limit: string; offset: string; run_id: string } }) => [r.query.limit, r.query.offset, r.query.run_id]))
    .toEqual([["26", "0", `eq.${runId}`], ["26", "25", `eq.${runId}`]]);
  expect(calls.some((c: { path: string }) => c.path.includes("scan_run_items"))).toBe(false);
});

test("read failure and mixed-mode contracts are errors, not empty", async ({ page, request }) => {
  for (const scenario of ["scanner-read-error", "scanner-mode-mismatch", "scanner-invalid-signal"]) {
    await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario } });
    await page.goto("/scanner");
    await expect(page.getByRole("heading", { name: scenario === "scanner-read-error" ? "Pembacaan scanner gagal" : "Kontrak scanner belum dapat diverifikasi" })).toBeVisible();
    await expect(page.locator(".scanner-row")).toHaveCount(0);
  }
});

test("only evaluated complete run may show no published signals", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-no-signals" } });
  await page.goto("/scanner");
  await expect(page.getByText("Tidak ada sinyal yang diterbitkan untuk run ini.")).toBeVisible();
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-partial" } });
  await page.goto("/scanner");
  await expect(page.getByText(/status parsial\/gagal dan quality hold tetap berlaku/)).toBeVisible();
});
