import Link from "next/link";
import { Workspace } from "@/features/workspace";
import data from "@/generated/demo.json";
import type { Snapshot } from "@/lib/types";
import { publicSupabaseConfig } from "@/lib/supabase/server";
import { appDataMode, fixturePreviewAllowed } from "@/lib/data-mode";
import { ScannerDashboard } from "@/components/scanner-dashboard";

export default function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (appDataMode() === "live") return <ScannerDashboard searchParams={searchParams} />;
  if (appDataMode() !== "fixture" || !fixturePreviewAllowed()) {
    const loginReady = Boolean(publicSupabaseConfig());
    return <main className="configuration-page"><span className="eyebrow">IDX NIGHT SCANNER</span><h1>Pemindaian live sedang disiapkan.</h1>
      <p>Data pasar belum tersedia di dashboard. Status ini bukan hasil scan dan tidak memakai angka demo.</p>
      {loginReady ? <Link className="primary-button" href="/login">Masuk sebagai pemilik</Link> : <p role="status">Akses pemilik belum tersedia.</p>}
    </main>;
  }
  if (data.data_mode !== "fixture" || data.schema_version !== "1.0.0") throw new Error("Invalid fixture contract");
  return <Workspace snapshot={data as unknown as Snapshot} />;
}
