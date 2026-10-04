import { strategies, fmt } from "@/lib/types";
import { journalOwner } from "@/lib/journal-server";
import { parseLivePaperJournal } from "@/lib/actual-analytics";

/** Fixture preview is isolated from live and never queries the actual ledger.
 * Live paper journal queries read_paper_journal RPC on PostgreSQL with owner RLS.
 */
export async function PaperJournalPreview({
  mode,
  view,
  supabase,
}: {
  mode: "fixture" | "live";
  view: "journal" | "analytics";
  supabase?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  if (mode === "fixture") {
    const snapshot = (await import("@/generated/demo.json")).default;
    return (
      <section className="journal-panel journal-full-panel">
        <span className="badge amber">FIXTURE DEVELOPMENT · {snapshot.cost_label}</span>
        <h2>{view === "journal" ? "Pratinjau paper fixture" : "Analitik paper fixture"}</h2>
        <p className="panel-note">Data sintetis untuk pengujian tampilan, bukan forward book production atau performa akun riil. Ambiguitas dual-hit dan hasil alternatif tetap ditandai.</p>
        <div className="table-scroll">
          {view === "journal" ? (
            <table className="dense-table">
              <thead><tr><th>Ticker</th><th>Strategi</th><th>Status</th><th>Entry simulasi</th><th>Initial SL</th><th>Target</th><th>R fixture</th><th>Alasan / alternatif</th></tr></thead>
              <tbody>{snapshot.paper.map(t => <tr key={t.id}>
                <td>{t.ticker}</td><td>{strategies[t.strategy as keyof typeof strategies]?.label ?? t.strategy}</td><td>{t.state}</td>
                <td>{fmt(t.entry, 2)}</td><td>{fmt(t.stop, 2)}</td><td>{fmt(t.target, 2)}</td>
                <td>{fmt(t.realized_r, 3)}</td><td>{t.reason}{t.alternate_r !== null ? ` · ambiguous; alternatif ${fmt(t.alternate_r, 3)} R` : ""}</td>
              </tr>)}</tbody>
            </table>
          ) : (
            <table className="dense-table">
              <thead><tr><th>Strategi</th><th>Closed</th><th>Win rate</th><th>Expectancy R</th><th>Ambiguous</th></tr></thead>
              <tbody>{Object.entries(snapshot.strategy_metrics).map(([strategy, m]) => <tr key={strategy}>
                <td>{strategies[strategy as keyof typeof strategies]?.label ?? strategy}</td><td>{m.closed}</td>
                <td>{m.win_rate === null ? "—" : fmt(Number(m.win_rate) * 100, 3) + "%"}</td>
                <td>{fmt(m.expectancy_r, 3)}</td><td>{m.ambiguous_count}</td>
              </tr>)}</tbody>
            </table>
          )}
        </div>
      </section>
    );
  }

  // Live Mode: query read_paper_journal RPC on Supabase
  let client = supabase;
  if (!client) {
    const owner = await journalOwner();
    if (owner.kind !== "ready") {
      return (
        <section className="journal-panel">
          <h2>Paper live memerlukan sesi owner</h2>
          <p>Sesi owner diperlukan untuk memuat forward paper journal dari database PostgreSQL.</p>
        </section>
      );
    }
    client = owner.supabase;
  }

  const { data, error } = await client.rpc("read_paper_journal");
  if (error) {
    return (
      <section className="journal-panel">
        <h2>Gagal memuat paper journal live</h2>
        <p className="panel-note">Terjadi kesalahan pada RPC read_paper_journal: {error.message}</p>
      </section>
    );
  }

  const journal = parseLivePaperJournal(data, "live");
  if (!journal) {
    return (
      <section className="journal-panel">
        <h2>Respon paper journal live tidak valid</h2>
        <p className="panel-note">Struktur respon data paper tidak lolos verifikasi integritas boundary.</p>
      </section>
    );
  }

  return (
    <section className="journal-panel journal-full-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
        <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--emerald, #10b981)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          LIVE FORWARD PAPER · DATABASE SUPABASE
        </span>
        <div className="mono" style={{ fontSize: "12px", color: "var(--muted)" }}>
          Total Trades: {journal.trades_count} · Open: {journal.open_count} · Closed: {journal.closed_count} · Hold: {journal.data_hold_count}
        </div>
      </div>
      <h2>{view === "journal" ? "Jurnal forward paper live" : "Analitik forward paper live"}</h2>
      <p className="panel-note">
        Simulasi forward paper tersimpan persisten pada PostgreSQL (tabel paper_trades) dengan RLS owner-only.
        Data simulasi ini terisolasi sepenuhnya dari ledger aktual dan tidak mempengaruhi saldo riil.
      </p>

      <div style={{ display: "flex", gap: "24px", margin: "16px 0", flexWrap: "wrap", padding: "12px 16px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "6px" }}>
        <div className="mono" style={{ fontSize: "13px" }}>
          Kumulatif R: <span style={{ fontWeight: "bold", color: Number(journal.cumulative_r) >= 0 ? "var(--emerald, #10b981)" : "var(--red, #ef4444)" }}>
            {Number(journal.cumulative_r) > 0 ? "+" : ""}{fmt(journal.cumulative_r, 3)} R
          </span>
        </div>
        <div className="mono" style={{ fontSize: "13px" }}>
          Win Rate: <span style={{ fontWeight: "bold" }}>
            {journal.win_rate !== null ? `${fmt(Number(journal.win_rate) * 100, 1)}%` : "—"} ({journal.wins}W / {journal.losses}L)
          </span>
        </div>
        <div className="mono" style={{ fontSize: "13px" }}>
          Expectancy R: <span style={{ fontWeight: "bold" }}>
            {journal.expectancy_r !== null ? `${fmt(journal.expectancy_r, 3)} R` : "—"}
          </span>
        </div>
        <div className="mono" style={{ fontSize: "13px", color: journal.ambiguous_count > 0 ? "var(--amber, #f59e0b)" : "var(--muted)" }}>
          Ambigu: <span style={{ fontWeight: "bold" }}>{journal.ambiguous_count}</span>
        </div>
      </div>

      <div className="table-scroll">
        {view === "journal" ? (
          journal.trades.length === 0 ? (
            <div className="journal-empty" style={{ padding: "30px 20px" }}>
              <p>Belum ada trade forward paper tercatat pada database. Forward paper trade akan dicatat otomatis saat scanner mengeksekusi sinyal baru.</p>
            </div>
          ) : (
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Strategi</th>
                  <th>Status</th>
                  <th>Entry</th>
                  <th>Initial SL</th>
                  <th>Target</th>
                  <th>Realized R</th>
                  <th>Alasan / Alternatif</th>
                </tr>
              </thead>
              <tbody>
                {journal.trades.map(t => (
                  <tr key={t.id}>
                    <td className="mono font-bold">{t.ticker}</td>
                    <td>{strategies[t.strategy as keyof typeof strategies]?.label ?? t.strategy}</td>
                    <td>
                      <span className={`badge ${t.state === "closed" ? "gray" : t.state === "open" ? "emerald" : t.state === "data_hold" ? "amber" : "blue"}`}>
                        {t.state}
                      </span>
                    </td>
                    <td>{fmt(t.entry_price, 2)}</td>
                    <td>{fmt(t.initial_stop, 2)}</td>
                    <td>{fmt(t.target_price, 2)}</td>
                    <td className="mono" style={{ color: t.realized_r !== null && Number(t.realized_r) > 0 ? "var(--emerald, #10b981)" : t.realized_r !== null && Number(t.realized_r) < 0 ? "var(--red, #ef4444)" : "inherit" }}>
                      {t.realized_r !== null ? `${Number(t.realized_r) > 0 ? "+" : ""}${fmt(t.realized_r, 3)} R` : "—"}
                    </td>
                    <td>
                      {t.reason}
                      {t.alternate_r !== null ? ` · ambiguous; alternatif ${fmt(t.alternate_r, 3)} R` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <div style={{ padding: "12px 0" }}>
            <p className="panel-note" style={{ marginBottom: "16px" }}>
              Metrik analitik simulasi forward paper dihitung secara deterministik oleh RPC read_paper_journal.
            </p>
            {journal.closed_count === 0 ? (
              <div className="journal-empty" style={{ padding: "30px 20px" }}>
                <p>Belum ada trade closed pada paper live untuk menghitung statistik performa.</p>
              </div>
            ) : (
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Metrik</th>
                    <th>Nilai</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Closed Trades</td>
                    <td className="mono font-bold">{journal.closed_count}</td>
                    <td>Jumlah simulasi yang telah exit</td>
                  </tr>
                  <tr>
                    <td>Win Rate</td>
                    <td className="mono font-bold">{journal.win_rate !== null ? `${fmt(Number(journal.win_rate) * 100, 1)}%` : "—"}</td>
                    <td>{journal.wins} win / {journal.losses} loss</td>
                  </tr>
                  <tr>
                    <td>Expectancy R</td>
                    <td className="mono font-bold">{journal.expectancy_r !== null ? `${fmt(journal.expectancy_r, 3)} R` : "—"}</td>
                    <td>Ekspektasi R per trade tertutup</td>
                  </tr>
                  <tr>
                    <td>Kumulatif Realized R</td>
                    <td className="mono font-bold">{fmt(journal.cumulative_r, 3)} R</td>
                    <td>Total keuntungan/kerugian dalam unit R</td>
                  </tr>
                  <tr>
                    <td>Dual-hit Ambiguous</td>
                    <td className="mono font-bold">{journal.ambiguous_count}</td>
                    <td>Trade di mana SL &amp; TP tersentuh pada bar yang sama (baseline SL-first)</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
