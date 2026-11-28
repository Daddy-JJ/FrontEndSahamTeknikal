import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";

export default function NotFound() {
  return (
    <JournalShell mode={null} showMode={false}>
      <section className="journal-panel terminal-system-panel" aria-labelledby="not-found-title">
        <span className="eyebrow">404 / HALAMAN TIDAK DITEMUKAN</span>
        <h1 id="not-found-title">Alamat ini belum tersedia.</h1>
        <p>Periksa alamat atau kembali ke Broker Flow.</p>
        <div className="journal-actions">
          <Link className="primary-button" href="/broker-flow">Kembali ke Broker Flow</Link>
        </div>
      </section>
    </JournalShell>
  );
}
