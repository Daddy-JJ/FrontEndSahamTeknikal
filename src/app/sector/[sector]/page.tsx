import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { SectorDetailClient } from "@/components/sector-detail-client";
import { getSectorSnapshot } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export default async function SectorPage(context: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await context.params;
  const { snapshot, allSectors } = await getSectorSnapshot(sector);

  return (
    <JournalShell mode="live" activePage="sector" showMode={false}>
      {snapshot ? (
        <SectorDetailClient snapshot={snapshot} allSectors={allSectors} />
      ) : (
        <div className="st-page">
          <div className="st-card">
            <div className="st-eyebrow">SEKTOR TIDAK DITEMUKAN</div>
            <h1 className="st-title-xl" style={{ marginTop: "6px" }}>
              Sektor &ldquo;{sector}&rdquo; belum terindeks
            </h1>
            <p className="st-muted" style={{ marginTop: "8px" }}>
              <Link href="/" style={{ color: "var(--accent)" }}>
                ← Kembali ke Dashboard Utama
              </Link>
            </p>
          </div>
        </div>
      )}
    </JournalShell>
  );
}
