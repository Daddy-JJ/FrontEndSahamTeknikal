import Link from "next/link";
import { Workspace } from "@/features/workspace";
import data from "@/generated/demo.json";
import type { Snapshot } from "@/lib/types";
import { publicSupabaseConfig } from "@/lib/supabase/server";

export default function Home() {
  const mode = process.env.DATA_MODE ?? (process.env.NODE_ENV === "development" ? "fixture" : "live");
  const fixtureAllowed = process.env.NODE_ENV === "development" || process.env.ALLOW_FIXTURE_PREVIEW === "true";
  if (mode !== "fixture" || !fixtureAllowed) {
    const loginReady = Boolean(publicSupabaseConfig());
    return <main className="configuration-page"><span className="eyebrow">IDX NIGHT SCANNER</span><h1>Pemindaian live sedang disiapkan.</h1>
      <p>Data pasar belum tersedia di dashboard. Status ini bukan hasil scan dan tidak memakai angka demo.</p>
      {loginReady ? <Link className="primary-button" href="/login">Masuk sebagai pemilik</Link> : <p role="status">Akses pemilik belum tersedia.</p>}
    </main>;
  }
  if (data.data_mode !== "fixture" || data.schema_version !== "1.0.0") throw new Error("Invalid fixture contract");
  return <Workspace snapshot={data as unknown as Snapshot} />;
}
