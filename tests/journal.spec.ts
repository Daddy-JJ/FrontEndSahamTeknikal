import { expect, test } from "@playwright/test";

const id="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
test.beforeEach(async({context,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"empty"}});
  const token=[{alg:"HS256",typ:"JWT"},{sub:userId,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600}]
    .map(v=>Buffer.from(JSON.stringify(v)).toString("base64url")).join(".")+".dGVzdA";
  const session={access_token:token,refresh_token:"local-test-refresh",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:userId}};
  await context.addCookies([{name:"sb-127-auth-token",value:"base64-"+Buffer.from(JSON.stringify(session)).toString("base64url"),domain:"127.0.0.1",path:"/"}]);
});

test("owner empty state, null metrics and responsive layout",async({page},info)=>{
  const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/journal");
  await expect(page.getByText("FIXTURE DEV",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Belum ada transaksi aktual"})).toBeVisible();
  await page.getByText("+ Buat Draft Transaksi Baru",{exact:true}).click();
  await expect(page.getByRole("button",{name:"Simpan Draft"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/journal-empty-${info.project.name}.png`,fullPage:true,caret:"initial"});
  await page.goto("/analytics");
  const win=page.locator(".analytics-stat-card").filter({hasText:"Win Rate (Closed)"});
  await expect(win.locator("strong")).toHaveText("—");
  await expect(page.getByText("0 menang · 0 kalah · 0 BEP")).toBeVisible();
  expect(errors).toEqual([]);
});

test("owner membership and mode reads overlap after verified authentication",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"owner-delayed"}});
  await page.goto("/journal");
  await expect(page.getByRole("heading",{name:"Catatan transaksi, satu ledger finansial."})).toBeVisible();
  const {calls,mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const membership=calls.findIndex((c:{path:string})=>c.path.endsWith("/app_members"));
  const settings=calls.findIndex((c:{path:string})=>c.path.endsWith("/deployment_settings"));
  expect(membership).toBeGreaterThan(0);
  expect(settings).toBeGreaterThan(0);
  expect(calls.slice(0,Math.min(membership,settings)).some((c:{path:string})=>c.path==="/auth/v1/user")).toBe(true);
  expect(calls[settings].membership_in_flight).toBe(true);
  expect(mutations).toEqual([]);
});

test("anonymous and non-owner cannot read journal, export or forms",async({page,context,request})=>{
  const ownerCookies=await context.cookies();
  await context.clearCookies();
  await page.goto("/journal");
  await expect(page.getByText("Masuk dengan akun owner untuk melihat transaksi.")).toBeVisible();
  expect((await page.request.get("/api/export/journal")).status()).toBe(401);
  await context.addCookies(ownerCookies);
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"outsider"}});
  await page.goto("/journal");
  await expect(page.getByText("Akun ini tidak memiliki keanggotaan owner aktif.")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  expect((await page.request.get("/api/export/journal")).status()).toBe(403);
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((c:{path:string})=>c.path.includes("actual_"))).toBe(false);
});

test("missing schema, membership read failure and mode mismatch are not empty data",async({page,request})=>{
  for(const scenario of ["schema-error","mode-mismatch"]) {
    await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
    await page.goto("/journal");
    await expect(page.getByRole("heading",{name:"Schema jurnal belum tersedia"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Simpan Draft"})).toHaveCount(0);
    await page.goto("/analytics");
    await expect(page.getByRole("heading",{name:"Statistik belum dapat dibaca"})).toBeVisible();
  }
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"member-error"}});
  await page.goto("/journal");
  await expect(page.getByText("Mode data proyek belum dapat diverifikasi.")).toBeVisible();
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"settings-live"}});
  await page.goto("/journal");
  await expect(page.getByText("Mode data proyek belum dapat diverifikasi.")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  expect((await page.request.get("/api/export/journal")).status()).toBe(503);
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((c:{path:string})=>c.path.includes("actual_"))).toBe(false);
});

test("SOT example is formatted from server ledger, MA parameters and fee estimates are explicit",async({page,request},info)=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"closed"}});
  await page.goto(`/journal/${id}`);
  await expect(page.locator(".journal-metrics")).toContainText("Rp1.200");
  await expect(page.locator(".journal-metrics")).toContainText("Rp1.000");
  await expect(page.locator(".journal-metrics")).toContainText("0,833R");
  await expect(page.getByText("Biaya Rp100")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/journal-closed-${info.project.name}.png`,fullPage:true,caret:"initial"});
  await page.goto("/analytics");
  await expect(page.getByText("Belum ada loss",{exact:true})).toHaveCount(2);
  await expect(page.locator(".journal-facts>div").filter({hasText:"Trade dengan Biaya Estimasi"})).toHaveText("Trade dengan Biaya Estimasi1 trade");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/analytics-${info.project.name}.png`,fullPage:true,caret:"initial"});
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"ma"}});
  await page.goto(`/journal/${id}`);
  await expect(page.getByText("SMA 10",{exact:true})).toBeVisible();
  await expect(page.getByText("Target terbuka",{exact:true})).toBeVisible();
});

test("partial trade retains initial risk, remaining basis and null realized R",async({page,request},info)=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"partial"}});
  await page.goto(`/journal/${id}`);
  await expect(page.getByText("Rp10.125",{exact:true})).toBeVisible();
  await expect(page.locator(".journal-metrics>div").filter({hasText:"Realized R"}).locator("strong")).toHaveText("—");
  await expect(page.locator('input[name="fee_idr"]').last()).toHaveValue("");
  await expect(page.locator('.journal-fill-form select[name="fee_status"]')).toHaveValue("estimated");
  await expect(page.getByRole("button",{name:"Catat pembelian"})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/journal-partial-${info.project.name}.png`,fullPage:true,caret:"initial"});
  await page.goto("/journal");
  const ledger=page.locator(".dense-table tbody tr").filter({hasText:"TEST"});
  await expect(ledger).toContainText("+Rp350");
  await expect(ledger).not.toContainText("Floating");
  await expect(ledger.locator("td").nth(8)).toHaveText("—");
});

test("read errors disable mutations and differ from missing trade",async({page,request})=>{
  for(const [scenario,title] of [["history-error","Riwayat trade belum dapat dibaca"],["trade-error","Trade belum dapat dibaca"],["missing","Trade tidak ditemukan"]]) {
    await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
    await page.goto(`/journal/${id}`);
    await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.getByText(/Belum ada fill/)).toHaveCount(0);
  }
});

test("retry retains request ID and payload; pending prevents double submit",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"retry"}});
  await page.goto("/journal");
  await page.getByText("+ Buat Draft Transaksi Baru",{exact:true}).click();
  await page.getByLabel("Kode saham").fill("TEST");
  await page.getByLabel("Initial stop · Rp").fill("95");
  const requestId=await page.locator('input[name="request_id"]').inputValue();
  await page.getByRole("button",{name:"Simpan Draft"}).click();
  await expect(page.getByRole("button",{name:"Simpan Draft"})).toBeDisabled();
  await expect(page.locator("form").getByRole("alert")).toContainText("belum dapat dipastikan");
  await expect(page.getByLabel("Kode saham")).toHaveValue("TEST");
  await expect(page.locator('input[name="request_id"]')).toHaveValue(requestId);
  await page.getByRole("button",{name:"Simpan Draft"}).click();
  await expect(page).toHaveURL(new RegExp(`/journal/${id}\\?saved=1`));
  const {mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toHaveLength(2);
  expect(mutations[0]).toEqual(mutations[1]);
  expect(mutations[0]).toMatchObject({p_action:"create",p_trade_id:null,p_request_id:requestId,p_payload:{initial_stop:"95"}});
});

test("fill action sends decimal strings, WIB timestamp, revision and explicit fee",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"revision-conflict"}});
  // Draft scenario supplies the buy form; switching the response scenario affects mutation only.
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"draft"}});
  await page.goto(`/journal/${id}`);
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"revision-conflict"}});
  const form=page.locator(".journal-fill-form").first();
  await form.getByLabel("Waktu fill · WIB").fill("2026-09-29T09:00");
  await form.getByLabel("Jumlah saham").fill("100");
  await form.getByLabel("Harga per saham · Rp").fill("100.25");
  await form.getByLabel("Biaya fill · Rp").fill("25");
  await form.getByRole("button",{name:"Catat pembelian"}).click();
  await expect(form.getByRole("alert")).toContainText("Revisi trade berubah");
  const {mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations[0].p_payload).toEqual({expected_revision:7,side:"buy",quantity:"100",price_idr:"100.25",fee_idr:"25",fee_status:"estimated",filled_at:"2026-09-29T02:00:00.000Z"});
});

test("invalid cohort cannot silently broaden analytics or crash export",async({page})=>{
  for(const query of ["from=2026-02-30","from=2026-13-01","from=2026-09-30&to=2026-09-01","strategy=UNKNOWN","from=2026-01-01&from=2026-02-01"]) {
    await page.goto("/analytics?"+query);
    await expect(page.getByRole("heading",{name:"Filter cohort tidak valid"})).toBeVisible();
    expect((await page.request.get("/api/export/journal?"+query)).status()).toBe(400);
  }
  expect((await page.request.get("/api/export/journal?mode=paper")).status()).toBe(400);
});

test("CSV neutralizes text formulas and preserves decimals and Jakarta cohort",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"csv-formula"}});
  const response=await page.request.get("/api/export/journal?from=2026-09-29&to=2026-09-29");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-data-mode"]).toBe("fixture");
  const csv=await response.text();
  expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
  expect(csv).toContain('"\'\t@SUM(1)"');
  expect(csv).toContain('"2026-09-29"');
  expect(csv).toContain('"2","95","99","1200","1200","0","0","1000","0.833333333333","100"');
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const q=calls.find((c:{path:string})=>c.path.endsWith("export_actual_journal")).body;
  expect(q).toMatchObject({p_status:"closed",p_from:"2026-09-29",p_to:"2026-09-29",p_limit:200,p_after:null});
});

test("large exports never silently truncate the cohort",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"large-export"}});
  expect((await page.request.get("/api/export/journal")).status()).toBe(413);
  const response=await page.request.get("/api/export/journal?after=start");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-has-more"]).toBe("true");
  expect(response.headers()["x-next-after"]).toBe(id);
  const firstCsv=await response.text();
  expect(firstCsv.trim().split("\r\n")).toHaveLength(201);
  expect(firstCsv).not.toContain("00000000-0000-4000-8000-000000000201");
  await page.goto("/journal/export?from=2026-01-01");
  await expect(page.getByRole("heading",{name:"200 trade closed pada bagian ini"})).toBeVisible();
  await page.getByRole("link",{name:"Bagian berikutnya →"}).click();
  await expect(page.getByRole("heading",{name:"1 trade closed pada bagian ini",exact:true})).toBeVisible();
  await expect(page.getByRole("link",{name:"Bagian berikutnya →"})).toHaveCount(0);
  await expect(page).toHaveURL(/from=2026-01-01&after=/);
  const second=await page.request.get(`/api/export/journal?from=2026-01-01&after=${id}`);
  expect(second.status()).toBe(200);
  expect(second.headers()["x-has-more"]).toBe("false");
  expect(second.headers()["x-next-after"]).toBe("");
  const secondCsv=await second.text();
  expect(secondCsv.trim().split("\r\n")).toHaveLength(2);
  expect(secondCsv).toContain("00000000-0000-4000-8000-000000000201");
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const exports=calls.filter((call:{path:string})=>call.path.endsWith("export_actual_journal"));
  expect(exports.some((call:{body:{p_after:string|null}})=>call.body.p_after===null)).toBe(true);
  expect(exports.filter((call:{body:{p_after:string|null}})=>call.body.p_after===id))
    .toEqual(expect.arrayContaining([expect.objectContaining({body:expect.objectContaining({
      p_from:"2026-01-01",p_after:id,p_limit:200,p_status:"closed",
    })})]));
});

test("expired session is refreshed on journal and authorization is rechecked on mutation",async({page,context,request})=>{
  const cookies=await context.cookies();
  const cookie=cookies.find(c=>c.name==="sb-127-auth-token")!;
  const session=JSON.parse(Buffer.from(cookie.value.slice(7),"base64url").toString());
  session.expires_at=1;
  await context.addCookies([{...cookie,value:"base64-"+Buffer.from(JSON.stringify(session)).toString("base64url")}]);
  const response=await page.goto("/journal");
  expect(response?.headers()["cache-control"]).toMatch(/no-cache|no-store/);
  await page.getByText("+ Buat Draft Transaksi Baru",{exact:true}).click();
  await expect(page.getByRole("button",{name:"Simpan Draft"})).toBeVisible();
  let probe=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(probe.calls.some((c:{path:string})=>c.path==="/auth/v1/token")).toBe(true);
  await page.getByLabel("Kode saham").fill("TEST");
  await page.getByLabel("Initial stop · Rp").fill("95");
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"outsider"}});
  await page.getByRole("button",{name:"Simpan Draft"}).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("izin owner");
  probe=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(probe.mutations).toHaveLength(0);
});

test("failed logout is not presented as a completed sign-out",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"logout-error"}});
  await page.goto("/auth/check");
  await expect(page.getByRole("heading",{name:"Sesi owner terverifikasi"})).toBeVisible();
  await page.getByRole("button",{name:"Keluar"}).click();
  await expect(page).toHaveURL(/\/auth\/error\?reason=logout$/);
  await expect(page.getByRole("heading",{name:"Logout belum selesai"})).toBeVisible();
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((call:{path:string})=>call.path==="/auth/v1/logout")).toBe(true);
});

test("stable fill pages show the effective corrected time and preserve it on omitted input",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"corrected-time"}});
  await page.goto(`/journal/${id}`);
  const rows=page.locator(".journal-fill");
  await expect(rows.first().locator("strong").last()).toHaveText("Rp108");
  const correctedRow=rows.filter({hasText:"dikoreksi"});
  await expect(correctedRow).toContainText("11.00.00 WIB · dikoreksi");
  await correctedRow.getByText("Koreksi fill",{exact:true}).click();
  await correctedRow.getByLabel("Alasan koreksi").fill("Perbaiki fee dari konfirmasi broker");
  await correctedRow.getByRole("button",{name:"Simpan koreksi"}).click();
  await expect(page).toHaveURL(/saved=1/);
  const {mutations}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(mutations).toHaveLength(1);
  expect(mutations[0].p_payload).not.toHaveProperty("filled_at");
  expect(mutations[0].p_payload.restate_initial_risk).toBe(false);
});

test("exact exit snapshot is shared by analytics and CSV without widening cohort",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"closed"}});
  await page.goto("/analytics?exit_snapshot=fixed2r");
  await expect(page.getByLabel("Konfigurasi exit persis")).toHaveValue("fixed2r");
  await expect(page.getByRole("link",{name:"Ekspor CSV cohort"})).toHaveAttribute("href",/exit_snapshot=fixed2r/);
  const response=await page.request.get("/api/export/journal?exit_snapshot=fixed2r");
  expect(response.status()).toBe(200);
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  for(const path of ["actual_journal_analytics","export_actual_journal"]) {
    const rpc=calls.find((c:{path:string})=>c.path.endsWith(path));
    expect(rpc.body.p_exit_snapshot).toEqual({version:"actual-fixed2r-v1",mode:"fixed_rr",target_r:2});
  }
  await page.goto("/analytics?exit_snapshot=unknown");
  await expect(page.getByRole("heading",{name:"Filter cohort tidak valid"})).toBeVisible();
  expect((await page.request.get("/api/export/journal?exit_snapshot=unknown")).status()).toBe(400);
});

test("long trade and event histories page independently with bounded reads",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"long-history"}});
  await page.goto("/journal");
  await expect(page.locator(".dense-table tbody tr")).toHaveCount(100);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const beforeTradePage=(await (await request.get("http://127.0.0.1:3053/__calls")).json()).calls.length;
  await page.getByRole("navigation",{name:"Halaman riwayat trade"}).getByRole("link",{name:"Lebih lama →"}).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".dense-table tbody tr")).toHaveCount(100);
  const tradePageCalls=(await (await request.get("http://127.0.0.1:3053/__calls")).json()).calls.slice(beforeTradePage);
  expect(tradePageCalls.some((c:{path:string})=>c.path.endsWith("actual_journal_analytics"))).toBe(false);
  await page.getByRole("navigation",{name:"Halaman riwayat trade"}).getByRole("link",{name:"Lebih lama →"}).click();
  await expect(page.locator(".dense-table tbody tr")).toHaveCount(5);
  await page.goto(`/journal/${id}`);
  await expect(page.locator(".journal-fill")).toHaveCount(50);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole("navigation",{name:"Halaman Fill"}).getByRole("link",{name:"Lebih lama →"}).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".journal-fill")).toHaveCount(50);
  const beforeNotes=(await (await request.get("http://127.0.0.1:3053/__calls")).json()).calls.length;
  await page.getByRole("navigation",{name:"Jenis riwayat trade"}).getByRole("link",{name:"Catatan"}).click();
  await expect(page).toHaveURL(/section=notes/);
  await expect(page.locator(".journal-fill")).toHaveCount(0);
  const noteCalls=(await (await request.get("http://127.0.0.1:3053/__calls")).json()).calls.slice(beforeNotes);
  const eventCalls=noteCalls.filter((c:{path:string})=>/\/rest\/v1\/actual_(fills|fill_corrections|stop_events|notes|trade_tags)$/.test(c.path));
  expect(eventCalls.map((c:{path:string})=>c.path)).toEqual(["/rest/v1/actual_notes"]);
  await page.getByRole("navigation",{name:"Halaman Catatan"}).getByRole("link",{name:"Lebih lama →"}).click();
  await expect(page).toHaveURL(/section=notes&page=2/);
  await expect(page.locator(".journal-history p")).toHaveCount(50);
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  for(const c of calls.filter((c:{path:string})=>c.path.includes("/rest/v1/actual_") && !c.path.includes("rpc"))) {
    if(c.path.endsWith("actual_trades") && c.query.id) continue;
    expect(Number(c.query.limit)).toBeLessThanOrEqual(c.path.endsWith("actual_trades")?101:51);
    if(c.path.endsWith("actual_fills")) {
      expect(c.query["latest_correction.limit"]).toBe("1");
      expect(c.query.select).toContain("actual_fill_corrections!actual_fill_corrections_fill_id_fkey");
    }
  }
});


test("analytics failure is unavailable and does not preload closed history",async({page,request})=>{
  for(const scenario of ["analytics-error","analytics-wrong-basis"]) {
    await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
    await page.goto("/analytics");
    await expect(page.getByRole("heading",{name:"Statistik belum dapat dibaca"})).toBeVisible();
    await expect(page.locator(".analytics-stat-card")).toHaveCount(0);
    const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
    expect(calls.some((c:{path:string})=>c.path.endsWith("actual_trades"))).toBe(false);
  }
});

test("cohort navigation retains dates and exact exit in KPI and export",async({page,request})=>{
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"closed"}});
  await page.goto("/analytics?from=2026-09-01&to=2026-09-29&exit_snapshot=fixed2r");
  const link=page.getByRole("link",{name:"Fractal Breakout",exact:true});
  await expect(link).toHaveAttribute("href",/from=2026-09-01/);
  await expect(link).toHaveAttribute("href",/to=2026-09-29/);
  await expect(link).toHaveAttribute("href",/exit_snapshot=fixed2r/);
  await link.click();
  await expect(page.getByRole("link",{name:"Ekspor CSV cohort"})).toHaveAttribute("href",/strategy=FRACTAL_BREAKOUT_V1/);
  const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
  const rpc=calls.filter((c:{path:string})=>c.path.endsWith("actual_journal_analytics")).at(-1);
  expect(rpc.body).toMatchObject({p_from:"2026-09-01",p_to:"2026-09-29",p_strategy:"FRACTAL_BREAKOUT_V1",p_exit_snapshot:{mode:"fixed_rr",target_r:2,version:"actual-fixed2r-v1"}});
  expect(calls.some((c:{path:string})=>c.path.endsWith("actual_trades"))).toBe(false);
});

test("fixture paper remains isolated from actual ledger reads",async({page,request})=>{
  for(const route of ["/journal?tab=paper","/analytics?tab=paper"]) {
    await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"empty"}});
    await page.goto(route);
    await expect(page.getByText(/DATA UJI DEVELOPMENT — bukan hasil pasar atau akun riil/)).toBeVisible();
    await expect(page.getByRole("heading",{name:route.startsWith("/journal") ? "Jurnal paper persisten" : "Transaksi pembentuk statistik"})).toBeVisible();
    const {calls}=await (await request.get("http://127.0.0.1:3053/__calls")).json();
    expect(calls.some((c:{path:string})=>c.path.includes("actual_"))).toBe(false);
  }
});
