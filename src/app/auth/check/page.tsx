import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";
import {
  DEV_FIXTURE_NAMESPACE,
  DEV_OWNER_ACTION_REQUEST_ID,
  DEV_PROJECT_URL,
} from "@/lib/supabase/dev-probe";
import { readDevRevisionProbe, type RevisionProbe } from "@/lib/supabase/dev-revision-probe";
import { signOut, verifyDevOwnerAction } from "./actions";
import { JournalShell } from "@/components/journal-shell";

export const dynamic = "force-dynamic";

export default async function AuthCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ probe?: string }>;
}) {
  if (!publicSupabaseConfig()) redirect("/login");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: membership, error: memberError } = await supabase
    .from("app_members")
    .select("role,enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  const owner = !memberError && membership?.role === "owner" && membership.enabled === true;
  const isDevProject = process.env.NEXT_PUBLIC_SUPABASE_URL === DEV_PROJECT_URL;

  let runCount: number | null = null;
  let signalCount: number | null = null;
  let readError = false;
  let devFixtureMode = false;
  let actionExists = false;
  let actionVerified = false;
  let revisionProbe: RevisionProbe | null = null;
  if (owner && isDevProject) {
    const [runs, signals, settings, firstSignal] = await Promise.all([
      supabase.from("scan_runs").select("id", { count: "exact", head: true }).eq("namespace", DEV_FIXTURE_NAMESPACE),
      supabase.from("signals").select("id", { count: "exact", head: true }).eq("namespace", DEV_FIXTURE_NAMESPACE),
      supabase.from("deployment_settings").select("data_mode").eq("singleton", true).single(),
      supabase.from("signals").select("id").eq("namespace", DEV_FIXTURE_NAMESPACE).order("id", { ascending: true }).limit(1).maybeSingle(),
    ]);
    readError = Boolean(runs.error || signals.error || settings.error || firstSignal.error);
    runCount = runs.count;
    signalCount = signals.count;
    devFixtureMode = settings.data?.data_mode === "fixture";
    if (devFixtureMode) revisionProbe = await readDevRevisionProbe(supabase);

    if (firstSignal.data?.id) {
      const [action, request, audit] = await Promise.all([
        supabase.from("signal_actions").select("action,revision").eq("owner_id", user.id).eq("signal_id", firstSignal.data.id).maybeSingle(),
        supabase.from("signal_action_requests").select("request_id").eq("owner_id", user.id).eq("request_id", DEV_OWNER_ACTION_REQUEST_ID).maybeSingle(),
        supabase.from("audit_events").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("entity_id", firstSignal.data.id).eq("action", "signal_action_set"),
      ]);
      readError ||= Boolean(action.error || request.error || audit.error);
      actionExists = Boolean(action.data);
      actionVerified = !readError && action.data?.action === "watchlist"
        && action.data.revision === 1 && request.data?.request_id === DEV_OWNER_ACTION_REQUEST_ID
        && audit.count === 1;
    }
  }

  const probe = (await searchParams).probe;
  return <JournalShell mode={null} activePage="account" showMode={false}><main className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · VERIFIKASI AKSES</span>
    <h1>{owner ? "Sesi owner terverifikasi" : "Akun belum memiliki akses owner"}</h1>
    {owner
      ? <p>Identitas Supabase Auth cocok dengan keanggotaan owner yang aktif. Permintaan data berikut berjalan dengan JWT pengguna dan RLS.</p>
      : <p>{memberError ? "Pemeriksaan keanggotaan belum berhasil. Coba lagi nanti." : "Login GitHub berhasil, tetapi UID akun aplikasi ini belum tercatat sebagai owner pada app_members."}</p>}
    <div className="auth-facts">
      <div><span>UID akun aplikasi</span><strong>{user.id}</strong></div>
      <div><span>Keanggotaan</span><strong>{owner ? "Owner aktif" : "Belum terverifikasi"}</strong></div>
      {owner && isDevProject && <div><span>Data uji development</span><strong>{readError ? "Belum bisa dibaca" : String(runCount ?? 0) + " run · " + String(signalCount ?? 0) + " sinyal"}</strong></div>}
      {owner && isDevProject && actionVerified && <div><span>Uji RPC owner</span><strong>Watchlist revisi 1 · 1 request · 1 audit</strong></div>}
      {revisionProbe && <div><span>Uji baca revisi market</span><strong>
        {revisionProbe === "verified" ? "2 revisi fixture terbaca melalui RPC owner"
          : revisionProbe === "missing" ? "Fixture revisi belum tersedia" : "Pembacaan revisi belum berhasil"}
      </strong></div>}
    </div>
    {owner && isDevProject && <p className="auth-note">Angka run/sinyal di atas hanya berasal dari namespace fixture development. Dashboard live belum mengonsumsi data ini.</p>}
    {probe === "failed" && <p role="alert" className="auth-error">Uji aksi belum lulus. Tidak ada klaim idempotensi; periksa status data development.</p>}
    {probe === "unavailable" && <p role="alert" className="auth-error">Uji aksi hanya tersedia pada proyek development saat data_mode=fixture.</p>}
    {probe === "denied" && <p role="alert" className="auth-error">Akun ini tidak memiliki izin owner untuk aksi tersebut.</p>}
    {probe === "ok" && actionVerified && <p role="status" className="auth-success">RPC owner berhasil; pengulangan request mengembalikan hasil yang sama.</p>}
    {owner && isDevProject && devFixtureMode && !readError && signalCount === 2 && !actionExists && <form action={verifyDevOwnerAction}>
      <button type="submit" className="primary-button">Uji aksi owner pada fixture</button>
      <p className="auth-note">Menyimpan satu sinyal fixture sebagai watchlist, lalu mengulang request yang sama untuk menguji idempotensi. Tidak membuat trade atau fill.</p>
    </form>}
    {owner && isDevProject && actionExists && !actionVerified && <p className="auth-note">Sinyal fixture sudah memiliki aksi lain. Uji otomatis ditahan agar tidak menimpa data.</p>}
    <form action={signOut}><button type="submit" className="primary-button">Keluar</button></form>
    <p><Link href="/">Kembali ke beranda</Link></p>
  </main></JournalShell>;
}
