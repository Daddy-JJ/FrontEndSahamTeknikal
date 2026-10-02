// Test-only HTTP double. No production imports, remote calls, database, or financial engine.
import { createServer } from "node:http";

const tradeId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const user = { id: userId, aud: "authenticated", role: "authenticated", email: "owner@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const trade = {
  id: tradeId, ticker: "TEST", data_mode: "fixture", primary_strategy: "MACD_EMA200_V1",
  status: "closed", entry_finalized_at: "2026-09-22T03:00:00Z", revision: 7, initial_stop: "95", current_stop: "99", initial_risk_idr: "1200",
  provisional_risk_idr: "1200", open_quantity: 0, remaining_cost_idr: "0", realized_pnl_idr: "1000",
  realized_r: "0.833333333333", fee_total_idr: "100",
  exit_policy_snapshot: { version: "actual-fixed2r-v1", mode: "fixed_rr", target_r: 2 },
  closed_at: "2026-09-28T17:00:00Z", created_at: "2026-09-21T03:00:00Z",
};
const fills = [["buy",100,100],["buy",100,102],["sell",100,105],["sell",100,108]].map(([side,quantity,price],i)=>({
  id: `${i+3}3333333-3333-4333-8333-333333333333`, side, quantity, sequence:i+1, price_idr: String(price),
  fee_idr: "25", fee_status: "actual", filled_at: i===3?trade.closed_at:`2026-09-${21+i}T03:00:00Z`,
}));
const manyId = n => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const manyRows = Array.from({length:205},(_,i)=>({
  ...trade,id:manyId(i+1),ticker:`T${String(i+1).padStart(3,"0")}`,
  created_at:new Date(Date.parse(trade.created_at)-i*1000).toISOString(),
}));
const manyFills = Array.from({length:205},(_,i)=>({
  ...fills[i%4],id:manyId(i+1),sequence:i+1,
}));
const corrected = {...fills[0],fill_id:fills[0].id,sequence:2,
  filled_at:"2026-09-22T04:00:00Z",reason:"Synthetic timestamp correction"};
const manyCorrections = manyFills.map((f,i)=>({...f,fill_id:f.id,sequence:i+1,reason:`Synthetic correction ${i+1}`}));
function pageOf(url,rows) {
  const offset=Number(url.searchParams.get("offset")??0);
  const limit=Number(url.searchParams.get("limit")??rows.length);
  return rows.slice(offset,offset+limit);
}
let scenario = "empty", calls = [], mutations = [];
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,"http://127.0.0.1:3053");
  let raw=""; for await(const chunk of req) raw+=chunk;
  const body=raw ? JSON.parse(raw) : null;
  const send=(data,status=200)=>{res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data));};
  if(url.pathname==="/__health") return send({test_only:true});
  if(url.pathname==="/__scenario") {scenario=body.scenario;calls=[];mutations=[];return send({ok:true});}
  if(url.pathname==="/__calls") return send({calls,mutations});
  calls.push({path:url.pathname,query:Object.fromEntries(url.searchParams),body});
  if(url.pathname==="/auth/v1/user") return send(user);
  if(url.pathname==="/auth/v1/token") return send({access_token: token(),refresh_token:"local-test-refresh",expires_in:3600,token_type:"bearer",user});
  if(url.pathname==="/auth/v1/logout") return scenario==="logout-error"
    ? send({code:"SYNTHETIC_LOGOUT_FAILURE",message:"Synthetic logout failure"},503)
    : send({});
  if(url.pathname==="/rest/v1/app_members") {
    if(scenario==="member-error") return send({code:"08006",message:"synthetic failure"},503);
    return send(scenario==="outsider" ? null : {role:"owner",enabled:true});
  }
  if(url.pathname==="/rest/v1/deployment_settings") return send({data_mode:scenario.startsWith("scanner-") || scenario==="settings-live"?"live":"fixture"});
  if(url.pathname==="/rest/v1/scan_runs") {
    if(scenario==="scanner-read-error") return send({code:"08006"},503);
    if(scenario==="scanner-empty") return send(null);
    const partial=scenario==="scanner-partial";
    const run={id:tradeId,namespace:"forward",data_mode:scenario==="scanner-mode-mismatch"?"fixture":"live",
      session_date:"2026-09-28",status:partial?"partial":"complete",coverage_valid:partial?99:100,
      coverage_total:100,stored_at:"2026-09-28T14:00:00Z",run_digest:"a".repeat(64),
      ranking_status:partial?"cross_section_incomplete":"complete",publication_deadline:"2026-09-29T02:00:00Z"};
    return send(run);
  }
  if(url.pathname==="/rest/v1/scan_run_items") {
    const rows=Array.from({length:100},(_,i)=>{
      const ticker=`TEST${String(i+1).padStart(3,"0")}`;
      const status=scenario==="scanner-partial" && i===0?"corporate_action_hold":"evaluated";
      return {ticker,status,snapshot:{ticker,status,candidates:status==="evaluated"?[
        {strategy:"MACD_EMA200_V1",triggered:false,reason:"insufficient_history",reference_close:100,stop:null},
        {strategy:"RS_BREAKOUT_V1",triggered:false,reason:"cross_section_incomplete",reference_close:100,stop:null},
      ]:[]}};
    });
    return send(pageOf(url,rows));
  }
  if(url.pathname==="/rest/v1/scan_run_signals") {
    const rows=Array.from({length:26},(_,i)=>({signals:{id:(i+1).toString(16).padStart(64,"0"),
      namespace:"forward",data_mode:"live",ticker:`TEST${String(i+1).padStart(3,"0")}`,
      strategy:"FRACTAL_BREAKOUT_V1",session_date:"2026-09-28",planned_entry_session:"2026-09-29",
      cohort:scenario==="scanner-late"?"late_model_only":"forward",published_at:"2026-09-28T14:00:00Z",
      provider:"yfinance",universe_version:"synthetic-test-only",calendar_version:"synthetic-test-only",
      candidate:{strategy:"FRACTAL_BREAKOUT_V1",triggered:true,reason:"eligible",reference_close:100,stop:95}}}));
    if(scenario==="scanner-invalid-signal") rows[0].signals.data_mode="fixture";
    return send(scenario==="scanner-no-signals" || scenario==="scanner-partial"?[]:pageOf(url,rows));
  }
  if(scenario==="schema-error") return send({code:"PGRST205",message:"synthetic missing migration"},404);
  if(url.pathname==="/rest/v1/rpc/export_actual_journal") {
    const row={...trade,trade_id:tradeId,mode:"actual",contract_version:"actual-journal-export-v1",
      open_quantity:"0",signal_id:null,
      exit_session:"2026-09-29",fee_quality:"actual",planned_rr:"2",tags:["synthetic"],notes:["TEST ONLY"]};
    if(scenario==="csv-formula") {row.ticker='=HYPERLINK("bad")';row.fee_quality='\t@SUM(1)';}
    const more=scenario==="large-export" && body.p_after===null;
    const exportRows=more?Array.from({length:200},(_,i)=>({...row,
      trade_id:i===199?tradeId:manyId(i+1)})):
      [{...row,trade_id:scenario==="large-export"?manyId(201):tradeId}];
    return send({contract_version:"actual-journal-export-v1",mode:"actual",data_mode:"fixture",
      rows:scenario==="empty"?[]:exportRows,has_more:more,next_after:more?tradeId:null});
  }
  if(url.pathname==="/rest/v1/rpc/apply_actual_journal") {
    mutations.push(body);
    await new Promise(resolve=>setTimeout(resolve,250));
    if(scenario==="retry" && mutations.length===1) return send({code:"08006",message:"synthetic lost reply"},503);
    if(scenario==="revision-conflict") return send({code:"PT412",message:"revision_conflict"},412);
    return send({trade_id:tradeId,revision:7,action:body.p_action});
  }
  if(url.pathname==="/rest/v1/rpc/actual_journal_analytics") {
    const empty=scenario==="empty";
    return send({mode:"actual",data_mode:scenario==="mode-mismatch"?"live":"fixture",basis:"IDR",
      closed:empty?0:1,open:empty?0:1,draft:empty?0:1,wins:empty?0:1,losses:0,breakeven:0,estimated_fee_trades:empty?0:1,
      net_pnl_idr:empty?"0":"1000",win_rate:empty?null:1,expectancy_r:empty?null:"0.833333333333",
      profit_factor:null,profit_factor_status:empty?"no_closed":"no_losses",
      payoff_ratio:null,payoff_status:empty?"no_closed":"no_losses"});
  }
  if(url.pathname==="/rest/v1/actual_trades") {
    if(scenario==="trade-error") return send({code:"08006"},503);
    const row=scenario==="partial"?{...trade,status:"open",closed_at:null,open_quantity:100,remaining_cost_idr:"10125",realized_pnl_idr:"350",realized_r:null,fee_total_idr:"75"}:
      scenario==="draft"?{...trade,status:"open",entry_finalized_at:null,closed_at:null,open_quantity:200,remaining_cost_idr:"20250",initial_risk_idr:null,realized_r:null,realized_pnl_idr:"0",fee_total_idr:"50"}:
      scenario==="ma"?{...trade,exit_policy_snapshot:{version:"actual-ma10-v1",mode:"ma_close",ma_type:"SMA",period:10}}:trade;
    if(url.searchParams.has("id")) return send(scenario==="missing"?null:row);
    if(scenario==="empty") return send([]);
    if(scenario==="long-history") return send(pageOf(url,manyRows));
    if(scenario==="large-export") return send(pageOf(url,Array.from({length:201},()=>row)));
    return send(pageOf(url,[scenario==="csv-formula"?{...row,ticker:'=HYPERLINK("bad")',exit_policy_snapshot:{version:'\t@SUM(1)'}}:row]));
  }
  if(url.pathname==="/rest/v1/actual_fills") {
    if(scenario==="history-error") return send({code:"08006"},503);
    const source=scenario==="long-history"?manyFills:scenario==="partial"?fills.slice(0,3):scenario==="draft"?fills.slice(0,2):fills;
    const withCorrection=[...source].reverse().map(f=>({...f,latest_correction:
      scenario==="long-history"?[manyCorrections[f.sequence-1]]:scenario==="corrected-time" && f.id===fills[0].id?[corrected]:[]}));
    return send(pageOf(url,withCorrection));
  }
  if(url.pathname==="/rest/v1/actual_fill_corrections" && scenario==="history-error") return send({code:"08006"},503);
  if(url.pathname==="/rest/v1/actual_fill_corrections" && scenario==="corrected-time") return send(pageOf(url,[corrected]));
  if(url.pathname==="/rest/v1/actual_fill_corrections" && scenario==="long-history") return send(pageOf(url,[...manyCorrections].reverse()));
  if(url.pathname==="/rest/v1/actual_stop_events" && scenario==="long-history") return send(pageOf(url,manyRows.map((r,i)=>({id:r.id,old_stop:"95",new_stop:"96",reason:`Stop ${i+1}`,occurred_at:r.created_at}))));
  if(url.pathname==="/rest/v1/actual_notes" && scenario==="long-history") return send(pageOf(url,manyRows.map((r,i)=>({id:r.id,body:`Note ${i+1}`,created_at:r.created_at}))));
  if(url.pathname==="/rest/v1/actual_trade_tags" && scenario==="long-history") return send(pageOf(url,manyRows.map((_,i)=>({tag:`tag_${String(i+1).padStart(4,"0")}`}))));
  if(["actual_fill_corrections","actual_stop_events","actual_notes","actual_trade_tags"].some(t=>url.pathname===`/rest/v1/${t}`)) return send([]);
  return send({code:"TEST_UNEXPECTED_REQUEST",message:url.pathname},500);
});
function token() {
  return [ {alg:"HS256",typ:"JWT"}, {sub:userId,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600} ]
    .map(v=>Buffer.from(JSON.stringify(v)).toString("base64url")).join(".")+".dGVzdA";
}
server.listen(3053,"127.0.0.1", () => process.send?.({ready:true}));
function stop() {
  server.closeAllConnections();
  server.close(() => process.exit(0));
}
process.on("message", message => { if (message?.stop === true) stop(); });
process.on("disconnect", stop);
