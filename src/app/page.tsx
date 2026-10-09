import Link from "next/link";
import { Workspace } from "@/features/workspace";
import data from "@/generated/demo.json";
import type { Snapshot } from "@/lib/types";
import { publicSupabaseConfig } from "@/lib/supabase/server";
import { appDataMode, fixturePreviewAllowed } from "@/lib/data-mode";
import { ScannerDashboard } from "@/components/scanner-dashboard";
import { JournalShell } from "@/components/journal-shell";

export default function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (appDataMode() === "live") return <ScannerDashboard searchParams={searchParams} />;
  if (appDataMode() !== "fixture" || !fixturePreviewAllowed()) {
    const loginReady = Boolean(publicSupabaseConfig());
    return (
      <JournalShell mode={null} showMode={false}>
        <section className="configuration-page terminal-system-panel" aria-labelledby="configuration-title">
          <span className="eyebrow">IDX NIGHT SCANNER</span>
          <h1 id="configuration-title">Pemindaian live sedang disiapkan.</h1>
          <p style={{ marginTop: "12px" }}>Data pasar belum tersedia di dashboard. Status ini bukan hasil scan dan tidak memakai angka demo.</p>
          {loginReady ? (
            <div className="journal-actions">
              <Link className="primary-button" href="/login">Masuk sebagai pemilik</Link>
            </div>
          ) : (
            <p role="status" style={{ marginTop: "14px" }}>Akses pemilik belum tersedia.</p>
          )}
        </section>
      </JournalShell>
    );
  }
  if (data.data_mode !== "fixture" || data.schema_version !== "1.0.0") throw new Error("Invalid fixture contract");
  return <Workspace snapshot={data as unknown as Snapshot} />;
}
