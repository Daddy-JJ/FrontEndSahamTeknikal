import Link from "next/link";
import { Suspense } from "react";
import { ChartReturnPosition } from "./chart-return-position";
import { ReportingChartOverlay } from "./chart-overlay";

export function JournalShell({mode,children,variant="default",activePage,showMode=true,reporting=false,chartOwnerId}:{
  mode:"fixture"|"live"|null; children:React.ReactNode; variant?:"default"|"terminal"; activePage?:"scanner"|"journal"|"analytics"|"operations"|"account"; showMode?:boolean; reporting?:boolean;
  chartOwnerId?: string;
}) {
  const content = <>
    {/* A loading shell hides its mode; it is not evidence of an expired owner session. */}
    {showMode && <Suspense fallback={null}><ChartReturnPosition mode={mode} /></Suspense>}
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
          {mode==="fixture"?"FIXTURE DEV":mode==="live"?"MODE PRODUKSI":"BELUM TERHUBUNG"}
        </span>}
      </div>
    </header>
    <main className={"journal-main" + (reporting ? " journal-reporting-page" : "")}>{children}</main>
  </>;
  return <div className={variant === "terminal" ? "scanner-terminal-shell" : "scanner-terminal-shell site-terminal-shell"}>
    {reporting && mode && chartOwnerId ? <Suspense fallback={null}><ReportingChartOverlay mode={mode} ownerId={chartOwnerId}>{content}</ReportingChartOverlay></Suspense> : content}
  </div>;
}
