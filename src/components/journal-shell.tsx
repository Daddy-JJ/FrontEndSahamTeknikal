"use client";

import "@/app/dashboard.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  activePage?: "dashboard" | "sector" | "ticker" | "broker-flow" | "calendar";
  showMode?: boolean;
}) {
  const router = useRouter();
  const [tickerInput, setTickerInput] = useState("");

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tickerInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleaned) return;
    setTickerInput("");
    router.push(`/ticker/${cleaned}`);
  };

  return (
    <div className={variant === "terminal" ? "scanner-terminal-shell" : "journal-shell"}>
      <header className="journal-topbar">
        <div className="journal-topbar-inner">
          <Link className="journal-brand" href="/">
            SahamTeknikal <span>IDX Command Center</span>
          </Link>
          <nav aria-label="Navigasi utama" className="journal-nav">
            <Link
              aria-current={activePage === "dashboard" ? "page" : undefined}
              href="/"
              prefetch={false}
            >
              Dashboard
            </Link>
            <Link href="/#screener" prefetch={false}>
              Screener &amp; Win Rate
            </Link>
            <Link
              aria-current={activePage === "broker-flow" ? "page" : undefined}
              href="/broker-flow"
              prefetch={false}
            >
              Broker Flow
            </Link>
            <Link
              aria-current={activePage === "calendar" ? "page" : undefined}
              href="/calendar"
              prefetch={false}
            >
              Calendar
            </Link>
          </nav>
          <form className="st-nav-search" onSubmit={handleJump} role="search" aria-label="Cari emiten IDX">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              placeholder="Cari emiten (BBCA)..."
              maxLength={10}
              aria-label="Kode saham IDX"
              className="st-nav-search-input"
            />
            <button type="submit" className="st-nav-search-btn">
              Buka
            </button>
          </form>
        </div>
      </header>
      <main className="journal-main">
        {showMode && mode === "fixture" ? (
          <div className="mode-banner mode-banner-fixture" role="status">
            <strong>Data Mode: Fixture (Offline Preview)</strong> — Konfigurasikan Supabase live untuk data pasar real-time.
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
