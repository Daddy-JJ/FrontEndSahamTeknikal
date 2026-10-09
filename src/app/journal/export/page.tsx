import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalExport } from "@/lib/journal-export";

export const dynamic="force-dynamic";
export default async function ExportPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(await searchParams)) {
    if(Array.isArray(value)) value.forEach(v=>query.append(key,v));
    else if(value!==undefined) query.set(key,value);
  }
  const result=await journalExport(query);
  if(result.kind!=="ready") return <JournalShell mode={null} activePage="journal">
    <section className="journal-hero"><h1>Ekspor belum tersedia</h1><p>{result.kind==="invalid_filter"
      ?"Filter cohort atau cursor tidak valid.":"Periksa sesi owner, koneksi, dan schema jurnal."}</p></section>
    <Link href="/analytics">Kembali ke analytics</Link>
  </JournalShell>;
  const {page}=result;
  const download=new URLSearchParams(query); if(!download.has("after")) download.set("after","start");
  const next=new URLSearchParams(query); if(page.next_after) next.set("after",page.next_after);
  return <JournalShell mode={result.mode} activePage="journal">
    <section className="journal-hero"><div><span className="eyebrow">CSV / ACTUAL / CLOSED</span>
      <h1>Ekspor jurnal per bagian</h1><p>Filter tanggal exit Asia/Jakarta: {query.get("from")||"awal histori"} sampai {query.get("to")||"akhir histori"}.
      Setiap bagian memuat maksimal 200 trade. Unduh bagian ini sebelum membuka bagian berikutnya.</p></div></section>
    {result.mode==="fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — bukan performa live.</p>}
    <section className="journal-panel"><h2>{page.rows.length} trade closed pada bagian ini</h2>
      <p>CSV menyertakan revisi, konfigurasi exit, status biaya, catatan, tag, dan angka desimal dari ledger backend.
      Ekspor beberapa bagian saat ledger tidak sedang diedit agar hasil tetap konsisten.</p>
      <div className="journal-hero-actions">
        {page.rows.length>0 && <a href={"/api/export/journal?"+download.toString()}>Unduh bagian ini</a>}
        {page.has_more && <Link href={"/journal/export?"+next.toString()}>Bagian berikutnya →</Link>}
        <Link href="/analytics">Kembali ke analytics</Link>
      </div>
      {!page.has_more && <p>Ini bagian terakhir dari cohort yang dipilih.</p>}
    </section>
  </JournalShell>;
}
