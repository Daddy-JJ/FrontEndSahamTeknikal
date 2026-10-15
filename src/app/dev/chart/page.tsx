import { notFound } from "next/navigation";
import { ChartFixturePreview } from "@/components/chart-fixture-preview";
import { JournalShell } from "@/components/journal-shell";
export const dynamic = "force-dynamic";
export default async function ChartPreview({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.DATA_MODE === "live"
  )
    notFound();
  const { scenario } = await searchParams;
  return (
    <JournalShell mode="fixture">
      <h1>Chart component — fixture development</h1>
      <p>Isolated component preview; no production market evidence.</p>
      <ChartFixturePreview scenario={scenario ?? "ready"} />
    </JournalShell>
  );
}
