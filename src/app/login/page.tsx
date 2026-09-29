import Link from "next/link";
import { GithubLoginButton } from "./github-login-button";
import { publicSupabaseConfig } from "@/lib/supabase/server";

export default function LoginPage() {
  const ready = Boolean(publicSupabaseConfig());
  return <main className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · AKSES PEMILIK</span>
    <h1>Masuk ke ruang sinyal</h1>
    <p>Gunakan GitHub untuk masuk ke aplikasi. Akun GitHub yang membuka Dashboard Supabase tidak otomatis memiliki akses ke data scanner.</p>
    {ready ? <GithubLoginButton /> : <p role="status">Koneksi Supabase aplikasi belum dikonfigurasi. Isi URL proyek dan publishable key pada environment lokal.</p>}
    <p className="auth-note">Setelah login, aplikasi akan memeriksa keanggotaan owner melalui Row Level Security. Data pasar dan jurnal tetap tertutup untuk akun lain.</p>
    <Link href="/">Kembali ke beranda</Link>
  </main>;
}
