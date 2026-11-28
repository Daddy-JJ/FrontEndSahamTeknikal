import Link from "next/link";
import type { IndexContributorItem } from "@/lib/screener-types";
import { formatPctID, formatPriceID } from "@/lib/format-id";

interface MarketContributorsProps {
  gainers: IndexContributorItem[];
  losers: IndexContributorItem[];
  methodology: string;
  constituentsWeighted?: number;
}

export function MarketContributors({
  gainers,
  losers,
  methodology,
  constituentsWeighted,
}: MarketContributorsProps) {
  return (
    <section className="st-card" aria-label="Penopang dan Pemberat IHSG">
      <div className="st-card-header">
        <div>
          <div className="st-eyebrow">INDEKS KONTRIBUSI</div>
          <h2 className="st-title-md">Penopang &amp; Pemberat IHSG</h2>
        </div>
        {constituentsWeighted ? (
          <span className="st-muted st-tabular">{constituentsWeighted} emiten berbobot</span>
        ) : null}
      </div>

      <div className="st-contrib-columns">
        <div>
          <div className="st-eyebrow" style={{ color: "var(--green)", marginBottom: "8px" }}>
            ▲ Penopang Terbesar
          </div>
          <div className="st-contrib-list">
            {gainers.slice(0, 8).map((item) => (
              <Link
                key={`gainer-${item.ticker}`}
                href={`/ticker/${item.ticker}`}
                className="st-contrib-row"
              >
                <div>
                  <strong style={{ color: "#f8fafc", fontSize: "13px" }}>{item.ticker}</strong>
                  <div className="st-muted" style={{ fontSize: "11px" }}>
                    {formatPriceID(item.close)} · {item.sector}
                  </div>
                </div>
                <div style={{ textAlign: "right" }} className="st-tabular">
                  <div className="st-pos" style={{ fontWeight: 700, fontSize: "13px" }}>
                    +{item.index_points.toFixed(2)} pts
                  </div>
                  <div className="st-muted" style={{ fontSize: "11px" }}>
                    {formatPctID(item.change_pct, true)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="st-eyebrow" style={{ color: "var(--red)", marginBottom: "8px" }}>
            ▼ Pemberat Terbesar
          </div>
          <div className="st-contrib-list">
            {losers.slice(0, 8).map((item) => (
              <Link
                key={`loser-${item.ticker}`}
                href={`/ticker/${item.ticker}`}
                className="st-contrib-row"
              >
                <div>
                  <strong style={{ color: "#f8fafc", fontSize: "13px" }}>{item.ticker}</strong>
                  <div className="st-muted" style={{ fontSize: "11px" }}>
                    {formatPriceID(item.close)} · {item.sector}
                  </div>
                </div>
                <div style={{ textAlign: "right" }} className="st-tabular">
                  <div className="st-neg" style={{ fontWeight: 700, fontSize: "13px" }}>
                    {item.index_points.toFixed(2)} pts
                  </div>
                  <div className="st-muted" style={{ fontSize: "11px" }}>
                    {formatPctID(item.change_pct, true)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="st-muted" style={{ margin: "12px 0 0", lineHeight: 1.45 }}>
        Klik ticker untuk membuka detail teknikal &amp; smart money. Metodologi: {methodology}
      </p>
    </section>
  );
}
