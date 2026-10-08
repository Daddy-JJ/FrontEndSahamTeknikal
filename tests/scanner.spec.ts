import { expect, test } from "@playwright/test";

const runId = "11111111-1111-4111-8111-111111111111";
test("failed latest run opens quality holds and traverses all100 items with bounded reads", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-failed" } });
  await page.goto("/scanner");
  await expect(page.getByRole("heading", { name: "Scan gagal", exact: true })).toBeVisible();
  await expect(page.getByText("0 / 100", { exact: true })).toBeVisible();
  const seen = new Set<string>();
  for (let i = 1; i <= 4; i++) {
    await expect(page.getByText(new RegExp(`Halaman\\s+${i}\\s+· maksimal 25 baris`))).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(25);
    await expect(page.getByRole("table").locator("tbody tr").first()).toHaveAttribute("data-status", "data_quality_hold");
    for (const ticker of await page.getByRole("table").locator("tbody tr td:first-child").allTextContents()) seen.add(ticker);
    if (i < 4) await page.getByRole("link", { name: "Berikutnya →" }).click();
  }
  expect(seen.size).toBe(100);
  await expect(page.getByRole("link", { name: "Berikutnya →" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Pemindaian live sedang disiapkan." })).toHaveCount(0);
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
  const reads = calls.filter((c: { path: string }) => c.path.endsWith("scan_run_items"));
  expect(reads.map((r: { query: { limit: string; offset: string; run_id: string } }) => [r.query.limit, r.query.offset, r.query.run_id]))
    .toEqual([0,25,50,75].map(offset => ["26", String(offset), `eq.${runId}`]));
  expect(calls.some((c: { path: string }) => c.path.endsWith("scan_run_signals"))).toBe(false);
  const latest = calls.find((c: { path: string; query: { status?: string } }) => c.path.endsWith("scan_runs") && !c.query.status);
  expect(latest.query.order).toBe("session_date.desc,stored_at.desc,id.desc");
});
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
  await page.screenshot({caret:"initial", path: `test-results/scanner-partial-${info.project.name}.png`, fullPage: true });
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
  await page.getByText("Detail run & sumber", { exact: true }).click();
  await expect(page.getByText(/Harga next-open dan biaya transaksi belum diketahui/).first()).toBeVisible();
  await expect(page.locator('form:not([method="get"])')).toHaveCount(0);
});

test("signal pages pin immutable run and fetch only bounded continuation", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner");
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(25);
  await page.getByRole("link", { name: "Berikutnya →" }).click();
  await expect(page).toHaveURL(new RegExp(`run=${runId}.*page=2`));
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Detail TEST026", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Berikutnya →" })).toHaveCount(0);
  await page.goto(`/scanner?run=${runId}&section=signals&page=3`);
  await expect(page.getByText("Tidak ada sinyal pada halaman lanjutan ini.")).toBeVisible();
  await expect(page.getByText("Tidak ada sinyal yang diterbitkan untuk run ini.")).toHaveCount(0);
  await expect(page.getByText(/Tidak ada emiten yang memenuhi/)).toHaveCount(0);
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const reads = calls.filter((c: { path: string }) => c.path.endsWith("scan_run_signals"));
  expect(reads).toHaveLength(3);
  expect(reads.map((r: { query: { limit: string; offset: string; run_id: string } }) => [r.query.limit, r.query.offset, r.query.run_id]))
    .toEqual([["26", "0", `eq.${runId}`], ["26", "25", `eq.${runId}`], ["26", "50", `eq.${runId}`]]);
  expect(calls.some((c: { path: string }) => c.path.includes("scan_run_items"))).toBe(false);
});

test("stop decisions remain backend reasons without derived risk or fill claims", async ({ page, request }) => {
  for (const scenario of ["scanner-invalid-stop", "scanner-missing-stop"]) {
    await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario } });
    await page.goto("/scanner");
    await expect(page.getByText(scenario === "scanner-invalid-stop"
      ? "Stop tidak valid menurut backend" : "Stop belum tersedia menurut backend").first()).toBeVisible();
    await expect(page.getByText(/Risk Buffer|ΔR|-Rp-/)).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Reference close · bukan fill" })).toBeVisible();
    await page.getByText("Detail run & sumber", { exact: true }).click();
    await expect(page.getByText(/Harga next-open dan biaya transaksi belum diketahui/).first()).toBeVisible();
  }
  const { mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
});

test("signal detail presents frozen rule and temporal provenance without recalculation", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner");
  const row = page.getByRole("table", { name: "Sinyal diterbitkan" }).locator("tbody tr").first();
  await row.getByRole("button").click();
  const detail = page.locator("#scanner-detail");
  await expect(detail.getByText("2026-09-23", { exact: true })).toBeVisible();
  await expect(detail.getByText("2026-09-25", { exact: true })).toBeVisible();
  await expect(detail.getByText("Pivot date", { exact: true })).toBeVisible();
  await expect(detail.getByText("Available-at session", { exact: true })).toBeVisible();
  await expect(detail.getByRole("list", { name: "Rule checklist backend" })).toContainText("close_above_fractal");
  await expect(detail.getByText("c".repeat(64), { exact: true })).toBeVisible();
  await expect(detail.getByText("d".repeat(64), { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
  const reads = calls.filter((c: { path: string }) => c.path.endsWith("scan_run_signals"));
  expect(reads).toHaveLength(1);
  expect(reads[0].query.limit).toBe("26");
  expect(reads[0].query.run_id).toBe(`eq.${runId}`);
  expect(reads[0].query.select).toContain("candidate:snapshot->candidate");
  expect(reads[0].query.select).not.toMatch(/,snapshot[,)]/);
});

test("date and strategy filters use bounded backend reads and survive pagination", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner");
  await page.getByLabel("Sesi target", { exact: true }).fill("2026-09-28");
  await page.getByRole("combobox", { name: "Strategi sinyal", exact: true }).selectOption("FRACTAL_BREAKOUT_V1");
  await page.getByRole("button", { name: "Terapkan filter" }).click();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(25);
  await page.getByRole("link", { name: "Berikutnya →" }).click();
  await expect(page).toHaveURL(/run=.*page=2.*date=2026-09-28/);
  const selected = new URL(page.url());
  expect(selected.searchParams.get("run")).toBe(runId);
  expect(selected.searchParams.get("date")).toBe("2026-09-28");
  expect(selected.searchParams.get("strategy")).toBe("FRACTAL_BREAKOUT_V1");
  await expect(page.getByRole("button", { name: "Detail TEST026", exact: true })).toBeVisible();
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const signalReads = calls.filter((c: { path: string; query: Record<string, string> }) => c.path.endsWith("scan_run_signals") && c.query["signals.strategy"]);
  expect(signalReads).toHaveLength(2);
  expect(signalReads.every((c: { query: Record<string, string> }) => c.query["signals.strategy"] === "eq.FRACTAL_BREAKOUT_V1" && c.query.limit === "26")).toBe(true);
  expect(calls.some((c: { path: string; query: Record<string, string> }) => c.path.endsWith("scan_runs") && c.query.session_date === "eq.2026-09-28")).toBe(true);
  await page.goto("/scanner?date=2026-09-28&strategy=MACD_EMA200_V1");
  await expect(page.getByText("Tidak ada sinyal yang diterbitkan untuk strategi ini pada run terpilih.")).toBeVisible();
  await page.goto("/scanner?date=2026-09-27");
  await expect(page.getByRole("heading", { name: "Run tidak ditemukan" })).toBeVisible();
});

test("invalid scanner filters block data reads while allowing auth refresh", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner?strategy=UNKNOWN&date=2026-02-30");
  await expect(page.getByRole("heading", { name: "Halaman scanner tidak valid" })).toBeVisible();
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((c:{path:string})=>c.path.startsWith("/rest/v1/"))).toBe(false);
});

test("signal link only prefills a verified actual draft, never a fill", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  await page.goto("/scanner");
  const row = page.getByRole("table", { name: "Sinyal diterbitkan" }).locator("tbody tr").first();
  await row.getByRole("button").click();
  const detail = page.locator("#scanner-detail");
  await detail.getByRole("link", { name: "Buat draft aktual" }).click();
  await expect(page.getByLabel("Kode saham", { exact: true })).toHaveValue("TEST001");
  await expect(page.getByRole("combobox", { name: "Strategi utama", exact: true })).toHaveValue("FRACTAL_BREAKOUT_V1");
  await expect(page.getByLabel("Initial stop · Rp", { exact: true })).toHaveValue("");
  await expect(page.getByText(/Draft belum punya harga entry/)).toBeVisible();
  const { mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
});

test("live paper never loads fixture book or actual analytics", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-paper" } });
  for (const route of ["/journal?tab=paper", "/analytics?tab=paper"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Backend reporting belum siap" })).toBeVisible();
    await expect(page.getByText(/DEMO-/)).toHaveCount(0);
    await expect(page.getByText(/Baseline terverifikasi|17 transaksi/)).toHaveCount(0);
  }
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
  expect(calls.some((c: { path: string }) => /actual_|get_actual|export_actual/.test(c.path))).toBe(false);
  expect(calls.filter((c: { path: string }) => c.path.endsWith("read_trade_reporting_v1"))).toHaveLength(2);
});

test("read failure and mixed-mode contracts are errors, not empty", async ({ page, request }) => {
  for (const scenario of ["scanner-read-error", "scanner-mode-mismatch", "scanner-invalid-signal"]) {
    await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario } });
    await page.goto("/scanner");
    await expect(page.getByRole("heading", { name: scenario === "scanner-read-error" ? "Pembacaan scanner gagal" : "Kontrak scanner belum dapat diverifikasi" })).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(0);
  }
});

test("only evaluated complete run may show no published signals", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-no-signals" } });
  await page.goto("/scanner");
  await expect(page.getByText("Tidak ada sinyal yang diterbitkan untuk run ini.")).toBeVisible();
  await page.goto(`/scanner?run=${runId}&section=signals&page=2`);
  await expect(page.getByText("Tidak ada sinyal pada halaman lanjutan ini.")).toBeVisible();
  await expect(page.getByText(/ini bukan hasil lengkap seluruh universe/)).toHaveCount(0);
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-partial" } });
  await page.goto("/scanner?section=signals");
  await expect(page.getByText(/ini bukan hasil lengkap seluruh universe/)).toBeVisible();
});

test("recovery partial defaults to quality and preserves all hold categories", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-recovery" } });
  await page.goto("/scanner");
  await expect(page.getByRole("table", { name: "Quality dan evaluasi ticker" })).toBeVisible();
  await expect(page.getByText("45 / 100", { exact: true })).toBeVisible();
  await expect(page.locator(".terminal-notice")).toContainText("45 dari 100 ticker dievaluasi");
  await page.getByText("Detail run & sumber", { exact: true }).click();
  await expect(page.getByText(/bukan bukti freshness provider/)).toBeVisible();
  await expect(page.getByText("Snapshot tersimpan (WIB)")).toBeVisible();
  const statuses: string[] = [];
  for (let p = 1; p <= 4; p++) {
    await expect(page.getByText(`Halaman ${p} · maksimal 25 baris`)).toBeVisible();
    statuses.push(...await page.getByRole("table").locator("tbody tr").evaluateAll(rows => rows.map(row => row.getAttribute("data-status") ?? "")));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (p < 4) await page.getByRole("link", { name: "Berikutnya →" }).click();
  }
  expect(statuses.filter(s => s === "evaluated")).toHaveLength(45);
  expect(statuses.filter(s => s === "corporate_action_hold")).toHaveLength(25);
  expect(statuses.filter(s => s === "data_quality_hold")).toHaveLength(30);
  await page.getByRole("link", { name: "Sinyal diterbitkan", exact: true }).click();
  await expect(page.getByText(/ini bukan hasil lengkap seluruh universe/)).toBeVisible();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(0);
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
  expect(calls.filter((c: { path: string }) => c.path.endsWith("scan_run_items"))).toHaveLength(4);
});


test("owner operations opens existing workflow link without dispatch or fake status",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"scanner-complete"}});
  await page.goto("/operations");
  await expect(page.getByRole("link",{name:"Buka GitHub Actions"})).toHaveAttribute("href","https://github.com/Daddy-JJ/BackendSahamTeknikal/actions");
  await expect(page.getByRole("heading",{name:"Observasi Status Snapshot Database"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const {calls,mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toEqual([]);
  expect(calls.some((c:{path:string})=>c.path.includes("/rpc/"))).toBe(false);
  const snapshots=calls.filter((c:{path:string})=>c.path.endsWith("/scan_runs"));
  expect(snapshots).toHaveLength(1);
  expect(snapshots[0].query).toMatchObject({limit:"1",namespace:"eq.forward",data_mode:"eq.live"});
  await expect(page.getByText("2026-09-28",{exact:true})).toBeVisible();
  await expect(page.getByText("100 / 100",{exact:true})).toBeVisible();
  await expect(page.getByText("a".repeat(64),{exact:true})).toBeVisible();
});


test("linked signal draft keeps exact request across retry and creates no fill",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"scanner-draft-retry"}});
  const signalId="1".padStart(64,"0");
  await page.goto("/journal?signal_id="+signalId);
  await page.getByLabel("Initial stop · Rp",{exact:true}).fill("95");
  const requestId=await page.locator('input[name="request_id"]').inputValue();
  await page.getByRole("button",{name:"Simpan Draft"}).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("belum dapat dipastikan");
  await expect(page.locator('input[name="request_id"]')).toHaveValue(requestId);
  await page.getByRole("button",{name:"Simpan Draft"}).click();
  await expect(page).toHaveURL(/saved=1/);
  const {mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toHaveLength(2);
  expect(mutations[0]).toEqual(mutations[1]);
  expect(mutations[0]).toMatchObject({p_action:"create",p_request_id:requestId,p_payload:{signal_id:signalId,ticker:"TEST001",primary_strategy:"FRACTAL_BREAKOUT_V1",initial_stop:"95"}});
  expect(mutations.every((m:{p_action:string})=>m.p_action==="create")).toBe(true);
});

test("missing signal and changed strategy reject linked draft before mutation",async({page,request})=>{
  for(const scenario of ["scanner-draft-missing","scanner-complete"]) {
    await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"scanner-complete"}});
    await page.goto("/journal?signal_id="+"1".padStart(64,"0"));
    await page.getByLabel("Initial stop · Rp",{exact:true}).fill("95");
    if(scenario==="scanner-complete") await page.getByLabel("Strategi utama").selectOption("MACD_EMA200_V1");
    await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
    await page.getByRole("button",{name:"Simpan Draft"}).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("Periksa harga");
    const {mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
    expect(mutations).toEqual([]);
  }
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"scanner-draft-missing"}});
  await page.goto("/journal?signal_id="+"1".padStart(64,"0"));
  await expect(page.getByRole("heading",{name:"Sinyal draft belum dapat diverifikasi"})).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});

test("terminal preview keeps dense geometry and loaded quality detail accessible", async ({ page, request }, info) => {
  const browserErrors: string[] = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-partial" } });
  await page.setViewportSize(info.project.name === "desktop" ? { width: 1366, height: 768 } : { width: 390, height: 844 });
  await page.goto("/");
  const table = page.getByRole("table", { name: "Quality dan evaluasi ticker" });
  await expect(table.locator("tbody tr")).toHaveCount(25);
  await expect(page.locator(".terminal-notice")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (info.project.name === "desktop") {
    const geometry = await table.locator("tbody tr").evaluateAll(rows => ({
      first: rows[0].getBoundingClientRect().top,
      visible: rows.filter(row => { const r = row.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }).length,
      heights: rows.map(row => row.getBoundingClientRect().height),
    }));
    expect(geometry.first).toBeLessThanOrEqual(280);
    expect(geometry.visible).toBeGreaterThanOrEqual(10);
    expect(geometry.heights.every(height => height >= 32 && height <= 36)).toBe(true);
    await info.attach("terminal-geometry", { body: JSON.stringify(geometry), contentType: "application/json" });
  }
  // Explicit screenshot label is test-only DOM decoration, never production fallback.
  await page.evaluate(() => {
    const badge = document.querySelector(".journal-nav .badge");
    if (badge) badge.textContent = "LOCAL HTTP FIXTURE";
    const banner = document.createElement("div");
    banner.textContent = "LOCAL UI PREVIEW · SYNTHETIC HTTP FIXTURE · NO LIVE MARKET DATA";
    banner.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:999;background:#68420d;color:#fff3cd;font:10px Arial;text-align:center;padding:5px";
    document.body.append(banner);
  });
  await page.screenshot({caret:"initial", path: "test-results/scanner-terminal-base-" + info.project.name + ".png", fullPage: false });
  await page.getByRole("button", { name: "Detail TEST002", exact: true }).click();
  const detail = page.locator("#scanner-detail");
  await expect(detail.getByRole("heading", { name: "Detail TEST002" })).toBeVisible();
  await expect(detail.getByText("Histori belum mencukupi", { exact: false }).first()).toBeVisible();
  await expect(detail.getByText("RS ditahan: cross-section belum lengkap", { exact: false }).first()).toBeVisible();
  await expect(table.locator('tr[aria-selected="true"]')).toHaveCount(1);
  const { calls } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.filter((call: { path: string }) => call.path.endsWith("scan_run_items"))).toHaveLength(1);
  await page.screenshot({caret:"initial", path: "test-results/scanner-terminal-preview-" + info.project.name + ".png", fullPage: false });
  await page.keyboard.press("Escape");
  await expect(detail).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Detail TEST002", exact: true })).toBeFocused();
  expect(browserErrors).toEqual([]);
});

test("terminal matrix preserves cell states, all rule details and keyboard focus at narrow widths", async ({ page, request }, info) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-terminal-matrix" } });
  await page.goto("/scanner");
  const table = page.getByRole("table", { name: "Quality dan evaluasi ticker" });
  const row = table.locator("tbody tr").nth(1);
  await expect(row).toContainText("History hold");
  await expect(row).toContainText("✓ Triggered");
  await expect(row).toContainText("RS Hold");
  await expect(row).toContainText("Tidak terpicu");
  await expect(table.locator("tbody tr").first()).toContainText("Data hold");
  const button = row.getByRole("button", { name: "Detail TEST002", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  const detail = page.locator("#scanner-detail");
  await expect(detail).toContainText("close_above_fractal");
  await expect(detail).toContainText("pullback_reclaim");
  await expect(detail.getByRole("heading", { name: "FRACTAL_BREAKOUT_V1", exact: true })).toBeVisible();
  // 683 CSS pixels represents a 1366px display at 200% browser zoom.
  for (const width of [683, 390, 320]) {
    await page.setViewportSize({ width, height: 768 });
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const controls = await page.locator(".terminal-filters input:not([type=hidden]),.terminal-filters select").evaluateAll(elements =>
      elements.map(element => ({ font: parseFloat(getComputedStyle(element).fontSize), height: element.getBoundingClientRect().height })));
    if (info.project.name === "mobile") expect(controls.every(control => control.font >= 16 && control.height >= 44)).toBe(true);
    await expect.poll(() => detail.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
    await expect.poll(() => detail.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.filter((call: { path: string }) => call.path.endsWith("scan_run_items"))).toHaveLength(1);
  expect(mutations).toEqual([]);
});

test("terminal filtered immutable page survives refresh and browser back", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-complete" } });
  const route = "/scanner?run=" + runId + "&section=signals&page=1&date=2026-09-28&strategy=FRACTAL_BREAKOUT_V1";
  await page.goto(route);
  await page.getByRole("button", { name: "Detail TEST001", exact: true }).click();
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Berikutnya →" }).click();
  await expect(page).toHaveURL(new RegExp("run=" + runId + ".*page=2"));
  await expect(page.getByRole("button", { name: "Detail TEST026", exact: true })).toBeVisible();
  await expect(page.locator("#scanner-detail")).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Detail TEST026", exact: true })).toBeVisible();
  await expect(page.getByLabel("Sesi target", { exact: true })).toHaveValue("2026-09-28");
  await expect(page.getByRole("combobox", { name: "Strategi sinyal", exact: true })).toHaveValue("FRACTAL_BREAKOUT_V1");
  await page.goBack();
  await expect(page).toHaveURL(new RegExp("run=" + runId + ".*page=1"));
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(25);
  await expect(page.locator(".scanner-terminal-shell")).toBeVisible();
});

test("drawer restores its row opener after pointer activation without prior focus", async ({ page, request }) => {
  await request.post("http://127.0.0.1:3053/__scenario", { data: { scenario: "scanner-partial" } });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scanner");
  const opener = page.getByRole("button", { name: "Detail TEST002", exact: true });
  for (const method of ["escape", "close"]) {
    await page.getByLabel("Sesi target", { exact: true }).focus();
    await opener.evaluate(element => {
      element.removeAttribute("data-focus-observed");
      element.addEventListener("focus", () => element.setAttribute("data-focus-observed", "true"), { once: true });
      // Pointer activation can omit focus on native buttons (for example Safari).
      element.addEventListener("pointerdown", event => event.preventDefault(), { once: true });
    });
    await opener.click();
    const detail = page.getByRole("dialog");
    await expect(detail).toBeVisible();
    await expect(opener).not.toHaveAttribute("data-focus-observed", "true");
    if (method === "escape") await page.keyboard.press("Escape");
    else await detail.getByRole("button", { name: "Tutup detail TEST002", exact: true }).click();
    await expect(detail).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
  const { calls, mutations } = await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.filter((call: { path: string }) => call.path.endsWith("scan_run_items"))).toHaveLength(1);
  expect(mutations).toEqual([]);
});
