import Link from "next/link";
import { GithubLoginButton } from "@/app/login/github-login-button";
import { JournalShell } from "@/components/journal-shell";
import { PasswordAuthForm } from "@/components/password-auth-form";
import { passwordUpdateAccess } from "@/lib/password-auth-server";
import { publicSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const access = await passwordUpdateAccess("recovery");
  const configured = Boolean(publicSupabaseConfig());
  return <JournalShell mode={null} showMode={false}><section className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · PASSWORD BARU</span>
    <h1>Tetapkan password</h1>
    {access.ready ? <>
      <p>Gunakan password unik yang belum dipakai pada layanan lain. Setelah tersimpan, masuk kembali dengan username dan password baru.</p>
      <PasswordAuthForm intent="recovery" />
    </> : <>
      <p role="status">Tautan pemulihan tidak tersedia, sudah kedaluwarsa, atau sesi belum memenuhi verifikasi. Minta tautan baru atau masuk kembali melalui GitHub.</p>
      <p><Link href="/auth/password/recover">Minta tautan pemulihan</Link></p>
      {configured && <GithubLoginButton />}
    </>}
    <p><Link href="/login">Kembali ke login</Link></p>
  </section></JournalShell>;
}
