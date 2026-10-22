import Link from "next/link";
import { GithubLoginButton } from "@/app/login/github-login-button";
import { JournalShell } from "@/components/journal-shell";
import { PasswordAuthForm } from "@/components/password-auth-form";
import { passwordAuthConfig } from "@/lib/password-auth-server";
import { publicSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function RecoverPasswordPage() {
  const configured = Boolean(publicSupabaseConfig());
  const config = passwordAuthConfig();
  return <JournalShell mode={null} showMode={false}><section className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · PEMULIHAN AKSES</span>
    <h1>Lupa password?</h1>
    {configured && config?.recoveryEnabled ? <>
      <p>Masukkan username. Jika akun dapat dipulihkan, tautan dikirim ke email yang sudah terdaftar.</p>
      <PasswordAuthForm intent="recover" username="daddyjj" />
    </> : <p role="status">Pemulihan password melalui email belum tersedia. Gunakan GitHub untuk masuk, kemudian periksa pengaturan password di halaman Akun.</p>}
    {configured && <>
      <hr className="password-auth-divider" />
      <GithubLoginButton />
    </>}
    <p><Link href="/login">Kembali ke login</Link></p>
  </section></JournalShell>;
}
