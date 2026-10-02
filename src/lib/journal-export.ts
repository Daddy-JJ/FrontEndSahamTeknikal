import "server-only";
import { journalOwner } from "@/lib/journal-server";
import { journalFilters } from "@/lib/journal-filters";

export type ExportRow = Record<string, unknown> & {
  contract_version: string; mode: string; data_mode: string; trade_id: string;
  exit_policy_snapshot: Record<string, unknown>; status: string;
};
export type ExportPage = {
  contract_version: string; mode: string; data_mode: string;
  rows: ExportRow[]; has_more: boolean; next_after: string | null;
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function journalExport(query: URLSearchParams) {
  const context=await journalOwner();
  if(context.kind!=="ready") return {kind:context.kind} as const;
  const filters=journalFilters(Object.fromEntries(query));
  const after=query.get("after");
  if(!filters || [...query.keys()].some(key=>query.getAll(key).length>1)
    || (query.has("mode") && query.get("mode")!=="actual")
    || query.has("page") || (after && after!=="start" && !uuid.test(after)))
    return {kind:"invalid_filter"} as const;
  const {from,to,strategy,exitVersion,exitSnapshot}=filters;
  const {data,error}=await context.supabase.rpc("export_actual_journal",{
    p_from:from,p_to:to,p_strategy:strategy,p_exit_version:exitVersion,
    p_exit_snapshot:exitSnapshot,
    p_after:after && after!=="start"?after:null,p_limit:200,p_status:"closed",
  });
  const page=data as ExportPage|null;
  if(error || !page || page.contract_version!=="actual-journal-export-v1"
    || page.mode!=="actual" || page.data_mode!==context.mode || !Array.isArray(page.rows)
    || page.rows.length>200 || typeof page.has_more!=="boolean"
    || (page.has_more && (!page.next_after || !uuid.test(page.next_after)))
    || page.rows.some(row=>row.mode!=="actual" || row.data_mode!==context.mode || row.status!=="closed"))
    return {kind:"unavailable"} as const;
  return {kind:"ready",mode:context.mode,page} as const;
}
