import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { TickerDetailClient } from "@/components/ticker-detail-client";
import { resolveTickerTabKey } from "@/components/ticker-tabs/types";
import { getTickerIntelligence } from "@/lib/ticker-intelligence";

export const dynamic = "force-dynamic";

export default async function TickerPage(context: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { ticker } = await context.params;
  const sp = await context.searchParams;
  const initialTab = resolveTickerTabKey(sp?.tab);
  const intel = await getTickerIntelligence(ticker);

  return (
    <JournalShell mode="live" activePage="ticker" showMode={false}>
      {intel ? (
        <TickerDetailClient data={intel} initialTab={initialTab} />
      ) : (
        <div className="st-page">
          <div className="st-card">
            <div className="st-eyebrow">EMITEN TIDAK DITEMUKAN</div>
            <h1 className="st-title-xl" style={{ marginTop: "6px" }}>
              Data untuk &ldquo;{ticker.toUpperCase()}&rdquo; tidak tersedia
            </h1>
            <p className="st-muted" style={{ marginTop: "8px" }}>
              Pastikan kode emiten IDX valid (misal BBCA, BBRI, BREN, TLKM, BUMI).{" "}
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
