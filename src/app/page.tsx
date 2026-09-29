import Link from "next/link";
import { Workspace } from "@/features/workspace";
import data from "@/generated/demo.json";
import type { Snapshot } from "@/lib/types";

export default function Home() {
  const mode = process.env.DATA_MODE ?? (process.env.NODE_ENV === "development" ? "fixture" : "live");
  const fixtureAllowed = process.env.NODE_ENV === "development" || process.env.ALLOW_FIXTURE_PREVIEW === "true";
  if (mode !== "fixture" || !fixtureAllowed) {
    return <main className="configuration-page"><span className="eyebrow">IDX NIGHT SCANNER</span><h1>Koneksi live belum dikonfigurasi.</h1>
      <p>Dashboard live belum terhubung ke data scan. Login owner tersedia untuk menguji sesi dan akses RLS tanpa memakai data demo sebagai fallback.</p>
      <Link className="primary-button" href="/login">Masuk dengan GitHub</Link>
      <p>Untuk preview development lokal, gunakan DATA_MODE=fixture dan ALLOW_FIXTURE_PREVIEW=true pada environment development.</p></main>;
  }
  if (data.data_mode !== "fixture" || data.schema_version !== "1.0.0") throw new Error("Invalid fixture contract");
  return <Workspace snapshot={data as unknown as Snapshot} />;
}
