import Link from "next/link";
import type { SectorHeatmapItem } from "@/lib/screener-types";
import { formatPctID, formatRupiahCompact } from "@/lib/format-id";

function getTileTone(chg: number): string {
  if (chg >= 1.0) return "st-sector-pos-strong";
  if (chg >= 0) return "st-sector-pos-mild";
  if (chg <= -1.0) return "st-sector-neg-strong";
  return "st-sector-neg-mild";
}

export function SectorHeatmap({ sectors }: { sectors: SectorHeatmapItem[] }) {
  return (
    <section className="st-card" aria-label="Peta Sektor IDX">
      <div className="st-card-header">
        <div>
          <div className="st-eyebrow">11 SEKTOR BURSA EFEK INDONESIA</div>
          <h2 className="st-title-md">Sector Heatmap — Klik Sektor untuk Detail Lengkap</h2>
        </div>
        <span className="st-muted">{sectors.length} sektor terindeks</span>
      </div>

      <div className="st-sector-grid">
        {sectors.map((sec) => {
          const isUp = sec.weighted_change_pct >= 0;
          return (
            <Link
              key={sec.slug}
              href={`/sector/${sec.slug}`}
              className={`st-sector-tile ${getTileTone(sec.weighted_change_pct)}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <strong style={{ fontSize: "12.5px", color: "#f8fafc", textTransform: "uppercase" }}>
                  {sec.sector}
                </strong>
                <span className={`st-tabular ${isUp ? "st-pos" : "st-neg"}`} style={{ fontWeight: 800, fontSize: "13px" }}>
                  {isUp ? "▲" : "▼"} {formatPctID(sec.weighted_change_pct, true)}
                </span>
              </div>

              <div className="st-muted st-tabular" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>{sec.stocks_count} saham</span>
                <span>
                  +{sec.gainers} / -{sec.losers}
                </span>
              </div>

              <div className="st-muted st-tabular" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>Valuasi:</span>
                <span>{formatRupiahCompact(sec.total_turnover)}</span>
              </div>

              <div className="st-muted st-tabular" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>Smart Flow:</span>
                <span className={sec.smart_money_net >= 0 ? "st-pos" : "st-neg"}>
                  {formatRupiahCompact(sec.smart_money_net, true)}
                </span>
              </div>

              <div className="st-muted st-tabular" style={{ fontSize: "10.5px", borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: "6px", marginTop: "2px" }}>
                Top: <strong style={{ color: "var(--green)" }}>{sec.top_gainer.ticker}</strong>{" "}
                ({formatPctID(sec.top_gainer.change_pct, true)}) ·{" "}
                <strong style={{ color: "var(--red)" }}>{sec.top_loser.ticker}</strong>{" "}
                ({formatPctID(sec.top_loser.change_pct, true)})
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
