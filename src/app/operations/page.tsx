import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { journalOwner } from "@/lib/journal-server";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const owner = await journalOwner();
  if (owner.kind !== "ready") {
    return (
      <JournalShell mode={null}>
        <section className="journal-panel">
          <h1>Operasi belum dapat dibuka</h1>
          <p>Akses operasi memerlukan sesi owner aktif dan mode proyek yang terverifikasi.</p>
          <Link href="/login">Masuk sebagai owner</Link>
        </section>
      </JournalShell>
    );
  }

  const { data: latestRun } = await owner.supabase
    .from("scan_runs")
    .select("id,session_date,status,coverage_valid,coverage_total,stored_at,run_digest")
    .eq("namespace", "forward")
    .eq("data_mode", owner.mode)
    .order("session_date", { ascending: false })
    .order("stored_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storedWib = latestRun?.stored_at
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "medium",
        hourCycle: "h23",
      }).format(new Date(latestRun.stored_at))
    : null;

  return (
    <JournalShell mode={owner.mode}>
      <section className="journal-hero">
        <div>
          <span className="eyebrow">OPERASI SCANNER</span>
          <h1>Periksa runner dan hasil publikasi.</h1>
          <p>
            Jalankan workflow manual melalui akun pemilik repository.
            Keberhasilan runner harus dibedakan dari snapshot yang benar-benar diterbitkan ke database.
          </p>
        </div>
      </section>

      <section className="journal-panel">
        <h2>Runner GitHub Actions</h2>
        <a
          className="primary-button"
          href="https://github.com/Daddy-JJ/BackendSahamTeknikal/actions"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka GitHub Actions
        </a>
        <p className="journal-help">
          Periksa nama workflow, sesi target, dan environment sebelum Run workflow. Halaman ini tidak memulai job atau publikasi secara otomatis.
        </p>
        <Link href="/scanner">Baca snapshot scanner yang diterbitkan →</Link>
      </section>

      <section className="journal-panel">
        <h2>Observasi Status Snapshot Database</h2>
        {latestRun ? (
          <dl className="journal-facts">
            <div>
              <dt>Sesi target terakhir</dt>
              <dd>{latestRun.session_date}</dd>
            </div>
            <div>
              <dt>Status publikasi</dt>
              <dd>
                <span className={`badge ${latestRun.status === "complete" ? "emerald" : latestRun.status === "partial" ? "amber" : "red"}`}>
                  {latestRun.status}
                </span>
              </dd>
            </div>
            <div>
              <dt>Coverage valid / total</dt>
              <dd>{latestRun.coverage_valid} / {latestRun.coverage_total}</dd>
            </div>
            <div>
              <dt>Waktu publikasi (WIB)</dt>
              <dd>{storedWib ? `${storedWib} WIB` : "—"}</dd>
            </div>
            <div>
              <dt>Digest snapshot</dt>
              <dd className="mono" style={{ fontSize: "11px", wordBreak: "break-all" }}>{latestRun.run_digest}</dd>
            </div>
          </dl>
        ) : (
          <p>Belum ada snapshot run forward yang tersimpan pada database untuk mode {owner.mode}.</p>
        )}
      </section>

      <section className="journal-panel">
        <h2>Batas Observasi Operasional</h2>
        <p>
          Durasi execution runner, jadwal cron queue, dan pemakaian kuota compute GitHub diamati langsung pada antarmuka GitHub Actions.
          Aplikasi tidak menyimpan token PAT atau secret privileged, dan tidak merekayasa status runner yang belum diverifikasi.
        </p>
      </section>
    </JournalShell>
  );
}
