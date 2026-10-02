export const journalPageSize = 100;
export const journalEventPageSize = 50;
export const journalHistorySections = ["fills", "corrections", "stops", "notes", "tags"] as const;
export type JournalHistorySection = typeof journalHistorySections[number];

export function journalPageNumber(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page <= 10000 ? page : null;
}

export function journalHistorySelection(query: Record<string,string|string[]|undefined>) {
  const page=journalPageNumber(query.page);
  const section=query.section??"fills";
  if(page===null || typeof section!=="string"
    || !journalHistorySections.includes(section as JournalHistorySection)) return null;
  return {section:section as JournalHistorySection,page};
}

export function journalHistoryHref(tradeId:string,section:JournalHistorySection,page=1) {
  const params=new URLSearchParams();
  if(section!=="fills") params.set("section",section);
  if(page>1) params.set("page",String(page));
  return "/journal/"+tradeId+(params.size?"?"+params.toString():"");
}
