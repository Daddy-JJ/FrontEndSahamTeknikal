import {expect,test} from "@playwright/test";
const uid="22222222-2222-4222-8222-222222222222";
test.beforeEach(async({context,request})=>{
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"reporting-ready"}});
 const token=[{alg:"HS256",typ:"JWT"},{sub:uid,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600}].map(v=>Buffer.from(JSON.stringify(v)).toString("base64url")).join(".")+".dGVzdA";
 const session={access_token:token,refresh_token:"local-test-refresh",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:uid}};
 await context.addCookies([{name:"sb-127-auth-token",value:"base64-"+Buffer.from(JSON.stringify(session)).toString("base64url"),domain:"127.0.0.1",path:"/"}]);
});
test("paper dashboard canonical money, experiment filtering and responsive matrix",async({page,request},info)=>{
 const errors:string[]=[],hydration:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 page.on("console",message=>{if(message.type()==="error"&&/hydrated|hydration mismatch/i.test(message.text())) hydration.push(message.text());});
 await page.goto("/analytics?tab=paper");
 await expect(page.locator(".site-terminal-shell")).toBeVisible();
 await expect(page.locator(".journal-nav a[aria-current=page]")).toHaveText("Analytics");
 await expect(page.getByRole("heading",{name:"Kurva P&L net kumulatif"})).toBeVisible();
 await expect(page.locator(".analytics-stat-card").first()).toContainText("Rp1.834.875");
 await expect(page.getByRole("link",{name:"Evaluasi Sinyal",exact:true})).toBeVisible();
 await expect(page.locator(".reporting-trades")).toContainText("Rp993.037,5");
 await page.getByRole("combobox",{name:"Eksperimen exit"}).selectOption("ma10");
 await page.getByRole("button",{name:"Terapkan cohort"}).click();
 await expect(page).toHaveURL(/exit_key=ma10/);
 await expect(page.locator(".reporting-trades")).toContainText("ma_close");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator(".reporting-list").evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth))).toBe(true);
 await page.screenshot({caret:"initial",path:"test-results/reporting-paper-"+info.project.name+".png",fullPage:true});
 expect(errors).toEqual([]);
 expect(hydration).toEqual([]);
 const {calls}=await(await request.get("http://127.0.0.1:3053/__calls")).json();
 expect(calls.some((c:{path:string;body?:{p_exit_key?:string}})=>c.path.endsWith("read_trade_reporting_v1")&&c.body?.p_exit_key==="ma10")).toBe(true);
 expect(calls.some((c:{path:string})=>c.path.includes("actual_"))).toBe(false);
});
test("signal observation shows won/lost, denominators, holds and no time exit",async({page,request})=>{
 await page.goto("/analytics?tab=signals");
 await expect(page.getByRole("heading",{name:"Evaluasi per jenis sinyal"})).toBeVisible();
 await expect(page.getByText("Checkpoint 5/10 sesi tidak menutup posisi.",{exact:false})).toBeVisible();
 await expect(page.locator(".evaluation-matrix")).toContainText("1 / 2 dinilai");
 await expect(page.locator(".evaluation-matrix")).toContainText("1 data tertahan");
 await expect(page.locator("#signal-observations")).toContainText("Berhasil");
 await expect(page.locator("#signal-observations")).toContainText("Gagal");
 await expect(page.locator("#signal-observations")).toContainText("Menunggu");
 await page.locator("#signal-observations summary").first().click();
 await expect(page.getByText("a".repeat(64),{exact:true})).toBeVisible();
 await expect(page.locator("#signal-observations details").first()).toContainText("Rp1.075");
 await expect(page.locator("#signal-observations details").first()).toContainText("Rp1.150");
 await expect(page.getByRole("combobox",{name:"Eksperimen exit"})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator(".reporting-list").evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth))).toBe(true);
 const {calls}=await(await request.get("http://127.0.0.1:3053/__calls")).json();
 expect(calls.some((c:{path:string})=>c.path.endsWith("read_trade_reporting_v1"))).toBe(false);
});
test("actual IDR reporting preserves exact snapshot, CSV and detail route",async({page,request})=>{
 await page.goto("/analytics?tab=actual&from=2026-09-01&to=2026-09-30&exit_snapshot=fixed2r");
 await expect(page.getByRole("heading",{name:"Kurva P&L net kumulatif"})).toBeVisible();
 await expect(page.locator(".analytics-stat-card").filter({hasText:"Drawdown closed-P&L"})).toContainText("Rp0");
 await expect(page.getByRole("link",{name:"Ekspor CSV cohort"})).toHaveAttribute("href",/exit_snapshot=fixed2r/);
 await expect(page.locator(".reporting-trades").getByRole("link",{name:"Lihat →"})).toHaveAttribute("href","/journal/11111111-1111-4111-8111-111111111111");
 await page.getByRole("link",{name:"RS Breakout",exact:true}).first().click();
 await expect(page).toHaveURL(/strategy=RS_BREAKOUT_V1/);
 expect(new URL(page.url()).searchParams.get("exit_snapshot")).toBe("fixed2r");
 const {calls}=await(await request.get("http://127.0.0.1:3053/__calls")).json();
 const rpc=calls.filter((c:{path:string})=>c.path.endsWith("read_trade_reporting_v1")).at(-1);
 expect(rpc.body).toMatchObject({p_mode:"actual",p_exit_snapshot:{version:"actual-fixed2r-v1",mode:"fixed_rr",target_r:2},p_from:"2026-09-01",p_to:"2026-09-30"});
});
test("paper detail audit and SMA10 confirmed close semantics",async({page})=>{
 await page.goto("/journal/paper/paper-test-v1");
 await expect(page.getByRole("heading",{name:"TEST · SMA10"})).toBeVisible();
 await expect(page.getByText("entry",{exact:true})).toBeVisible();
 await expect(page.getByText("exit",{exact:true})).toBeVisible();
 await expect(page.getByText("SMA10 dipicu hanya oleh close terkonfirmasi di bawah SMA10",{exact:false})).toBeVisible();
 await expect(page.locator(".journal-facts")).toContainText("Rp945.000");
 await expect(page.locator(".journal-facts")).toContainText("Rp993.037,5");
 await expect(page.getByText("pending_exit",{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator(".reporting-list").evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth))).toBe(true);
 await page.reload();
 await expect(page.getByRole("heading",{name:"TEST · SMA10"})).toBeVisible();
});
test("unavailable, malformed, stale and partial states remain explicit",async({page,request})=>{
 for(const [scenario,heading] of [["reporting-unavailable","Backend reporting belum siap"],["reporting-error","Reporting belum dapat dibaca"],["reporting-mode-mismatch","Reporting belum dapat dibaca"]]){
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
  await page.goto("/analytics?tab=paper");
  await expect(page.getByRole("heading",{name:heading})).toBeVisible();
  await expect(page.locator(".analytics-stat-card")).toHaveCount(0);
 }
 for(const [scenario,label] of [["reporting-stale","Data jurnal stale"],["reporting-partial","Data jurnal parsial"]]){
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
  await page.goto("/analytics?tab=paper");
  await expect(page.getByText(label,{exact:true})).toBeVisible();
 }
});
test("invalid cohort has no reporting reads and empty samples remain undefined",async({page,request})=>{
 await page.goto("/analytics?tab=paper&from=2026-02-30");
 await expect(page.getByRole("heading",{name:"Filter cohort tidak valid"})).toBeVisible();
 const {calls}=await(await request.get("http://127.0.0.1:3053/__calls")).json();
 expect(calls.some((c:{path:string})=>c.path.includes("read_trade_reporting_v1"))).toBe(false);
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"empty"}});
 await page.goto("/analytics?tab=paper");
 await expect(page.locator(".analytics-stat-card").filter({hasText:"Win Rate (Closed)"}).locator("strong")).toHaveText("—");
 await expect(page.getByText("Belum ada trade closed dinilai pada cohort ini.")).toBeVisible();
});

test("journal and observation completeness do not imply complete scanner coverage",async({page,request})=>{
 for(const [route,scope] of [["/analytics?tab=paper","Data jurnal lengkap"],["/analytics?tab=signals","Data observasi parsial"]]){
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"reporting-scanner-partial"}});
  await page.goto(route);
  await expect(page.getByText(scope,{exact:true})).toBeVisible();
  await expect(page.locator('[data-scanner-coverage="partial"]')).toHaveText("Scanner parsial · 95/100 · sesi 2026-09-30");
  await expect(page.getByText("Coverage lengkap",{exact:true})).toHaveCount(0);
  const {calls}=await(await request.get("http://127.0.0.1:3053/__calls")).json();
  expect(calls.some((c:{path:string})=>["scan_runs","scan_run_items","scan_run_signals"].some(t=>c.path.endsWith("/"+t)))).toBe(false);
  expect(calls.filter((c:{path:string})=>c.path.endsWith("read_trade_reporting_v1")||c.path.endsWith("read_signal_evaluation_v1"))).toHaveLength(1);
 }
});
test("scanner missing, failed, unavailable and invalid metadata remain distinct",async({page,request})=>{
 for(const [scenario,label] of [["reporting-scanner-missing","Scanner belum tersedia"],["reporting-scanner-failed","Scanner gagal · 0/100 · sesi 2026-09-30"],["reporting-ready","Coverage scanner belum tersedia"]]){
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
  await page.goto("/journal?tab=paper");
  await expect(page.getByText(label,{exact:true})).toBeVisible();
  await expect(page.getByText("Data jurnal lengkap",{exact:true})).toBeVisible();
 }
 for(const scenario of ["reporting-scanner-invalid","reporting-scanner-invalid-empty"]){
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
  await page.goto("/analytics?tab=paper");
  await expect(page.getByRole("heading",{name:"Reporting belum dapat dibaca"})).toBeVisible();
  await expect(page.locator(".analytics-stat-card")).toHaveCount(0);
 }
});
test("decimal money tokens stay on one line without overflowing journal and reporting rows",async({page,request},info)=>{
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"reporting-scanner-partial"}});
 for(const route of ["/journal?tab=paper","/analytics?tab=paper"]){
  await page.goto(route);
  const token=page.locator(".reporting-money").filter({hasText:"Rp919.725,63"});
  await expect(token).toBeVisible();
  for(const width of [1440,1280,1200,1101,1100,901,390,320]){
   await page.setViewportSize({width,height:1000});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await page.locator(".reporting-list").evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth))).toBe(true);
   const layout=await token.evaluate(node=>{
    const range=document.createRange();range.selectNodeContents(node);
    const cell=node.closest("td")!,bounds=node.getBoundingClientRect(),cellBounds=cell.getBoundingClientRect();
    return {lines:range.getClientRects().length,nowrap:getComputedStyle(node).whiteSpace,fits:bounds.left>=cellBounds.left-1&&bounds.right<=cellBounds.right+1};
   });
   expect(layout).toEqual({lines:1,nowrap:"nowrap",fits:true});
   const money=await page.locator(".reporting-money").evaluateAll(nodes=>nodes.map(node=>{
    const range=document.createRange();range.selectNodeContents(node);
    const bounds=node.getBoundingClientRect(),cell=node.closest("td")!.getBoundingClientRect();
    return {value:node.textContent,lines:range.getClientRects().length,fits:bounds.left>=cell.left-1&&bounds.right<=cell.right+1};
   }));
   expect(money.filter(value=>value.lines!==1||!value.fits),"Every monetary token fits its cell at width "+width).toEqual([]);
   if(width===1440) await page.screenshot({caret:"initial",path:"test-results/reporting-decimal-wide-"+info.project.name+".png",fullPage:true});
  }
 }
 await page.screenshot({caret:"initial",path:"test-results/reporting-decimal-"+info.project.name+".png",fullPage:true});
});

test("SQL-generated synthetic oracle renders assessed and excluded results with unfinished counterpart",async({page,request})=>{
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"reporting-oracle"}});
 await page.goto("/analytics?tab=paper");
 await expect(page.getByText("FIXTURE DEV",{exact:true})).toBeVisible();
 await expect(page.locator(".analytics-stat-card").first()).toContainText("Rp841.837,5");
 await expect(page.getByRole("heading",{name:"Perbandingan sampel eksperimen"})).toBeVisible();
 await expect(page.locator('[data-processing-health="data_hold"]')).toContainText("2026-10-09");
 const ambiguous=page.locator(".reporting-trades tr").filter({hasText:"Ambigu"});
 await expect(ambiguous).toContainText("Di luar statistik utama");
 await page.getByText("Entry bersama dan hasil masing-masing",{exact:true}).click();
 await expect(page.getByRole("link",{name:"Open",exact:true})).toBeVisible();
 await page.goto("/journal/paper/a-fixed_rr");
 await expect(page.locator(".reporting-events strong")).toHaveText(["entry","exit"]);
 await expect(page.locator(".journal-facts")).toContainText("Rp1.834.875");
 await page.goto("/journal/paper/d-ma_close");
 await expect(page.getByRole("heading",{name:"TESTD · SMA10"})).toBeVisible();
 await expect(page.locator(".reporting-events strong")).toHaveText(["entry","pending_exit","exit"]);
 await expect(page.locator(".journal-facts")).toContainText("late_model_only");
 await expect(page.locator(".journal-facts")).toContainText("Rp1.834.875");
 await page.reload();
 await expect(page.locator(".reporting-events strong")).toHaveText(["entry","pending_exit","exit"]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("processing health distinguishes overdue, failure, held data and old backend readiness",async({page,request})=>{
 for(const [scenario,status,heading] of [["health-overdue","overdue","Pemrosesan terlambat"],["health-failed","failed","Pemrosesan gagal"],["health-data-hold","data_hold","Pemrosesan tertahan oleh data"]]){
  await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario}});
  await page.goto("/analytics?tab=paper");
  await expect(page.getByRole("heading",{name:heading,exact:true})).toBeVisible();
  await expect(page.locator('[data-processing-health="'+status+'"]').getByRole("definition").filter({hasText:"4"})).toHaveCount(1);
  await expect(page.getByText("Data jurnal lengkap",{exact:true})).toBeVisible();
 }
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"health-unavailable"}});
 await page.goto("/operations");
 await expect(page.getByRole("heading",{name:"Status pemrosesan belum dapat dibaca"})).toBeVisible();
 const {calls}=await(await request.get("http://127.0.0.1:3053/__calls")).json();
 expect(calls.filter((c:{path:string})=>c.path.endsWith("read_paper_processing_health_v1"))).toHaveLength(1);
});

test("operations read failure is distinct from empty run history",async({page,request})=>{
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"operations-read-error"}});
 await page.goto("/operations");
 await expect(page.locator(".journal-panel [role=alert]")).toContainText("belum dapat dibaca");
 await expect(page.getByText("Belum ada snapshot run forward",{exact:false})).toHaveCount(0);
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"operations-empty"}});
 await page.goto("/operations");
 await expect(page.getByText("Belum ada snapshot run forward",{exact:false})).toBeVisible();
 await expect(page.locator(".journal-panel [role=alert]")).toHaveCount(0);
});
