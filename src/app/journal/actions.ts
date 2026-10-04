"use server";

import { revalidatePath } from "next/cache";
import { journalOwner } from "@/lib/journal-server";
import { journalExitSnapshots, validSessionDate } from "@/lib/journal-filters";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const decimal = /^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/;
const positive = (v: string) => decimal.test(v) && Number.isFinite(Number(v)) && Number(v) > 0 && v.split(".")[0].length <= 16;
const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

function payloadFromForm(form: FormData, action: string): Record<string, unknown> | null {
  if (action === "create") {
    const ticker=field(form,"ticker").toUpperCase();
    const primary_strategy=field(form,"primary_strategy");
    const initial_stop=field(form,"initial_stop");
    const policy=field(form,"exit_mode");
    if (!/^[A-Z0-9]{2,12}$/.test(ticker)
      || !["MACD_EMA200_V1","FRACTAL_BREAKOUT_V1","RS_BREAKOUT_V1","PULLBACK_RECLAIM_V1"].includes(primary_strategy)
      || !positive(initial_stop) || !["fixed_rr","ma_close","manual"].includes(policy)) return null;
    const exit_policy_snapshot=policy==="fixed_rr" ? journalExitSnapshots.fixed2r
      : policy==="ma_close" ? journalExitSnapshots.ma10 : journalExitSnapshots.manual;
    const signal_id=field(form,"signal_id");
    if (signal_id && !/^[0-9a-f]{64}$/.test(signal_id)) return null;
    return { ticker,primary_strategy,initial_stop,exit_policy_snapshot,
      ...(signal_id ? {signal_id} : {}) };
  }
  const expected_revision=Number(field(form,"expected_revision"));
  if (!Number.isSafeInteger(expected_revision) || expected_revision < 1) return null;
  if (action==="finalize") return {expected_revision};
  if (action==="fill") {
    const side=field(form,"side");
    const quantity=field(form,"quantity");
    const price_idr=field(form,"price_idr");
    const fee_idr=field(form,"fee_idr");
    const fee_status=field(form,"fee_status");
    const localTime=field(form,"filled_at");
    if (!["buy","sell"].includes(side) || !/^[1-9]\d*$/.test(quantity)
      || !Number.isSafeInteger(Number(quantity)) || !positive(price_idr) || !decimal.test(fee_idr) || fee_idr.split(".")[0].length > 16
      || !["actual","estimated"].includes(fee_status)
      || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(localTime)
      || !validSessionDate(localTime.slice(0,10))) return null;
    const date=new Date(localTime+":00+07:00");
    if (Number.isNaN(date.getTime())) return null;
    return {expected_revision,side,quantity,price_idr,fee_idr,fee_status,filled_at:date.toISOString()};
  }
  if (action==="stop") {
    const new_stop=field(form,"new_stop"), reason=field(form,"reason");
    if (!positive(new_stop) || reason.length<3 || reason.length>500) return null;
    return {expected_revision,new_stop,reason};
  }
  if (action==="note") {
    const body=field(form,"body");
    if (!body || body.length>4000) return null;
    return {expected_revision,body};
  }
  if (action==="tag") {
    const tag=field(form,"tag");
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(tag)) return null;
    return {expected_revision,tag};
  }
  if (action==="correct_fill") {
    const fill_id=field(form,"fill_id"), quantity=field(form,"quantity");
    const price_idr=field(form,"price_idr"), fee_idr=field(form,"fee_idr");
    const fee_status=field(form,"fee_status"), reason=field(form,"reason");
    if (!uuid.test(fill_id) || !/^[1-9]\d*$/.test(quantity)
      || !Number.isSafeInteger(Number(quantity)) || !positive(price_idr) || !decimal.test(fee_idr) || fee_idr.split(".")[0].length > 16
      || !["actual","estimated"].includes(fee_status)
      || reason.length<3 || reason.length>500) return null;
    const localTime=field(form,"filled_at");
    if (localTime && (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(localTime)
      || !validSessionDate(localTime.slice(0,10)))) return null;
    return {expected_revision,fill_id,quantity,price_idr,fee_idr,fee_status,reason,
      ...(localTime ? {filled_at:new Date(localTime+":00+07:00").toISOString()} : {}),
      restate_initial_risk:form.get("restate_initial_risk")==="on"};
  }
  return null;
}

export async function submitActualJournal(form: FormData): Promise<{error?: string; destination?: string}> {
  const context=await journalOwner();
  if (context.kind!=="ready") return {error: context.kind};
  const action=field(form,"action");
  const requestId=field(form,"request_id");
  const tradeId=field(form,"trade_id");
  const destination=uuid.test(tradeId) ? "/journal/"+tradeId : "/journal";
  if (!uuid.test(requestId) || (action!=="create" && !uuid.test(tradeId))) {
    return {error:"invalid_request"};
  }
  const payload=payloadFromForm(form,action);
  if (!payload) return {error:"invalid_input"};
  if (action === "create" && payload.signal_id) {
    const {data:signal,error:signalError}=await context.supabase.from("signals")
      .select("id,ticker,strategy,data_mode,namespace")
      .eq("id",payload.signal_id).eq("data_mode",context.mode).eq("namespace","forward").maybeSingle();
    if (signalError) return {error:"unavailable"};
    if (!signal || signal.id !== payload.signal_id || signal.ticker !== payload.ticker || signal.strategy !== payload.primary_strategy
      || signal.data_mode !== context.mode || signal.namespace !== "forward") return {error:"invalid_input"};
  }
  const {data,error}=await context.supabase.rpc("apply_actual_journal",{
    p_action:action,p_trade_id:action==="create"?null:tradeId,
    p_payload:payload,p_request_id:requestId,
  });
  if (error) {
    const safeCode=["PT412","40001","23514","22023","42501"].includes(error.code)
      ? error.code : "unavailable";
    return {error:safeCode};
  }
  revalidatePath("/journal");
  revalidatePath("/analytics");
  const result=data as {trade_id?:string}|null;
  if (!result?.trade_id || !uuid.test(result.trade_id)) return {error:"unavailable"};
  revalidatePath(destination);
  revalidatePath("/journal/"+result.trade_id);
  return {destination:"/journal/"+result.trade_id+"?saved=1"};
}
