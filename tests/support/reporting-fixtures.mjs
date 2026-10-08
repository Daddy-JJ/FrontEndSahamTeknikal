// Synthetic RPC data for local boundary/browser tests only. Never imported by src/.
export const modelVersion = "close-signal-risk-v1";
export const paperId = "paper-test-v1";
export const strategy = "MACD_EMA200_V1";
export const summary = {closed:1,wins:1,losses:0,breakeven:0,net_pnl_idr:"1834875.00",win_rate:1,expectancy_idr:"1834875.00",expectancy_r:"1.941666666667",max_drawdown_idr:"0"};
export const emptySummary = {closed:0,wins:0,losses:0,breakeven:0,net_pnl_idr:"0",win_rate:null,expectancy_idr:null,expectancy_r:null,max_drawdown_idr:"0"};
export function tradeFixture(mode="paper") {
  return {id:mode==="paper"?paperId:"11111111-1111-4111-8111-111111111111",ticker:"TEST",strategy,state:"closed",
    signal_id:"a".repeat(64),signal_session:"2026-09-28",entry_session:"2026-09-29",entry_price:"1000",
    initial_stop:"925",target_price:"1150",lots:126,initial_price_risk_idr:"945000",planned_loss_idr:"993037.50",
    exit_session:"2026-09-30",exit_price:"1150",fee_total_idr:"55125",realized_pnl_idr:"1834875",
    realized_r:"1.941666666667",reason:"target",ambiguous:false,model_version:mode==="paper"?modelVersion:null};
}
function scannerMetadata(scenario) {
  const base = {session_date:"2026-09-30",coverage_valid:95,coverage_total:100};
  if(scenario==="reporting-scanner-partial") return {scanner_coverage:{...base,status:"partial"}};
  if(scenario==="reporting-scanner-complete") return {scanner_coverage:{...base,status:"complete",coverage_valid:100}};
  if(scenario==="reporting-scanner-failed") return {scanner_coverage:{...base,status:"failed",coverage_valid:0}};
  if(scenario==="reporting-scanner-missing") return {scanner_coverage:{status:"missing",session_date:null,coverage_valid:null,coverage_total:null}};
  if(scenario==="reporting-scanner-invalid") return {scanner_coverage:{...base,status:"partial",coverage_valid:95.5}};
  if(scenario==="reporting-scanner-invalid-empty") return {scanner_coverage:{...base,status:"complete",coverage_valid:0,coverage_total:0}};
  return {};
}
export function reportingFixture(body={},scenario="reporting-ready") {
  const mode=body.p_mode??"paper",empty=scenario==="empty";
  let s=empty?emptySummary:summary;
  const t=tradeFixture(mode);
  if(scenario==="reporting-ambiguous"){t.state="ambiguous_review";t.ambiguous=true;t.reason="dual_hit";}
  if(scenario==="reporting-scanner-partial") {
    // Synthetic four-decimal prices exercise money wrapping while retaining 15/25bps fees and floor lots.
    Object.assign(t,{entry_price:"10000.0569",initial_stop:"9201.9440",target_price:"11596.2827",lots:11,
      initial_price_risk_idr:"877924.19",planned_loss_idr:"919725.63",exit_price:"11596.2827",
      fee_total_idr:"48389.87",realized_pnl_idr:"1707458.51",realized_r:"1.9448814936970813"});
    s={...summary,net_pnl_idr:t.realized_pnl_idr,expectancy_idr:t.realized_pnl_idr,expectancy_r:t.realized_r};
  }
  if(body.p_exit_key==="ma10"){t.target_price=null;t.reason="ma_close";}
  return {...(mode==="paper"?scannerMetadata(scenario):{scanner_coverage:null}),contract_version:1,mode,data_mode:scenario==="reporting-mode-mismatch"?"live":"fixture",basis:"IDR",
    cohort_date:"exit_session_Asia_Jakarta",model_version:mode==="paper"?modelVersion:null,
    from:body.p_from??null,to:body.p_to??null,primary_strategy:body.p_strategy??null,
    exit_key:mode==="paper"?(body.p_exit_key??"fixed2r"):null,exit_version:body.p_exit_version??null,exit_snapshot:body.p_exit_snapshot??null,
    as_of_session:"2026-09-30",updated_at:"2026-09-30T14:00:00Z",coverage_status:scenario==="reporting-partial"?"partial":scenario==="reporting-stale"?"stale":"complete",
    summary:s,statuses:{pending_entry:0,open:empty?0:1,closed:empty?0:1,skipped:0,expired:0,data_hold:scenario==="reporting-partial"?1:0,ambiguous:scenario==="reporting-ambiguous"?1:0},
    curve:empty?[]:[{sequence:1,trade_id:t.id,ticker:t.ticker,strategy,exit_session:t.exit_session,realized_pnl_idr:t.realized_pnl_idr,cumulative_pnl_idr:t.realized_pnl_idr}],
    strategies:[{strategy:body.p_strategy??strategy,...s}],trades:empty?[]:[{...t,strategy:body.p_strategy??strategy}],
    paging:{page:body.p_page??1,page_size:25,has_more:scenario==="reporting-many"&&(body.p_page??1)===1},
    ...(scenario==="reporting-ambiguous"?{sensitivities:{sl_first:summary,tp_first:summary}}:{})};
}
export function evaluationFixture(body={},scenario="reporting-ready") {
  const empty=scenario==="empty";
  const cell={wins:empty?0:1,assessed:empty?0:2,pending:3,ambiguous:1,data_hold:1,excluded:1,excluded_reasons:{invalid_stop:1},win_rate:empty?null:0.5};
  return {...scannerMetadata(scenario),contract_version:1,mode:"signal_evaluation",basis:"IDR",exit_key:null,exit_version:null,exit_snapshot:null,data_mode:"fixture",model_version:modelVersion,cohort_date:"signal_session",
    from:body.p_from??null,to:body.p_to??null,primary_strategy:body.p_strategy??null,as_of_session:"2026-09-30",updated_at:"2026-09-30T14:00:00Z",coverage_status:"partial",
    strategies:[{strategy:body.p_strategy??strategy,signals:8,cells:{target_1r:{...cell},target_2r:{...cell},net_5:{...cell},net_10:{...cell}}}],
    evaluations:empty?[]:[{signal_id:"a".repeat(64),ticker:"TEST",strategy,signal_session:"2026-09-28",entry_session:"2026-09-29",entry_price:"1000",initial_stop:"925",target_1r:"1075",target_2r:"1150",observed_sessions:6,results:{target_1r:"won",target_2r:"lost",net_5:"won",net_10:"pending"}}],
    paging:{page:body.p_page??1,page_size:25,has_more:false}};
}
export function detailFixture(body={},scenario="reporting-ready") {
  const t=tradeFixture();
  if(scenario==="reporting-ambiguous"){t.state="ambiguous_review";t.ambiguous=true;}
  return {contract_version:1,mode:"paper",data_mode:"fixture",model_version:modelVersion,
    trade:{...t,id:body.p_trade_id??paperId,current_stop:"925",entry_fee_idr:"18900",exit_fee_idr:"36225",exit_mode:"ma_close",exit_key:"ma10",target_price:null,config_snapshot:{entry_fill:"signal_close",max_risk_idr:1000000,buy_fee_bps:15,sell_fee_bps:25,slippage_bps:0,exit:{mode:"ma_close",ma_type:"SMA",period:10}},source_digest:"b".repeat(64)},
    events:[{event_id:"event-test-v1",event_type:"plan_created",session_date:"2026-09-28",payload:{lots:126,planned_loss_idr:"993037.50"}}]};
}
