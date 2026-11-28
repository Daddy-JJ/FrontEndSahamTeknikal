import Link from "next/link";

export function JournalShell({
  mode,
  children,
  variant = "default",
  activePage,
  showMode = true,
}: {
  mode: "fixture" | "live" | null;
  children: React.ReactNode;
  variant?: "default" | "terminal";
  activePage?: "broker-flow";
  showMode?: boolean;
}) {
  return (
    <div className={variant === "terminal" ? "scanner-terminal-shell" : "scanner-terminal-shell site-terminal-shell"}>
      <header className="journal-nav">
        <div className="journal-nav-inner">
          <Link className="journal-brand" href="/broker-flow">
            SahamTeknikal <span>Broker Flow</span>
          </Link>
          <nav aria-label="Navigasi utama">
            <Link aria-current={activePage === "broker-flow" ? "page" : undefined} href="/broker-flow" prefetch={false}>
              Broker Flow
            </Link>
          </nav>
          {showMode && (
            <span className={"badge " + (mode === "fixture" ? "amber" : mode === "live" ? "green" : "neutral")}>
              {mode === "fixture" ? "FIXTURE DEV" : mode === "live" ? "MODE PRODUKSI" : "BELUM TERHUBUNG"}
            </span>
          )}
        </div>
      </header>
      <main className="journal-main">{children}</main>
    </div>
  );
}
