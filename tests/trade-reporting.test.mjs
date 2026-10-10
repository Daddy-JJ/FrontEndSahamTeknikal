import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {parseTradeReporting,parseSignalEvaluation,parsePaperTradeDetail,parseProcessingHealth} from "../src/lib/trade-reporting.ts";
import {reportingFixture,evaluationFixture,detailFixture,paperId,healthFixture} from "./support/reporting-fixtures.mjs";
const f={from:null,to:null,strategy:null,exitVersion:null,exitSnapshot:null,exitKey:"fixed2r",page:1};
const oracle=JSON.parse(readFileSync(new URL("./fixtures/paper-reporting-v1.json",import.meta.url)));
test("canonical PGlite SQL oracle validates reporting, health, detail and observation contracts",()=>{
 assert.equal(oracle.provenance.fixture,true);assert.equal(oracle.provenance.not_live_market_evidence,true);
 assert.equal(oracle.provenance.source,"PGlite synthetic ledger with applied canonical SQL");
 for(const [key,mode,exitKey] of [["reporting_fixed2r","paper","fixed2r"],["reporting_ma10","paper","ma10"],["actual_reporting","actual","fixed2r"]]) {
  const value=oracle[key];assert.equal(parseTradeReporting(value,value.data_mode,mode,{...f,exitKey}),value,key);
 }
 assert.equal(parseSignalEvaluation(oracle.evaluation,oracle.evaluation.data_mode,f),oracle.evaluation);
 assert.equal(parseProcessingHealth(oracle.health,oracle.health.data_mode),oracle.health);
 for(const key of ["detail_fixed2r","detail_ma10"]){const d=oracle[key];assert.equal(parsePaperTradeDetail(d,d.data_mode,d.trade.id),d);}
});
test("SQL oracle excludes ambiguity, preserves paired unfinished exits and canonical IDR ratios",()=>{
 const report=oracle.reporting_fixed2r;
 assert.equal(report.summary.closed,2);assert.equal(report.summary.wins,1);assert.equal(report.summary.losses,1);
 assert.equal(Number(report.summary.net_pnl_idr),841837.5);
 const ambiguous=report.trades.find(t=>t.ambiguous);
 assert.equal(ambiguous.metric_eligible,false);assert.equal(report.curve.some(c=>c.trade_id===ambiguous.id),false);
 assert.notEqual(report.sensitivities.sl_first.net_pnl_idr,report.sensitivities.tp_first.net_pnl_idr);
 assert.equal(report.summary.profit_factor_state,"finite");assert.equal(report.summary.payoff_ratio_state,"finite");
 assert.ok(report.experiment_comparison.paired.some(p=>p.fixed2r.state==="closed"&&p.ma10.state==="open"));
 for(const detail of [oracle.detail_fixed2r,oracle.detail_ma10]){
  assert.ok(detail.events.some(e=>e.event_type==="entry"));
  if(detail.trade.state==="closed")assert.ok(detail.events.some(e=>e.event_type==="exit"));
  else assert.equal(detail.events.some(e=>e.event_type==="exit"),false);
 }
 assert.equal(oracle.health.status,"data_hold");assert.equal(oracle.health.overdue,true);
 assert.ok(oracle.health.processed_session>=oracle.health.expected_session);
 assert.ok(oracle.health.held_since_session<=oracle.health.expected_session);
 const invalid=structuredClone(report);invalid.experiment_comparison.common_entry_signal_ids.push(invalid.experiment_comparison.common_entry_signal_ids[0]);
 assert.equal(parseTradeReporting(invalid,invalid.data_mode,"paper",f),null);
});
test("synthetic display fixture preserves money and fee-inclusive sizing fields",()=>{
 const data=reportingFixture();
 assert.equal(parseTradeReporting(data,"fixture","paper",f),data);
 assert.equal(data.trades[0].lots,126);
 assert.equal(data.trades[0].planned_loss_idr,"993037.50");
 assert.equal(data.trades[0].initial_price_risk_idr,"945000");
});
test("reporting rejects mode/model/cohort/experiment/basis/pagination drift",()=>{
 const data=reportingFixture();
 for(const change of [{updated_at:"not-a-time"},{updated_at:"2026-02-30T12:00:00Z"},{updated_at:"2026-10-08T12:00:00"},{data_mode:"live"},{model_version:"legacy"},{mode:"actual"},{basis:"R"},{cohort_date:"signal_session"},{exit_key:"ma10"},{from:"2026-01-01"},{primary_strategy:"RS_BREAKOUT_V1"},{paging:{page:2,page_size:25,has_more:false}}]) assert.equal(parseTradeReporting({...data,...change},"fixture","paper",f),null);
});
test("null samples stay null and malformed numbers never become zero",()=>{
 const data=reportingFixture({},"empty");
 assert.equal(parseTradeReporting(data,"fixture","paper",f),data);
 for(const change of [{win_rate:0},{net_pnl_idr:"NaN"},{expectancy_idr:0},{closed:-1},{max_drawdown_idr:-1}]) assert.equal(parseTradeReporting({...data,summary:{...data.summary,...change}},"fixture","paper",f),null);
 assert.equal(parseTradeReporting({...data,trades:[{...reportingFixture().trades[0],planned_loss_idr:"1,000"}]},"fixture","paper",f),null);
});
test("actual synthetic lifecycle separates an empty draft from a buy-filled provisional entry",()=>{
 const draft=reportingFixture({p_mode:"actual"},"actual-draft-empty");
 const provisional=reportingFixture({p_mode:"actual"},"draft");
 for(const value of [draft,provisional]) assert.equal(parseTradeReporting(value,"fixture","actual",f),value);
 assert.equal(draft.trades[0].state,"draft");
 assert.equal(draft.trades[0].open_quantity,0);
 assert.equal(draft.trades[0].fee_total_idr,"0");
 assert.equal(draft.trades[0].entry_session,null);
 assert.equal(provisional.trades[0].state,"open");
 assert.equal(provisional.trades[0].open_quantity,200);
 assert.equal(provisional.trades[0].initial_price_risk_idr,null);
 assert.equal(provisional.summary.closed,0);
});

test("actual exact snapshot must match and actual route keeps actual trade identity",()=>{
 const snapshot={version:"actual-fixed2r-v1",mode:"fixed_rr",target_r:2};
 const filters={...f,exitSnapshot:snapshot};
 const data=reportingFixture({p_mode:"actual",p_exit_snapshot:snapshot});
 assert.equal(parseTradeReporting(data,"fixture","actual",filters),data);
 assert.notEqual(parseTradeReporting({...data,scanner_coverage:null},"fixture","actual",filters),null);
 assert.equal(parseTradeReporting({...data,scanner_coverage:{status:"complete",session_date:"2026-09-30",coverage_valid:100,coverage_total:100}},"fixture","actual",filters),null);
 assert.equal(parseTradeReporting({...data,exit_snapshot:{...snapshot,target_r:1.5}},"fixture","actual",filters),null);
});
test("ambiguous_review and resolved won/lost observation contracts parse",()=>{
 const data=reportingFixture({},"reporting-ambiguous");
 assert.equal(parseTradeReporting(data,"fixture","paper",f),data);
 const evals=evaluationFixture();
 assert.equal(parseSignalEvaluation(evals,"fixture",f),evals);
 assert.equal(evals.evaluations[0].results.net_10,"pending");
 assert.equal(parseSignalEvaluation({...evals,evaluations:[{...evals.evaluations[0],results:{...evals.evaluations[0].results,target_1r:"win"}}]},"fixture",f),null);
});

test("redundant denominator, cell total and exclusion fields reject contradictory reporting",()=>{
 const data=reportingFixture();
 assert.equal(parseTradeReporting({...data,summary:{...data.summary,win_rate:0.123}},"fixture","paper",f),null);
 assert.equal(parseTradeReporting({...data,curve:[]},"fixture","paper",f),null);
 assert.equal(parseTradeReporting({...data,summary:{...data.summary,profit_factor_state:"finite",profit_factor_idr:"99"}},"fixture","paper",f),null);
 const ambiguous=reportingFixture({},"reporting-ambiguous");
 assert.equal(ambiguous.summary.closed,0);assert.equal(ambiguous.curve.length,0);
 assert.equal(ambiguous.trades[0].metric_eligible,false);
 assert.equal(ambiguous.sensitivities.sl_first.losses,1);assert.equal(ambiguous.sensitivities.tp_first.wins,1);
 assert.notEqual(ambiguous.sensitivities.sl_first.net_pnl_idr,ambiguous.sensitivities.tp_first.net_pnl_idr);
 assert.equal(parseTradeReporting({...ambiguous,curve:data.curve,summary:data.summary,strategies:data.strategies},"fixture","paper",f),null);
 const evals=evaluationFixture();
 for(const change of [{assessed:1000},{win_rate:.9},{excluded_reasons:{}},{pending:4}]) {
  const mutated=structuredClone(evals);Object.assign(mutated.strategies[0].cells.net_5,change);
  assert.equal(parseSignalEvaluation(mutated,"fixture",f),null);
 }
});

test("exit-family, actual row capability and metric eligibility are strict",()=>{
 const data=reportingFixture({p_exit_key:"ma10"});
 assert.equal(parseTradeReporting(data,"fixture","paper",{...f,exitKey:"ma10"}),data);
 assert.equal(parseTradeReporting({...data,trades:[{...data.trades[0],target_price:"1150"}]},"fixture","paper",{...f,exitKey:"ma10"}),null);
 const actual=reportingFixture({p_mode:"actual"});
 assert.equal(parseTradeReporting(actual,"fixture","actual",f),actual);
 for(const field of ["open_quantity","current_stop","revision"]) {
  const old=structuredClone(actual);delete old.trades[0][field];
  assert.equal(parseTradeReporting(old,"fixture","actual",f),null);
 }
 const wrong=structuredClone(data);wrong.trades[0].state="open";
 assert.equal(parseTradeReporting(wrong,"fixture","paper",{...f,exitKey:"ma10"}),null);
});

test("processing-health readiness cannot claim an overdue or unknown calendar checkpoint is ready",()=>{
 const health=healthFixture();assert.equal(parseProcessingHealth(health,"fixture"),health);
 assert.equal(parseProcessingHealth(health,"live"),null);
 assert.equal(parseProcessingHealth({...health,processed_session:"2026-09-29"},"fixture"),null);
 assert.equal(parseProcessingHealth({...health,overdue:true},"fixture"),null);
 assert.equal(parseProcessingHealth({...health,expected_session:null},"fixture"),null);
 assert.equal(parseProcessingHealth({...health,latest_job_status:"success"},"fixture"),null);
 assert.equal(parseProcessingHealth({...health,latest_job_phase:"unknown"},"fixture"),null);
 assert.equal(parseProcessingHealth({...health,next_eligible_processing_at:"not-a-timestamp"},"fixture"),null);
 const overdue=healthFixture("health-overdue");assert.equal(parseProcessingHealth(overdue,"fixture"),overdue);
});
test("evaluation keeps denominator and unavailable counts separate",()=>{
 const data=evaluationFixture();
 assert.equal(data.strategies[0].cells.net_5.assessed,2);
 assert.equal(data.strategies[0].cells.net_5.data_hold,1);
 assert.equal(parseSignalEvaluation({...data,strategies:[{...data.strategies[0],cells:{...data.strategies[0].cells,net_5:{...data.strategies[0].cells.net_5,win_rate:2}}}]},"fixture",f),null);
 assert.equal(parseSignalEvaluation({...data,cohort_date:"exit_session_Asia_Jakarta"},"fixture",f),null);
});
test("paper detail is owner mode and model bound including audit event payload",()=>{
 const detail=detailFixture();
 assert.equal(parsePaperTradeDetail(detail,"fixture",paperId),detail);
 assert.equal(parsePaperTradeDetail(detail,"live",paperId),null);
 assert.equal(parsePaperTradeDetail(detail,"fixture","other-id"),null);
 assert.equal(parsePaperTradeDetail({...detail,events:[{...detail.events[0],session_date:"2026-02-30"}]},"fixture",paperId),null);
});

test("optional scanner coverage is distinct from journal completeness and remains backwards compatible",()=>{
 const data=reportingFixture();
 for(const scanner_coverage of [undefined,null,
  {status:"complete",session_date:"2026-09-30",coverage_valid:100,coverage_total:100},
  {status:"partial",session_date:"2026-09-30",coverage_valid:95,coverage_total:100},
  {status:"failed",session_date:"2026-09-30",coverage_valid:0,coverage_total:100},
  {status:"failed",session_date:"2026-09-30",coverage_valid:null,coverage_total:null},
  {status:"missing",session_date:null,coverage_valid:null,coverage_total:null},
 ]){
  const value={...data,coverage_status:"complete",scanner_coverage};
  assert.equal(parseTradeReporting(value,"fixture","paper",f),value);
  const evals={...evaluationFixture(),scanner_coverage};
  assert.equal(parseSignalEvaluation(evals,"fixture",f),evals);
 }
 const partial=reportingFixture({},"reporting-scanner-partial");
 assert.equal(partial.coverage_status,"complete");
 assert.equal(partial.scanner_coverage.coverage_valid,95);
 assert.equal(parseTradeReporting(partial,"fixture","paper",f),partial);
});
test("scanner metadata rejects malformed, empty and contradictory counts instead of assuming full coverage",()=>{
 const base={status:"partial",session_date:"2026-09-30",coverage_valid:95,coverage_total:100};
 const bad=[[],{},false,{...base,status:"stale"},{...base,session_date:"2026-02-30"},
  {...base,coverage_valid:"95"},{...base,coverage_valid:95.5},{...base,coverage_valid:-1},
  {...base,coverage_valid:101},{...base,coverage_total:0},{...base,coverage_valid:0,coverage_total:0},
  {...base,coverage_valid:null},{...base,coverage_total:null},
  {...base,coverage_valid:null,coverage_total:null},{...base,status:"complete"},
  {...base,coverage_valid:100},{...base,coverage_valid:0},{...base,status:"failed"},{...base,status:"missing"},
  {...base,status:"missing",session_date:null,coverage_valid:0,coverage_total:0},
  {...base,status:"failed",session_date:null},
 ];
 for(const scanner_coverage of bad){
  assert.equal(parseTradeReporting({...reportingFixture(),scanner_coverage},"fixture","paper",f),null,JSON.stringify(scanner_coverage));
  assert.equal(parseSignalEvaluation({...evaluationFixture(),scanner_coverage},"fixture",f),null,JSON.stringify(scanner_coverage));
 }
});
