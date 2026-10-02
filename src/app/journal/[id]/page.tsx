import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner, type ActualTrade } from "@/lib/journal-server";
import { JournalForm } from "@/components/journal-form";
import { journalEventPageSize, journalHistoryHref, journalHistorySelection,
  journalHistorySections, type JournalHistorySection } from "@/lib/journal-page";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const money=(v:string|number|null|undefined)=>v==null?"—":
  new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(Number(v));
const ratio=(v:string|number|null|undefined)=>v==null?"—":
  new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(Number(v));
type Fill={id:string;side:"buy"|"sell";filled_at:string;sequence:number;quantity:number;
  price_idr:string|number;fee_idr:string|number;fee_status:string};
type Correction={sequence:number;filled_at:string;fill_id:string;quantity:number;price_idr:string|number;
  fee_idr:string|number;fee_status:string;reason:string};
type FillWithCorrection=Fill & {latest_correction:Correction[]};
type Stop={id:string;old_stop:string|number;new_stop:string|number;reason:string;occurred_at:string};
type Note={id:string;body:string;created_at:string};
type Tag={tag:string};

const historyLabels:Record<JournalHistorySection,string>={fills:"Fill",corrections:"Koreksi",
  stops:"Stop",notes:"Catatan",tags:"Tag"};

function HistoryPager({tradeId,section,page,hasMore}:{
  tradeId:string;section:JournalHistorySection;page:number;hasMore:boolean;
}) {
  if(page===1 && !hasMore) return null;
  return <nav className="journal-pagination" aria-label={"Halaman "+historyLabels[section]}>
    {page>1 && <Link href={journalHistoryHref(tradeId,section,page-1)}>← Lebih baru</Link>}
    <span>Halaman {page}</span>
    {hasMore && <Link href={journalHistoryHref(tradeId,section,page+1)}>Lebih lama →</Link>}
  </nav>;
}

function Hidden({action,trade}: {action:string;trade:ActualTrade}) {
  return <><input type="hidden" name="action" value={action}/>
    <input type="hidden" name="trade_id" value={trade.id}/>
    <input type="hidden" name="expected_revision" value={trade.revision}/>
    <input type="hidden" name="request_id" value={crypto.randomUUID()}/></>;
}
function FillForm({trade,side}: {trade:ActualTrade;side:"buy"|"sell"}) {
  return <JournalForm className="journal-form journal-fill-form">
    <Hidden action="fill" trade={trade}/><input type="hidden" name="side" value={side}/>
    <label>Waktu fill · WIB<input name="filled_at" type="datetime-local" required/></label>
    <label>Jumlah saham<input name="quantity" type="number" min="1" step="1" required/></label>
    <label>Harga per saham · Rp<input name="price_idr" type="number" min="0.0001" step="0.0001" required/></label>
    <label>Biaya fill · Rp<input name="fee_idr" type="number" min="0" step="0.0001" placeholder="Isi biaya, termasuk 0 jika terverifikasi" required/></label>
    <label>Status biaya<select name="fee_status" defaultValue="estimated"><option value="actual">Aktual dari broker</option>
      <option value="estimated">Estimasi, belum diverifikasi</option></select></label>
    <button className="primary-button" type="submit">Catat {side==="buy"?"pembelian":"penjualan"}</button>
  </JournalForm>;
}

export default async function TradePage({params,searchParams}:{
  params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const {id}=await params;
  const query=await searchParams;
  const selection=journalHistorySelection(query);
  const context=await journalOwner();
  if (context.kind!=="ready" || !uuid.test(id) || !selection) return <JournalShell mode={null}>
    <section className="journal-hero"><h1>Trade tidak tersedia</h1><p>Masuk sebagai owner dan periksa tautan jurnal.</p>
      <Link href="/journal">Kembali ke jurnal</Link></section></JournalShell>;
  const {data:tradeData,error:tradeError}=await context.supabase.from("actual_trades")
    .select("*").eq("id",id).eq("data_mode",context.mode).maybeSingle();
  if (tradeError) return <JournalShell mode={context.mode}>
    <section className="journal-hero"><h1>Trade belum dapat dibaca</h1><p>Pembacaan jurnal gagal. Coba lagi setelah koneksi dan schema tersedia.</p></section>
  </JournalShell>;
  if (!tradeData) return <JournalShell mode={context.mode}>
    <section className="journal-hero"><h1>Trade tidak ditemukan</h1><p>Data ini belum tersedia untuk owner dan mode proyek saat ini.</p>
      <Link href="/journal">Kembali ke jurnal</Link></section></JournalShell>;
  const trade=tradeData as ActualTrade;
  const {section,page}=selection;
  const range=[(page-1)*journalEventPageSize,page*journalEventPageSize] as const;
  let fills:FillWithCorrection[]=[];
  let corrections:Correction[]=[];
  let stops:Stop[]=[];
  let notes:Note[]=[];
  let tags:Tag[]=[];
  let hasMore=false;
  let readError=false;
  if(section==="fills") {
    const result=await context.supabase.from("actual_fills")
      .select("id,side,filled_at,sequence,quantity,price_idr,fee_idr,fee_status,latest_correction:actual_fill_corrections!actual_fill_corrections_fill_id_fkey(sequence,filled_at,fill_id,quantity,price_idr,fee_idr,fee_status,reason)")
      .eq("trade_id",id).order("sequence",{ascending:false})
      .order("sequence",{referencedTable:"latest_correction",ascending:false})
      .limit(1,{referencedTable:"latest_correction"}).range(...range);
    readError=Boolean(result.error || !result.data
      || result.data.some(row=>!Array.isArray(row.latest_correction)));
    fills=((result.data??[]) as FillWithCorrection[]).slice(0,journalEventPageSize);
    hasMore=(result.data?.length??0)>journalEventPageSize;
  } else if(section==="corrections") {
    const result=await context.supabase.from("actual_fill_corrections")
      .select("sequence,filled_at,fill_id,quantity,price_idr,fee_idr,fee_status,reason")
      .eq("trade_id",id).order("sequence",{ascending:false}).range(...range);
    readError=Boolean(result.error || !result.data);
    corrections=((result.data??[]) as Correction[]).slice(0,journalEventPageSize);
    hasMore=(result.data?.length??0)>journalEventPageSize;
  } else if(section==="stops") {
    const result=await context.supabase.from("actual_stop_events").select("id,old_stop,new_stop,reason,occurred_at")
      .eq("trade_id",id).order("occurred_at",{ascending:false}).order("id",{ascending:false})
      .range(...range);
    readError=Boolean(result.error || !result.data);
    stops=((result.data??[]) as Stop[]).slice(0,journalEventPageSize);
    hasMore=(result.data?.length??0)>journalEventPageSize;
  } else if(section==="notes") {
    const result=await context.supabase.from("actual_notes").select("id,body,created_at")
      .eq("trade_id",id).order("created_at",{ascending:false}).order("id",{ascending:false})
      .range(...range);
    readError=Boolean(result.error || !result.data);
    notes=((result.data??[]) as Note[]).slice(0,journalEventPageSize);
    hasMore=(result.data?.length??0)>journalEventPageSize;
  } else {
    const result=await context.supabase.from("actual_trade_tags").select("tag")
      .eq("trade_id",id).order("tag",{ascending:true}).range(...range);
    readError=Boolean(result.error || !result.data);
    tags=((result.data??[]) as Tag[]).slice(0,journalEventPageSize);
    hasMore=(result.data?.length??0)>journalEventPageSize;
  }
  const latest=new Map<string,Correction>();
  for(const fill of fills) if(fill.latest_correction[0]) latest.set(fill.id,fill.latest_correction[0]);
  if (readError) return <JournalShell mode={context.mode}>
    <section className="journal-hero"><h1>Riwayat trade belum dapat dibaca</h1></section>
    <p role="alert" className="journal-alert">Pembacaan fill atau audit gagal. Form dinonaktifkan sampai halaman riwayat dapat dibaca; ini bukan jurnal kosong.</p>
    <Link href="/journal">Kembali ke jurnal</Link>
  </JournalShell>;
  return <JournalShell mode={context.mode}>
    <section className="journal-hero"><div><Link className="journal-back" href="/journal">← Jurnal aktual</Link>
      <span className="eyebrow">TRADE AKTUAL / {trade.primary_strategy.replaceAll("_"," ")}</span>
      <h1>{trade.ticker} <span className={"badge "+(trade.status==="closed"?"green":trade.status==="open"?"amber":"neutral")}>{trade.status}</span></h1>
      <p>Revisi {trade.revision} · {trade.exit_policy_snapshot?.version ?? "Versi exit tidak tersedia"} · {context.mode==="fixture"?"data uji development":"data live"}</p>
    </div></section>
    {query.saved && <p role="status" className="journal-success">Perubahan tersimpan dan ledger dihitung ulang.</p>}
    {query.error && <p role="alert" className="journal-alert">Aksi belum tersimpan. Periksa data, status entry, jumlah tersisa, atau revisi trade. Muat ulang sebelum mencoba lagi.</p>}
    <section className="journal-metrics">
      <div><span>Initial risk</span><strong>Rp{money(trade.initial_risk_idr ?? trade.provisional_risk_idr)}</strong>
        <small>{trade.initial_risk_idr==null?"Provisional · belum final":"Terkunci · sebelum fee"}</small></div>
      <div><span>Posisi tersisa</span><strong>{trade.open_quantity}</strong><small>Saham</small></div>
      <div><span>Realized P&amp;L</span><strong>Rp{money(trade.realized_pnl_idr)}</strong><small>Biaya Rp{money(trade.fee_total_idr)}</small></div>
      <div><span>Realized R</span><strong>{ratio(trade.realized_r)}{trade.realized_r==null?"":"R"}</strong>
        <small>{trade.status==="closed"?"Closed trade":"Baru final saat closed"}</small></div>
    </section>
    <nav className="journal-history-tabs" aria-label="Jenis riwayat trade">
      {journalHistorySections.map(item=><Link key={item} href={journalHistoryHref(id,item)}
        aria-current={section===item?"page":undefined}>{historyLabels[item]}</Link>)}
    </nav>
    <div className="journal-columns">
      <section className="journal-panel"><div className="journal-panel-heading"><div>
        <span className="eyebrow">LEDGER</span><h2>Fills dan koreksi</h2></div></div>
        {section==="fills" && <><p className="journal-help">Urut berdasarkan nomor pencatatan terbaru. Waktu yang ditampilkan mengikuti koreksi terakhir; angka saldo dan P&amp;L berasal dari backend.</p>
        {fills.length===0?<p className="journal-help">{page===1?"Belum ada fill. Masukkan harga dan fee sesuai konfirmasi broker.":"Tidak ada fill pada halaman ini."}</p>:
        <div className="journal-fills">{fills.map(f=>{
          const effective=latest.get(f.id);
          const v=effective??f;
          return <div className="journal-fill" key={f.id}>
            <div><strong>{f.side==="buy"?"Beli":"Jual"} {v.quantity} saham</strong>
              <small>{new Date(v.filled_at).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})} WIB
                {effective?" · dikoreksi":""}</small></div>
            <div><strong>Rp{money(v.price_idr)}</strong><small>Fee Rp{money(v.fee_idr)} · {v.fee_status}</small></div>
            <details><summary>Koreksi fill</summary>
              <JournalForm className="journal-form">
                <Hidden action="correct_fill" trade={trade}/>
                <input type="hidden" name="fill_id" value={f.id}/>
                <label>Waktu koreksi · WIB (kosong: pertahankan)<input name="filled_at" type="datetime-local"/></label>
                <label>Jumlah<input name="quantity" type="number" min="1" step="1" defaultValue={v.quantity} required/></label>
                <label>Harga<input name="price_idr" type="number" min="0.0001" step="0.0001" defaultValue={String(v.price_idr)} required/></label>
                <label>Fee<input name="fee_idr" type="number" min="0" step="0.0001" defaultValue={String(v.fee_idr)} required/></label>
                <label>Status biaya<select name="fee_status" defaultValue={v.fee_status}>
                  <option value="actual">Aktual</option><option value="estimated">Estimasi</option></select></label>
                <label>Alasan koreksi<input name="reason" minLength={3} maxLength={500} required/></label>
                {f.side==="buy" && trade.initial_risk_idr!=null && <label className="journal-check">
                  <input name="restate_initial_risk" type="checkbox"/>
                  Koreksi juga risk awal (diaudit)</label>}
                <button className="primary-button" type="submit">Simpan koreksi</button>
              </JournalForm>
            </details>
          </div>;
        })}</div>}
        <HistoryPager tradeId={id} section={section} page={page} hasMore={hasMore}/></>}
        {section==="corrections" && <><h3>Jejak koreksi</h3>
        {corrections.length===0?<p className="journal-help">{page===1?"Belum ada koreksi fill.":"Tidak ada koreksi pada halaman ini."}</p>:
          <div className="journal-history">{corrections.map(c=><p key={c.sequence}>
            Koreksi #{c.sequence} · fill {c.fill_id.slice(0,8)} · {new Date(c.filled_at).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})} WIB
            · {c.quantity} saham @ Rp{money(c.price_idr)} · fee Rp{money(c.fee_idr)} ({c.fee_status}) · {c.reason}
          </p>)}</div>}
        <HistoryPager tradeId={id} section={section} page={page} hasMore={hasMore}/></>}
        {section!=="fills" && section!=="corrections" && <p className="journal-help">Pilih Fill atau Koreksi di navigasi riwayat untuk melihat event ledger.</p>}
      </section>
      <section className="journal-panel"><div className="journal-panel-heading"><div>
        <span className="eyebrow">EKSEKUSI</span><h2>Catat fill</h2></div></div>
        {trade.entry_finalized_at==null && trade.status!=="closed" && <><h3>Pembelian entry batch</h3>
          <FillForm trade={trade} side="buy"/>
          {trade.open_quantity>0 && <JournalForm className="journal-inline-form">
            <Hidden action="finalize" trade={trade}/>
            <button className="journal-secondary" type="submit">Finalisasi entry · kunci risk</button>
          </JournalForm>}</>}
        {trade.status!=="closed" && trade.open_quantity>0 && <>
          <h3>Penjualan / partial exit</h3>
          <p className="journal-help">Sell pertama otomatis memfinalisasi entry. Jumlah jual tidak boleh melebihi {trade.open_quantity} saham.</p>
          <FillForm trade={trade} side="sell"/></>}
        {trade.status==="closed" && <p className="journal-help">Seluruh saham sudah terjual. Koreksi fill tetap tersedia dengan alasan dan audit.</p>}
      </section>
    </div>
    <div className="journal-columns">
      <section className="journal-panel"><span className="eyebrow">RISIKO & KONTEKS</span><h2>Rencana immutable</h2>
        <dl className="journal-facts">
          <div><dt>Initial stop</dt><dd>Rp{money(trade.initial_stop)}</dd></div>
          <div><dt>Stop saat ini</dt><dd>Rp{money(trade.current_stop)}</dd></div>
          <div><dt>Cost basis tersisa · termasuk buy fee</dt><dd>Rp{money(trade.remaining_cost_idr)}</dd></div>
          <div><dt>Planned RR</dt><dd>{trade.exit_policy_snapshot?.mode==="fixed_rr"
            ? ratio(trade.exit_policy_snapshot.target_r)+"R" : "Target terbuka"}</dd></div>
          <div><dt>Exit policy</dt><dd>{trade.exit_policy_snapshot?.mode ?? "—"}</dd></div>
          {trade.exit_policy_snapshot?.mode==="ma_close" && <div><dt>MA close → next open</dt><dd>{trade.exit_policy_snapshot.ma_type} {trade.exit_policy_snapshot.period}</dd></div>}
        </dl>
        {trade.status==="open" && trade.entry_finalized_at!=null && <JournalForm className="journal-form">
          <Hidden action="stop" trade={trade}/>
          <label>Stop baru · Rp<input name="new_stop" type="number" min="0.0001" step="0.0001" required/></label>
          <label>Alasan<input name="reason" minLength={3} maxLength={500} required/></label>
          <button className="journal-secondary" type="submit">Catat perubahan stop</button>
        </JournalForm>}
        {section==="stops" && <><div className="journal-history">{stops.map(s=><p key={s.id}>Rp{money(s.old_stop)} → Rp{money(s.new_stop)} · {s.reason}</p>)}</div>
          {stops.length===0 && <p className="journal-help">{page===1?"Belum ada perubahan stop.":"Tidak ada stop pada halaman ini."}</p>}
          <HistoryPager tradeId={id} section={section} page={page} hasMore={hasMore}/></>}
      </section>
      <section className="journal-panel"><span className="eyebrow">AUDIT</span><h2>Catatan & tag</h2>
        <JournalForm className="journal-form"><Hidden action="note" trade={trade}/>
          <label>Catatan<input name="body" maxLength={4000} required placeholder="Alasan, review, atau konteks transaksi"/></label>
          <button className="journal-secondary" type="submit">Tambah catatan</button></JournalForm>
        {section==="notes" && <><div className="journal-history">{notes.map(n=><p key={n.id}>{n.body}</p>)}</div>
          {notes.length===0 && <p className="journal-help">{page===1?"Belum ada catatan.":"Tidak ada catatan pada halaman ini."}</p>}
          <HistoryPager tradeId={id} section={section} page={page} hasMore={hasMore}/></>}
        <JournalForm className="journal-form"><Hidden action="tag" trade={trade}/>
          <label>Tag sekunder<input name="tag" pattern="[A-Za-z0-9_-]{2,40}" required placeholder="breakout"/></label>
          <button className="journal-secondary" type="submit">Tambah tag</button></JournalForm>
        {section==="tags" && <><div className="journal-tags">{tags.map(t=><span className="badge neutral" key={t.tag}>{t.tag}</span>)}</div>
          {tags.length===0 && <p className="journal-help">{page===1?"Belum ada tag.":"Tidak ada tag pada halaman ini."}</p>}
          <HistoryPager tradeId={id} section={section} page={page} hasMore={hasMore}/></>}
        <p className="journal-help">Tag sekunder tidak menggandakan P&amp;L pada analytics. Seluruh aksi tersimpan dalam audit owner.</p>
      </section>
    </div>
  </JournalShell>;
}
