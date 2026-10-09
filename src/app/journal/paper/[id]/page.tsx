import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner } from "@/lib/journal-server";
import { parsePaperTradeDetail } from "@/lib/trade-reporting";
import { ReportingUnavailable, reportMoney, reportRatio } from "@/components/trade-reporting";
export const dynamic = "force-dynamic";
export default async function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await journalOwner();
  if (owner.kind !== "ready") return <JournalShell mode={null} activePage="journal"><section className="journal-panel"><h1>Jurnal belum dapat dibuka</h1><p>Sesi owner aktif dan mode data terverifikasi diperlukan.</p><Link href="/login">Masuk sebagai owner</Link></section></JournalShell>;
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(id)) return <JournalShell mode={owner.mode} activePage="journal"><section className="journal-panel"><h1>Trade tidak ditemukan</h1></section></JournalShell>;
  const result = await owner.supabase.rpc("read_paper_trade_v1", { p_trade_id: id });
  const detail = result.error ? null : parsePaperTradeDetail(result.data, owner.mode, id);
  if (!detail) return <JournalShell mode={owner.mode} activePage="journal"><Link className="journal-back" href="/journal?tab=paper">← Jurnal paper</Link>
    {!result.error && result.data === null ? <section className="journal-panel"><h1>Trade tidak ditemukan</h1><p>Trade tidak tersedia pada model atau owner ini.</p></section> : <ReportingUnavailable missing={["PGRST202", "42883"].includes(result.error?.code ?? "")} />}</JournalShell>;
  const t = detail.trade;
  const facts: [string, string | number | null][] = [
    ["Sinyal", t.signal_session], ["Sumber signal ID", t.signal_id], ["Tanggal entry", t.entry_session],
    ["Harga entry · close sinyal", reportMoney(t.entry_price)], ["SL teknikal awal", reportMoney(t.initial_stop)],
    ["Stop terakhir", reportMoney(t.current_stop)], ["Lot", t.lots], ["Risiko harga awal · basis R", reportMoney(t.initial_price_risk_idr)],
    ["Planned loss termasuk fee", reportMoney(t.planned_loss_idr)], ["Target harga", reportMoney(t.target_price)],
    ["Harga exit", reportMoney(t.exit_price)], ["Tanggal exit", t.exit_session], [detail.events.some(e => e.event_type === "entry") ? "Fee beli" : "Estimasi fee beli", reportMoney(t.entry_fee_idr)],
    ["Fee jual", reportMoney(t.exit_fee_idr)], ["Total fee", reportMoney(t.fee_total_idr)],
    ["P&L net", reportMoney(t.realized_pnl_idr)], ["Realized R", reportRatio(t.realized_r) + " R"],
    ["Alasan", t.reason], ["Versi model", detail.model_version], ["Source digest", t.source_digest],
  ];
  return <JournalShell mode={owner.mode} activePage="journal">
    <Link className="journal-back" href={"/journal?tab=paper&exit_key=" + t.exit_key}>← Jurnal paper</Link>
    <section className="journal-hero"><div><span className="eyebrow">PAPER · AUDIT TRADE</span><h1>{t.ticker} · {t.exit_key === "ma10" ? "SMA10" : "Fixed 2R"}</h1><p>{t.ambiguous ? "Ambigu · terpisah dari statistik utama" : t.state} · entry simulasi sebesar close hari sinyal.</p></div></section>
    {owner.mode === "fixture" && <p className="journal-banner">DATA UJI DEVELOPMENT — bukan transaksi broker.</p>}
    <div className="reporting-stack"><section className="journal-panel"><h2>Rencana dan hasil</h2><dl className="journal-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl>
      <p className="panel-note">Initial price risk tetap dibekukan setelah stop berubah. SMA10 dipicu hanya oleh close terkonfirmasi di bawah SMA10, kemudian fill exit next-open. Checkpoint evaluasi 5/10 sesi tidak memicu exit.</p></section>
      <section className="journal-panel"><h2>Riwayat event</h2>{detail.events.length ? <ol className="reporting-events">{detail.events.map(e => <li key={e.event_id}><strong>{e.event_type}</strong><span>{e.session_date}</span><details><summary>Metadata event</summary><pre>{JSON.stringify(e.payload, null, 2)}</pre></details></li>)}</ol> : <p>Belum ada event tersedia.</p>}</section>
      <details className="journal-panel"><summary>Konfigurasi immutable</summary><pre className="reporting-config">{JSON.stringify(t.config_snapshot, null, 2)}</pre></details>
    </div>
  </JournalShell>;
}
