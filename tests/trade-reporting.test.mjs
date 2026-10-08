import assert from "node:assert/strict";
import {test} from "node:test";
import {parseTradeReporting,parseSignalEvaluation,parsePaperTradeDetail} from "../src/lib/trade-reporting.ts";
import {reportingFixture,evaluationFixture,detailFixture,paperId} from "./support/reporting-fixtures.mjs";
const f={from:null,to:null,strategy:null,exitVersion:null,exitSnapshot:null,exitKey:"fixed2r",page:1};
test("versioned paper preserves money and fee-inclusive sizing values from SQL",()=>{
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
test("actual exact snapshot must match and actual route keeps actual trade identity",()=>{
 const snapshot={version:"actual-fixed2r-v1",mode:"fixed_rr",target_r:2};
 const filters={...f,exitSnapshot:snapshot};
 const data=reportingFixture({p_mode:"actual",p_exit_snapshot:snapshot});
 assert.equal(parseTradeReporting(data,"fixture","actual",filters),data);
 assert.equal(parseTradeReporting({...data,exit_snapshot:{...snapshot,target_r:1.5}},"fixture","actual",filters),null);
});
test("real engine ambiguous_review and resolved won/lost observations parse",()=>{
 const data=reportingFixture({},"reporting-ambiguous");
 assert.equal(parseTradeReporting(data,"fixture","paper",f),data);
 const evals=evaluationFixture();
 assert.equal(parseSignalEvaluation(evals,"fixture",f),evals);
 assert.equal(evals.evaluations[0].results.net_10,"pending");
 assert.equal(parseSignalEvaluation({...evals,evaluations:[{...evals.evaluations[0],results:{...evals.evaluations[0].results,target_1r:"win"}}]},"fixture",f),null);
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
