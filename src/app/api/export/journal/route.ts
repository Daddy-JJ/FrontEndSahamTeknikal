import { journalExport } from "@/lib/journal-export";
import { actualJournalCsv } from "@/generated/actual-journal-export.mjs";

export const dynamic="force-dynamic";

export async function GET(request:Request) {
  const query=new URL(request.url).searchParams;
  const result=await journalExport(query);
  if(result.kind!=="ready") return Response.json({error:{code:result.kind,
    message:result.kind==="invalid_filter"?"Filter ekspor tidak valid.":"Ekspor jurnal owner belum tersedia."}},
    {status:result.kind==="forbidden"?403:result.kind==="unauthenticated"?401:result.kind==="invalid_filter"?400:503,
      headers:{"Cache-Control":"private, no-store"}});
  const {page,mode}=result;
  if(page.has_more && !query.has("after")) return Response.json({error:{code:"EXPORT_REQUIRES_PAGING",
    message:"Cohort melebihi 200 trade. Buka halaman ekspor untuk mengunduh semua bagian.",
    export_url:"/journal/export?"+query.toString()}},
    {status:413,headers:{"Cache-Control":"private, no-store"}});
  let csv:string;
  try { csv=actualJournalCsv(page); }
  catch { return Response.json({error:{code:"INVALID_EXPORT_CONTRACT",message:"Format ekspor backend belum sesuai."}},
    {status:503,headers:{"Cache-Control":"private, no-store"}}); }
  return new Response("\uFEFF"+csv,{status:200,headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":`attachment; filename="actual-journal-${mode}-${query.get("after")||"start"}.csv"`,
    "Cache-Control":"private, no-store","X-Export-Mode":"actual","X-Data-Mode":mode,
    "X-Export-Cohort":"closed-exit-session-Asia-Jakarta","X-Page-Limit":"200",
    "X-Has-More":String(page.has_more),"X-Next-After":page.next_after??"",
  }});
}
