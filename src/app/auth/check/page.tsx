import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AuthCheckPage() {
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
  const isDevProject = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://vgmkpsestahkfahzdtae.supabase.co";

  let runCount: number | null = null;
  let signalCount: number | null = null;
  let readError = false;
  if (owner && isDevProject) {
    const [runs, signals] = await Promise.all([
      supabase.from("scan_runs").select("id", { count: "exact", head: true }).eq("namespace", "dev_smoke_m2"),
      supabase.from("signals").select("id", { count: "exact", head: true }).eq("namespace", "dev_smoke_m2"),
    ]);
    readError = Boolean(runs.error || signals.error);
    runCount = runs.count;
    signalCount = signals.count;
  }

  return <main className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · VERIFIKASI AKSES</span>
    <h1>{owner ? "Sesi owner terverifikasi" : "Akun belum memiliki akses owner"}</h1>
    {owner
      ? <p>Identitas Supabase Auth cocok dengan keanggotaan owner yang aktif. Permintaan data berikut berjalan dengan JWT pengguna dan RLS.</p>
      : <p>{memberError ? "Pemeriksaan keanggotaan belum berhasil. Coba lagi nanti." : "Login GitHub berhasil, tetapi UID akun aplikasi ini belum tercatat sebagai owner pada app_members."}</p>}
    <div className="auth-facts">
      <div><span>UID akun aplikasi</span><strong>{user.id}</strong></div>
      <div><span>Keanggotaan</span><strong>{owner ? "Owner aktif" : "Belum terverifikasi"}</strong></div>
      {owner && isDevProject && <div><span>Data uji development</span><strong>{readError ? "Belum bisa dibaca" : String(runCount ?? 0) + " run · " + String(signalCount ?? 0) + " sinyal"}</strong></div>}
    </div>
    {owner && isDevProject && <p className="auth-note">Angka run/sinyal di atas hanya berasal dari namespace fixture development. Dashboard live belum mengonsumsi data ini.</p>}
    <form action={signOut}><button type="submit" className="primary-button">Keluar</button></form>
    <p><Link href="/">Kembali ke beranda</Link></p>
  </main>;
}
