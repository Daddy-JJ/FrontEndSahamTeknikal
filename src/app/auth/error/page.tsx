import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";

export default async function AuthErrorPage({searchParams}:{
  searchParams:Promise<{reason?:string}>;
}) {
  const reason=(await searchParams).reason;
  const logoutFailed=reason==="logout";
  const loginMessage=reason==="verifier"
    ?"Cookie verifikasi login tidak ditemukan. Mulai kembali dari halaman login di browser dan alamat yang sama. Selesaikan satu proses login sebelum mencoba lagi."
    :reason==="callback"
      ?"Callback tidak membawa kode login. Mulai kembali dari halaman login; jangan membuka alamat callback secara langsung."
      :reason==="configuration"
        ?"Konfigurasi koneksi Auth belum tersedia pada server aplikasi. Periksa environment lalu mulai ulang aplikasi."
        :"Sesi tidak dapat dibuat. Mulai kembali dari halaman login. Jika tetap gagal, periksa koneksi server, GitHub provider, dan URL redirect untuk environment ini.";
  return <JournalShell mode={null} showMode={false}><main className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · LOGIN</span>
    <h1>{logoutFailed?"Logout belum selesai":"Login belum selesai"}</h1>
    <p>{logoutFailed?"Sesi mungkin masih aktif. Periksa koneksi lalu coba keluar kembali dari halaman akun."
      :loginMessage}</p>
    <Link href={logoutFailed?"/auth/check":"/login"} className="primary-button">
      {logoutFailed?"Periksa sesi":"Coba kembali"}
    </Link>
  </main></JournalShell>;
}
