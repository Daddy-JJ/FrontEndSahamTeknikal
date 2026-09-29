import Link from "next/link";

export default function AuthErrorPage() {
  return <main className="configuration-page auth-page">
    <span className="eyebrow">IDX NIGHT SCANNER · LOGIN</span>
    <h1>Login belum selesai</h1>
    <p>Sesi tidak dapat dibuat. Periksa apakah GitHub provider dan URL redirect proyek development sudah diatur, lalu coba lagi.</p>
    <Link href="/login" className="primary-button">Coba kembali</Link>
  </main>;
}
