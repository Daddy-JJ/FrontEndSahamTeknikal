import { JournalShell } from "@/components/journal-shell";

export default function Loading() {
  return (
    <JournalShell mode={null} showMode={false}>
      <main className="configuration-page terminal-loading" aria-busy="true" aria-label="Memuat Broker Flow">
        <div className="skeleton" />
        <div className="skeleton" />
        <p>Menyiapkan Broker Flow…</p>
      </main>
    </JournalShell>
  );
}
