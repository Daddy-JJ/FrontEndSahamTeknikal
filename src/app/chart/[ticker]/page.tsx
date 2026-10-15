import { ChartPanel } from "@/components/chart-panel";
import { JournalShell } from "@/components/journal-shell";
import { chartPageRequest } from "@/lib/chart-navigation";
import { journalOwner } from "@/lib/journal-server";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ticker } = await params;
  const values = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.set(key, value);
  }
  const parsed = chartPageRequest(ticker, query);
  const owner = await journalOwner();
  return (
    <JournalShell mode={owner.kind === "ready" ? owner.mode : null}>
      <Link prefetch={false} scroll={false} href={parsed?.returnTo ?? '/scanner'}>← Kembali ke daftar asal</Link>
      <h1>Chart emiten</h1>
      {!parsed ? (
        <p role="alert">Filter atau konteks chart tidak valid.</p>
      ) : owner.kind === "ready" ? (
        <ChartPanel key={owner.ownerId} request={parsed.request} mode={owner.mode} initiallyOpen returnTo={parsed.returnTo} initialIndicators={parsed.initialIndicators} />
      ) : (
        <div role="alert">
          <p>
            {owner.kind === "unauthenticated"
              ? "Masuk untuk membaca chart."
              : owner.kind === "forbidden"
                ? "Akun tidak memiliki akses."
                : "Konfigurasi backend chart belum siap."}
          </p>
          {owner.kind === "unauthenticated" && (
            <Link
              href={`/login?next=${encodeURIComponent(`/chart/${ticker}?${query.toString()}`)}`}
            >
              Masuk
            </Link>
          )}
        </div>
      )}
    </JournalShell>
  );
}
