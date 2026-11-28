import Link from "next/link";
import { JournalShell } from "@/components/journal-shell";
import { DashboardClient } from "@/components/dashboard-client";
import { computeWinRateStats, getLatestDashboard, querySignals } from "@/lib/screener-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dashboard, signalsPayload, winRatePayload] = await Promise.all([
    getLatestDashboard(),
    querySignals({ date: "latest", limit: 300 }),
    computeWinRateStats({ year: "2026", minSmartMoney: 0 }),
  ]);

  return (
    <JournalShell mode="live" activePage="dashboard" showMode={false}>
      {dashboard ? (
        <DashboardClient
          dashboard={dashboard}
          initialSignals={signalsPayload.rows}
          initialLatestDate={signalsPayload.latest_date}
          availableDates={signalsPayload.available_dates}
          initialWinRate={winRatePayload}
        />
      ) : (
        <div className="st-page">
          <div className="st-card">
            <div className="st-eyebrow">SAHAMTEKNIKAL COMMAND CENTER</div>
            <h1 className="st-title-xl" style={{ marginTop: "6px" }}>
              Sinkronisasi Data Pasar Belum Selesai
            </h1>
            <p className="st-muted" style={{ marginTop: "8px", fontSize: "13.5px" }}>
              Tabel dashboard di Supabase belum terisi. Jalankan pipeline backend <code>mcp_bulk_sync.py</code> atau buka halaman{" "}
              <Link href="/broker-flow" style={{ color: "var(--accent)" }}>
                Broker Flow
              </Link>{" "}
              untuk analisa bandarmologi langsung.
            </p>
          </div>
        </div>
      )}
    </JournalShell>
  );
}
