import Link from "next/link";

export default async function AuthErrorPage({searchParams}:{
  searchParams:Promise<{reason?:string}>;
}) {
  const logoutFailed=(await searchParams).reason==="logout";
  return <main className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · LOGIN</span>
    <h1>{logoutFailed?"Logout belum selesai":"Login belum selesai"}</h1>
    <p>{logoutFailed?"Sesi mungkin masih aktif. Periksa koneksi lalu coba keluar kembali dari halaman akun."
      :"Sesi tidak dapat dibuat. Periksa apakah GitHub provider dan URL redirect untuk environment ini sudah diatur, lalu coba lagi."}</p>
    <Link href={logoutFailed?"/auth/check":"/login"} className="primary-button">
      {logoutFailed?"Periksa sesi":"Coba kembali"}
    </Link>
  </main>;
}
