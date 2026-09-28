"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="configuration-page"><h1>Workspace belum dapat dimuat.</h1><p>Kesalahan ini tidak berarti tidak ada sinyal.</p><button onClick={reset}>Coba lagi</button></main>;
}
