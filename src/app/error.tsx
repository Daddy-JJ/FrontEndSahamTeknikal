"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="scanner-terminal-shell site-terminal-shell"><header className="journal-nav"><div className="journal-nav-inner"><Link className="journal-brand" href="/">IDX <span>Night Scanner</span></Link><span className="badge amber">PERLU PEMULIHAN</span></div></header><main className="configuration-page terminal-error"><h1>Workspace belum dapat dimuat.</h1><p role="alert">Kesalahan ini tidak berarti tidak ada sinyal.</p><div className="journal-actions"><button className="primary-button" onClick={reset}>Coba lagi</button><Link className="secondary-link" href="/">Kembali ke Scanner</Link></div></main></div>;
}
