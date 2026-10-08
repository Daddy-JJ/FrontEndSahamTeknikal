import {expect,test} from "@playwright/test";
const uid="22222222-2222-4222-8222-222222222222";
test.beforeEach(async({context,request})=>{
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"reporting-ready"}});
 const token=[{alg:"HS256",typ:"JWT"},{sub:uid,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600}].map(v=>Buffer.from(JSON.stringify(v)).toString("base64url")).join(".")+".dGVzdA";
 const session={access_token:token,refresh_token:"local-test-refresh",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:uid}};
 await context.addCookies([{name:"sb-127-auth-token",value:"base64-"+Buffer.from(JSON.stringify(session)).toString("base64url"),domain:"127.0.0.1",path:"/"}]);
});
test("paper dashboard canonical money, experiment filtering and responsive matrix",async({page,request},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/analytics?tab=paper");
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
 await page.screenshot({path:"test-results/reporting-paper-"+info.project.name+".png",fullPage:true});
 expect(errors).toEqual([]);
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
 await page.locator("#signal-observations summary").click();
 await expect(page.getByText("a".repeat(64),{exact:true})).toBeVisible();
 await expect(page.locator("#signal-observations details")).toContainText("Rp1.075");
 await expect(page.locator("#signal-observations details")).toContainText("Rp1.150");
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
test("paper detail audit and SMA10 confirmed close semantics",async({page,request})=>{
 await request.post("http://127.0.0.1:3053/__scenario",{data:{scenario:"reporting-ambiguous"}});
 await page.goto("/journal/paper/paper-test-v1");
 await expect(page.getByRole("heading",{name:"TEST · SMA10"})).toBeVisible();
 await expect(page.getByText("Ambigu · terpisah dari statistik utama",{exact:false})).toBeVisible();
 await expect(page.getByText("SMA10 dipicu hanya oleh close terkonfirmasi di bawah SMA10",{exact:false})).toBeVisible();
 await expect(page.locator(".journal-facts")).toContainText("Rp945.000");
 await expect(page.locator(".journal-facts")).toContainText("Rp993.037,5");
 await expect(page.getByText("plan_created",{exact:true})).toBeVisible();
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
 for(const [scenario,label] of [["reporting-stale","Data stale"],["reporting-partial","Coverage parsial"]]){
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
