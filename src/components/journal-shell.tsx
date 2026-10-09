import Link from "next/link";

export function JournalShell({mode,children,variant="default",activePage,showMode=true}:{
  mode:"fixture"|"live"|null; children:React.ReactNode; variant?:"default"|"terminal"; activePage?:"scanner"|"journal"|"analytics"|"operations"|"account"; showMode?:boolean;
}) {
  const content = <>
    <header className="journal-nav">
      <div className="journal-nav-inner">
        <Link className="journal-brand" href="/">IDX <span>Night Scanner</span></Link>
        <nav aria-label="Navigasi utama">
          <Link aria-current={activePage === "scanner" ? "page" : undefined} href="/scanner" prefetch={false}>Scanner</Link>
          <Link aria-current={activePage === "journal" ? "page" : undefined} href="/journal">Jurnal</Link>
          <Link aria-current={activePage === "analytics" ? "page" : undefined} href="/analytics">Analytics</Link>
          <Link aria-current={activePage === "operations" ? "page" : undefined} href="/operations">Operasi</Link>
          <Link aria-current={activePage === "account" ? "page" : undefined} href="/auth/check">Akun</Link>
        </nav>
        {showMode && <span className={"badge "+(mode==="fixture"?"amber":mode==="live"?"green":"neutral")}>
          {mode==="fixture"?"FIXTURE DEV":mode==="live"?"LIVE":"BELUM TERHUBUNG"}
        </span>}
      </div>
    </header>
    <main className="journal-main">{children}</main>
  </>;
  return <div className={variant === "terminal" ? "scanner-terminal-shell" : "scanner-terminal-shell site-terminal-shell"}>{content}</div>;
}
