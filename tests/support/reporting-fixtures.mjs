// Synthetic RPC data for local boundary/browser tests only. Never imported by src/.
export const modelVersion = "close-signal-risk-v1";
export const paperId = "paper-test-v1";
export const strategy = "MACD_EMA200_V1";
export const summary = {closed:1,wins:1,losses:0,breakeven:0,net_pnl_idr:"1834875.00",win_rate:1,expectancy_idr:"1834875.00",expectancy_r:"1.941666666667",max_drawdown_idr:"0",profit_factor_idr:null,payoff_ratio_idr:null,profit_factor_state:"no_losses",payoff_ratio_state:"no_losses"};
export const emptySummary = {closed:0,wins:0,losses:0,breakeven:0,net_pnl_idr:"0",win_rate:null,expectancy_idr:null,expectancy_r:null,max_drawdown_idr:"0",profit_factor_idr:null,payoff_ratio_idr:null,profit_factor_state:"no_closed",payoff_ratio_state:"no_closed"};
export function healthFixture(scenario="ready") {
 const overdue=["health-overdue","health-failed","health-data-hold"].includes(scenario);
 return {contract_version:1,data_mode:"fixture",model_version:modelVersion,expected_session:"2026-09-30",processed_session:scenario==="health-data-hold"?"2026-09-30":overdue?"2026-09-29":"2026-09-30",status:scenario==="health-data-hold"?"data_hold":scenario==="health-failed"?"failed":overdue?"overdue":"ready",overdue,pending_entry_due:overdue?4:0,data_hold_count:scenario==="health-data-hold"?1:0,held_since_session:scenario==="health-data-hold"?"2026-09-29":null,calendar_version:"SYNTHETIC-TEST-CALENDAR",checked_at:"2026-09-30T14:00:00Z",latest_job_status:scenario==="health-failed"?"failed":"succeeded",latest_job_phase:"paper",failure_code:scenario==="health-failed"?"provider_missing_bar":null,last_attempt_at:"2026-09-30T13:00:00Z"};
}
export function tradeFixture(mode="paper") {
  return {id:mode==="paper"?paperId:"11111111-1111-4111-8111-111111111111",ticker:"TEST",strategy,state:"closed",
    signal_id:"a".repeat(64),signal_session:"2026-09-28",entry_session:"2026-09-29",entry_price:"1000",
    initial_stop:"925",target_price:"1150",lots:126,initial_price_risk_idr:"945000",planned_loss_idr:"993037.50",
    exit_session:"2026-09-30",exit_price:"1150",fee_total_idr:"55125",realized_pnl_idr:"1834875",
    realized_r:"1.941666666667",reason:"target",ambiguous:false,model_version:mode==="paper"?modelVersion:null,
    metric_eligible:true,exclusion_reason:null,cohort:mode==="paper"?"forward":null,holding_sessions:2,holding_calendar_days:1,
    ...(mode==="actual"?{entry_price:null,initial_stop:"95",target_price:null,lots:null,initial_price_risk_idr:"1200",planned_loss_idr:null,current_stop:"99",revision:7,open_quantity:0,fee_total_idr:"100",realized_pnl_idr:"1000",realized_r:"0.833333333333",signal_id:null,signal_session:null,exit_session:"2026-09-29",reason:null}:{}),
   };
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
  if(body.p_strategy)t.strategy=body.p_strategy;
  if(mode==="actual"&&!empty)s={...summary,net_pnl_idr:"1000",expectancy_idr:"1000",expectancy_r:"0.833333333333"};
  if(scenario==="reporting-ambiguous") {Object.assign(t,{state:"ambiguous_review",ambiguous:true,reason:"dual_hit",metric_eligible:false,exclusion_reason:"ambiguous",exit_price:null,realized_pnl_idr:null,realized_r:null});s=emptySummary;}
  const actualDraft=mode==="actual"&&scenario==="actual-draft-empty";
  if(mode==="actual"&&["partial","draft","actual-draft-empty"].includes(scenario)){
    // A buy-filled provisional entry is open; an empty draft has no position or fee.
    Object.assign(t,{state:actualDraft?"draft":"open",open_quantity:actualDraft?0:scenario==="draft"?200:100,
      entry_session:actualDraft?null:"2026-09-21",exit_session:null,exit_price:null,
      initial_price_risk_idr:scenario==="partial"?"1200":null,
      fee_total_idr:actualDraft?"0":scenario==="draft"?"50":"75",
      realized_pnl_idr:scenario==="partial"?"350":"0",realized_r:null,
      metric_eligible:false,exclusion_reason:"not_closed",holding_sessions:null,holding_calendar_days:null});s=emptySummary;
  }
  if(scenario==="reporting-scanner-partial") {
    // Synthetic four-decimal prices exercise money wrapping while retaining 15/25bps fees and floor lots.
    Object.assign(t,{entry_price:"10000.0569",initial_stop:"9201.9440",target_price:"11596.2827",lots:11,
      initial_price_risk_idr:"877924.19",planned_loss_idr:"919725.63",exit_price:"11596.2827",
      fee_total_idr:"48389.87",realized_pnl_idr:"1707458.51",realized_r:"1.9448814936970813"});
    s={...summary,net_pnl_idr:t.realized_pnl_idr,expectancy_idr:t.realized_pnl_idr,expectancy_r:t.realized_r};
  }
  if(body.p_exit_key==="ma10"){t.target_price=null;t.reason="ma_close";}
  const closed=s.closed, ambiguous=scenario==="reporting-ambiguous";
  return {...(mode==="paper"?scannerMetadata(scenario):{scanner_coverage:null}),contract_version:1,mode,data_mode:scenario==="reporting-mode-mismatch"||scenario==="mode-mismatch"?"live":"fixture",basis:"IDR",
    cohort_date:"exit_session_Asia_Jakarta",model_version:mode==="paper"?modelVersion:null,
    from:body.p_from??null,to:body.p_to??null,primary_strategy:body.p_strategy??null,
    exit_key:mode==="paper"?(body.p_exit_key??"fixed2r"):null,exit_version:body.p_exit_version??null,exit_snapshot:body.p_exit_snapshot??null,
    as_of_session:"2026-09-30",updated_at:"2026-09-30T14:00:00Z",coverage_status:scenario==="reporting-partial"?"partial":scenario==="reporting-stale"?"stale":"complete",
    summary:s,statuses:{pending_entry:0,draft:actualDraft?1:0,open:empty||actualDraft?0:1,closed,skipped:0,expired:0,data_hold:scenario==="reporting-partial"?1:0,ambiguous:ambiguous?1:0},
    curve:closed===0?[]:[{sequence:1,trade_id:t.id,ticker:t.ticker,strategy:t.strategy,exit_session:t.exit_session,realized_pnl_idr:t.realized_pnl_idr,cumulative_pnl_idr:t.realized_pnl_idr}],
    strategies:[{strategy:body.p_strategy??strategy,...s}],trades:empty?[]:[{...t,strategy:body.p_strategy??strategy}],
    status_scope:"all_history",exclusions:{closed_excluded:ambiguous?1:0,reasons:ambiguous?{ambiguous:1}:{}},processing_health:mode==="paper"?healthFixture(scenario):null,
    paging:{page:body.p_page??1,page_size:25,has_more:scenario==="reporting-many"&&(body.p_page??1)===1},
    ...(ambiguous?{sensitivities:{sl_first:{...summary,wins:0,losses:1,net_pnl_idr:"-993037.50",win_rate:0,expectancy_idr:"-993037.50",expectancy_r:"-1.050833333333",max_drawdown_idr:"993037.50",profit_factor_idr:0,profit_factor_state:"finite",payoff_ratio_state:"no_wins"},tp_first:summary}}:{})};
}
export function evaluationFixture(body={},scenario="reporting-ready") {
  const empty=scenario==="empty";
  const cell={wins:empty?0:1,assessed:empty?0:2,pending:empty?0:3,ambiguous:empty?0:1,data_hold:empty?0:1,excluded:empty?0:1,excluded_reasons:empty?{}:{invalid_stop:1},win_rate:empty?null:0.5};
  return {...scannerMetadata(scenario),contract_version:1,mode:"signal_evaluation",basis:"IDR",exit_key:null,exit_version:null,exit_snapshot:null,data_mode:"fixture",model_version:modelVersion,cohort_date:"signal_session",
    from:body.p_from??null,to:body.p_to??null,primary_strategy:body.p_strategy??null,as_of_session:"2026-09-30",updated_at:"2026-09-30T14:00:00Z",coverage_status:"partial",
    processing_health:healthFixture(scenario),strategies:[{strategy:body.p_strategy??strategy,signals:empty?0:8,cells:{target_1r:{...cell},target_2r:{...cell},net_5:{...cell},net_10:{...cell}}}],
    evaluations:empty?[]:[{signal_id:"a".repeat(64),ticker:"TEST",strategy:body.p_strategy??strategy,signal_session:"2026-09-28",entry_session:"2026-09-29",entry_price:"1000",initial_stop:"925",target_1r:"1075",target_2r:"1150",observed_sessions:6,results:{target_1r:"won",target_2r:"pending",net_5:"won",net_10:"pending"}},
      {signal_id:"c".repeat(64),ticker:"TESTLOSS",strategy:body.p_strategy??strategy,signal_session:"2026-09-28",entry_session:"2026-09-29",entry_price:"1000",initial_stop:"925",target_1r:"1075",target_2r:"1150",observed_sessions:1,results:{target_1r:"lost",target_2r:"lost",net_5:"lost",net_10:"lost"}}],
    paging:{page:body.p_page??1,page_size:25,has_more:false}};
}
export function detailFixture(body={},scenario="reporting-ready") {
  const t=tradeFixture();
  const ambiguous=scenario==="reporting-ambiguous";
  if(ambiguous)Object.assign(t,{state:"ambiguous_review",ambiguous:true,metric_eligible:false,exclusion_reason:"ambiguous",exit_price:null,realized_pnl_idr:null,realized_r:null});
  return {contract_version:1,mode:"paper",data_mode:"fixture",model_version:modelVersion,
    trade:{...t,id:body.p_trade_id??paperId,current_stop:"925",entry_fee_idr:"18900",exit_fee_idr:ambiguous?null:"36225",exit_mode:ambiguous?"fixed_rr":"ma_close",exit_key:ambiguous?"fixed2r":"ma10",target_price:ambiguous?"1150":null,config_snapshot:{entry_fill:"signal_close",max_risk_idr:1000000,buy_fee_bps:15,sell_fee_bps:25,slippage_bps:0,exit:ambiguous?{mode:"fixed_rr",target_r:2}:{mode:"ma_close",ma_type:"SMA",period:10}},source_digest:"b".repeat(64)},
    events:[{event_id:"event-entry-v1",event_type:"entry",session_date:"2026-09-29",payload:{price:"1000"}},
      ...(!ambiguous?[{event_id:"event-ma-v1",event_type:"pending_exit",session_date:"2026-09-29",payload:{reason:"ma_breakdown",close:"1001",ma_value:"1010"}}]:[]),
      {event_id:"event-exit-v1",event_type:ambiguous?"ambiguous":"exit",session_date:"2026-09-30",payload:{reason:ambiguous?"dual_hit":"ma_close"}}]};
}
