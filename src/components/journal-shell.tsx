import Link from "next/link";

export function JournalShell({mode,children,variant="default"}:{
  mode:"fixture"|"live"|null; children:React.ReactNode; variant?:"default"|"terminal";
}) {
  const content = <>
    <header className="journal-nav">
      <div className="journal-nav-inner">
        <Link className="journal-brand" href="/">IDX <span>Night Scanner</span></Link>
        <nav aria-label="Navigasi jurnal">
          <Link href="/scanner" prefetch={false}>Scanner</Link>
          <Link href="/journal">Jurnal aktual</Link>
          <Link href="/analytics">Analytics</Link>
          <Link href="/operations">Operasi</Link>
          <Link href="/auth/check">Akun</Link>
        </nav>
        <span className={"badge "+(mode==="fixture"?"amber":mode==="live"?"green":"neutral")}>
          {mode==="fixture"?"FIXTURE DEV":mode==="live"?"LIVE":"BELUM TERHUBUNG"}
        </span>
      </div>
    </header>
    <main className="journal-main">{children}</main>
  </>;
  return variant === "terminal" ? <div className="scanner-terminal-shell">{content}</div> : content;
}
