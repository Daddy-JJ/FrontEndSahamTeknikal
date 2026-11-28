import type { MarketRegime, SmartMoneyLabel, StockRegime, StockRegimeAction } from "@/lib/screener-types";

export function formatPriceID(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPctID(value: number | null | undefined, signed = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

export function formatRupiahCompact(value: number | null | undefined, signed = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";
  if (abs >= 1e12) {
    return `${sign}Rp ${(abs / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 2 })} T`;
  }
  if (abs >= 1e9) {
    return `${sign}Rp ${(abs / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  }
  if (abs >= 1e6) {
    return `${sign}Rp ${(abs / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  }
  return `${sign}Rp ${Math.round(abs).toLocaleString("id-ID")}`;
}

export function formatVolumeCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(abs / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (abs >= 1e6) return `${(abs / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  if (abs >= 1e3) return `${(abs / 1e3).toLocaleString("id-ID", { maximumFractionDigits: 0 })} Rb`;
  return Math.round(abs).toLocaleString("id-ID");
}

export function marketRegimeMeta(regime: MarketRegime): { cls: string; text: string } {
  if (regime === "BULL") return { cls: "st-badge-bull", text: "▲ BULL · RISK ON" };
  if (regime === "BEAR") return { cls: "st-badge-bear", text: "▼ BEAR · DEFENSIF" };
  return { cls: "st-badge-neutral", text: "◆ NEUTRAL · SELEKTIF" };
}

export function stockRegimeMeta(regime: StockRegime, action?: StockRegimeAction): { cls: string; text: string } {
  if (regime === "MARKUP") return { cls: "st-badge-markup", text: `▲ MARKUP · ${action || "BUY"}` };
  if (regime === "MARKDOWN") return { cls: "st-badge-markdown", text: `▼ MARKDOWN · ${action || "SELL / AVOID"}` };
  return { cls: "st-badge-consolidating", text: `◆ CONSOLIDATING · ${action || "TUNGGU BREAKOUT"}` };
}

export function smartMoneyMeta(score: number, label?: SmartMoneyLabel): { cls: string; text: string } {
  if (score >= 3) return { cls: "st-badge-strong", text: `3/3 · ${label || "STRONG CONFIRMATION"}` };
  if (score === 2) return { cls: "st-badge-confirmed", text: `2/3 · ${label || "CONFIRMED"}` };
  if (score === 1) return { cls: "st-badge-partial", text: `1/3 · ${label || "PARTIAL"}` };
  return { cls: "st-badge-none", text: `0/3 · ${label || "NOT CONFIRMED"}` };
}
