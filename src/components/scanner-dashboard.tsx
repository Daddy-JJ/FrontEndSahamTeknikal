import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { ScannerTerminal } from "@/components/scanner-terminal";
import { readScanner } from "@/lib/scanner-server";
import { scannerQuery, scanWindow } from "@/lib/scanner-contract";

export async function ScannerDashboard({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = scannerQuery(await searchParams);
  if (!query) return (
    <JournalShell mode={null} variant="terminal" activePage="scanner">
      <section className="journal-panel">
        <span className="eyebrow">SCANNER</span>
        <h1>Halaman scanner tidak valid</h1>
        <p>Parameter kueri atau nomor halaman tidak valid.</p>
        <div className="journal-actions"><Link className="primary-button" href="/scanner">Buka run terbaru</Link></div>
      </section>
    </JournalShell>
  );
  const state = await readScanner(query);
  if (state.kind !== "scan") {
    const heading = state.kind === "preparing" ? "Pemindaian live sedang disiapkan."
      : state.kind === "missing-run" ? "Run tidak ditemukan"
      : state.kind === "read-error" ? "Pembacaan scanner gagal"
      : state.kind === "contract-error" ? "Kontrak scanner belum dapat diverifikasi"
      : state.kind === "forbidden" ? "Akses scanner ditolak" : "Akses scanner belum tersedia";
    return (
      <JournalShell mode={"mode" in state ? state.mode ?? null : null} variant="terminal" activePage="scanner">
        <section className="journal-panel">
          <span className="eyebrow">OTENTIKASI &amp; AKSES</span><h1>{heading}</h1>
          <p role={state.kind.endsWith("error") ? "alert" : "status"}>
            {state.kind === "preparing" ? "Belum ada run forward yang diterbitkan. Ini bukan hasil no signal; tidak ada data demo sebagai pengganti."
              : state.kind === "unauthenticated" ? "Masuk dengan akun owner untuk membaca hasil scan melalui RLS."
              : state.kind === "forbidden" ? "Akun ini tidak memiliki keanggotaan owner aktif."
              : "Data tidak ditampilkan sampai akses, mode, dan kontrak backend dapat diverifikasi. Kegagalan baca bukan hasil kosong."}
          </p>
          <div className="journal-actions"><Link className="primary-button" href="/login">Masuk sebagai owner</Link><Link className="secondary-link" href="/scanner">Coba baca kembali</Link></div>
        </section>
      </JournalShell>
    );
  }
  return <JournalShell mode={state.mode} variant="terminal" activePage="scanner">
    <ScannerTerminal key={[state.run.id, state.section, query.page, query.date, query.strategy].join(":")} run={state.run} query={query} section={state.section}
      items={state.items} signals={state.signals} hasMore={state.hasMore}
      entryWindow={scanWindow(state.run, state.checkedAt)}
      lastSuccessful={state.lastSuccessful?.session_date ?? null} />
  </JournalShell>;
}
