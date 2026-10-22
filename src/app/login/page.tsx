import Link from "next/link";
import { GithubLoginButton } from "./github-login-button";
import { publicSupabaseConfig } from "@/lib/supabase/server";
import { JournalShell } from "@/components/journal-shell";
import { PasswordAuthForm } from "@/components/password-auth-form";
import { passwordAuthConfig } from "@/lib/password-auth-server";
import { safePasswordReturn } from "@/lib/password-auth-policy";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string; password?: string }>;
}) {
  const ready = Boolean(publicSupabaseConfig());
  const config = passwordAuthConfig();
  const params = await searchParams;
  return <JournalShell mode={null} showMode={false}><section className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · AKSES PEMILIK</span>
    <h1>Masuk ke ruang sinyal</h1>
    <p>{config ? "Masuk dengan username dan password Anda. GitHub tetap tersedia sebagai pilihan login."
      : "Gunakan GitHub untuk masuk. Login dengan username dan password belum tersedia pada environment ini."}</p>
    {params.password === "updated" && <p role="status" className="auth-success">Password tersimpan. Masuk kembali dengan username dan password baru.</p>}
    {config && <>
      <PasswordAuthForm intent="login" username={config.username} returnTo={safePasswordReturn(params.returnTo)} />
      <p><Link href="/auth/password/recover">Lupa password?</Link></p>
      <hr className="password-auth-divider" />
    </>}
    {ready ? <GithubLoginButton /> : <p role="status">Akses pemilik belum tersedia. Konfigurasi aplikasi sedang disiapkan.</p>}
    <p className="auth-note">Setelah login, aplikasi akan memeriksa keanggotaan owner melalui Row Level Security. Data pasar dan jurnal tetap tertutup untuk akun lain.</p>
    <Link href="/">Kembali ke beranda</Link>
  </section></JournalShell>;
}
