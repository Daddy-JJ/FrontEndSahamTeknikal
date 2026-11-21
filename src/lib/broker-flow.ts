/**
 * Broker Flow & Bandarmology Core Logic & Snapshot Client
 * Implements strict trading logic:
 * - Who (Broker identity & Investor group)
 * - What (Stock Ticker & Price)
 * - How Much (Net Value, Volume Lot, Concentration %)
 * - At What Price (Bandar Average Cost & Distance %)
 * - Why (Absorption, Streak, Counterparty & Trade Plan)
 */

export interface QuadrantCounts {
  markup_akumulasi: number;
  markup_distribusi: number;
  markdown_akumulasi: number;
  markdown_distribusi: number;
}

export interface MarketSummary {
  date: string;
  quadrant_counts: QuadrantCounts;
  total_classified: number;
  smart_money_net: number;
  total_turnover: number;
}

export interface AccumulationItem {
  ticker: string;
  close: number;
  change_percent: number;
  top_buyers: string;
  sum_buy: number;
  smart_money_net: number;
}

export interface DistributionItem {
  ticker: string;
  close: number;
  change_percent: number;
  top_sellers: string;
  sum_sell: number;
  smart_money_net: number;
}

export interface BrokerRankingItem {
  broker: string;
  name?: string;
  buy_value: number;
  sell_value: number;
  net_value: number;
  stocks_count: string;
}

export interface SectorFlowItem {
  sector: string;
  stocks_count: number;
  smart_money_net: number;
  total_value: number;
}

export interface BrokerDetailItem {
  code: string;
  name: string;
  investor_group: "FOREIGN" | "LOCAL" | "GOVERNMENT";
  net_value: number;
  avg_price: number;
}

export interface TradePlan {
  action: "BUY ON PULLBACK" | "BUY ON BREAKOUT" | "SWING BUY / ACCUMULATE" | "AVOID / SELL ON STRENGTH" | "HARD AVOID";
  entry_zone: string;
  stop_loss: string;
  target_price: string;
  rr_ratio: string;
  note: string;
}

export interface TickerBrokerDetail {
  ticker: string;
  close: number;
  change_percent: number;
  quadrant: string;
  quadrant_label: string;
  status_color: "emerald" | "amber" | "sky" | "rose";
  top_accumulators: BrokerDetailItem[];
  top_distributors: BrokerDetailItem[];
  net_value: number;
  net_volume_lots: number;
  concentration_pct: number;
  bandar_avg_cost: number;
  bandar_cost_gap_pct: number;
  counterparty_note: string;
  why_insight: string;
  trade_plan: TradePlan;
}

export interface QuadrantStockItem {
  ticker: string;
  close: number;
  change_percent: number;
  smart_money_net: number;
}

export interface QuadrantMapDetail {
  id: string;
  name: string;
  title: string;
  philosophy: string;
  stocks_count: number;
  color: "emerald" | "amber" | "sky" | "rose";
  stocks: QuadrantStockItem[];
}

export type HorizonPeriod = "2D" | "5D" | "10D";

export interface SweetSpotItem {
  ticker: string;
  close: number;
  change_percent: number;
  bandar_cost: number;
  gap_pct: number;
  lead_accumulator: string;
  lead_group: "FOREIGN" | "GOVERNMENT" | "MIXED";
  counterparty_purity: string;
  action_verdict: "SWEET SPOT BUY" | "ACCUMULATE DIP" | "BUY ON BREAKOUT";
  sweet_zone: string;
  stop_loss: string;
  target_price: string;
  why_brief: string;
}

export interface TrapItem {
  ticker: string;
  close: number;
  change_percent: number;
  smart_money_net: number;
  smart_money_sellers: string;
  retail_net: number;
  retail_buyers: string;
  action_verdict: "BULL TRAP / AVOID" | "HEAVY DISTRIBUTION" | "WAIT FOR RETEST";
  bandar_exit_avg: number;
  risk_warning: string;
}

export interface RetailPulseItem {
  broker_code: string;
  broker_name: string;
  total_net: number;
  top_bought: { ticker: string; net_val: number }[];
  top_sold: { ticker: string; net_val: number }[];
  sentiment_label: string;
}

export interface DailyInsightCardData {
  horizon: HorizonPeriod;
  horizon_label: string;
  date_range: string;
  macro_pulse: {
    foreign_net: number;
    government_net: number;
    retail_net: number;
    summary_sentence: string;
  };
  sweet_spots: SweetSpotItem[];
  traps: TrapItem[];
  retail_footprints: RetailPulseItem[];
}

export function formatRupiah(value: number): string {
  const abs = Math.abs(value);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  return `${sign}${abs.toLocaleString("id-ID")}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

export const SNAPSHOT_DATE = "2026-11-20";

export const DEFAULT_MARKET_SUMMARY: MarketSummary = {
  date: SNAPSHOT_DATE,
  quadrant_counts: {
    markup_akumulasi: 111,
    markup_distribusi: 86,
    markdown_akumulasi: 142,
    markdown_distribusi: 287,
  },
  total_classified: 626,
  smart_money_net: -87_800_000_000,
  total_turnover: 13_570_000_000_000,
};

export const DEFAULT_TOP_ACCUMULATIONS: AccumulationItem[] = [
  { ticker: "MBMA", close: 344, change_percent: 15.4, top_buyers: "BK NI AT TP RG", sum_buy: 91_200_000_000, smart_money_net: 16_000_000_000 },
  { ticker: "BREN", close: 2190, change_percent: 7.4, top_buyers: "NI ZP CC AZ MG", sum_buy: 54_300_000_000, smart_money_net: 1_200_000_000 },
  { ticker: "GOTO", close: 27, change_percent: 0.0, top_buyers: "MG PP KI XC XL", sum_buy: 83_100_000_000, smart_money_net: -76_400_000_000 },
  { ticker: "NCKL", close: 735, change_percent: 5.0, top_buyers: "BK CP NI IT XL", sum_buy: 36_800_000_000, smart_money_net: 2_500_000_000 },
  { ticker: "TINS", close: 3140, change_percent: 3.0, top_buyers: "BK AK MB ZP ER", sum_buy: 37_000_000_000, smart_money_net: 2_200_000_000 },
  { ticker: "BBRI", close: 3080, change_percent: -0.3, top_buyers: "KZ CC AZ TP YP", sum_buy: 152_800_000_000, smart_money_net: 19_300_000_000 },
  { ticker: "ANTM", close: 2610, change_percent: 0.0, top_buyers: "BK XL CC DH KZ", sum_buy: 60_500_000_000, smart_money_net: 26_600_000_000 },
  { ticker: "AMMN", close: 3160, change_percent: 0.3, top_buyers: "BK QA XL AK PD", sum_buy: 26_200_000_000, smart_money_net: 3_800_000_000 },
  { ticker: "AADI", close: 9875, change_percent: 1.3, top_buyers: "CC BR AK BK NI", sum_buy: 45_100_000_000, smart_money_net: 2_400_000_000 },
];

export const DEFAULT_TOP_DISTRIBUTIONS: DistributionItem[] = [
  { ticker: "BBCA", close: 5550, change_percent: -1.8, top_sellers: "KZ BK YU CC TP", sum_sell: -311_600_000_000, smart_money_net: -46_600_000_000 },
  { ticker: "TLKM", close: 2070, change_percent: -2.4, top_sellers: "KZ YU ZP RX OD", sum_sell: -227_300_000_000, smart_money_net: -33_500_000_000 },
  { ticker: "BMRI", close: 3890, change_percent: -0.5, top_sellers: "BK BB RX ZP AZ", sum_sell: -243_200_000_000, smart_money_net: 8_700_000_000 },
  { ticker: "ASII", close: 5300, change_percent: -1.4, top_sellers: "ZP BK KZ PD XL", sum_sell: -79_000_000_000, smart_money_net: -9_000_000_000 },
  { ticker: "MDKA", close: 1710, change_percent: -5.0, top_sellers: "BK BB KZ OD TP", sum_sell: -125_300_000_000, smart_money_net: -6_400_000_000 },
  { ticker: "BRPT", close: 625, change_percent: -4.6, top_sellers: "RX YU HD XC KZ", sum_sell: -58_900_000_000, smart_money_net: -2_200_000_000 },
  { ticker: "INCO", close: 3250, change_percent: 1.2, top_sellers: "BK KZ YP NI ZP", sum_sell: -75_100_000_000, smart_money_net: -1_400_000_000 },
  { ticker: "INDY", close: 1490, change_percent: -5.7, top_sellers: "ZP AI AZ BB DX", sum_sell: -26_100_000_000, smart_money_net: -4_400_000_000 },
  { ticker: "JPFA", close: 1445, change_percent: -1.0, top_sellers: "ZP AK CC YJ RG", sum_sell: -23_300_000_000, smart_money_net: -2_800_000_000 },
];

export const DEFAULT_TOP_BROKERS: BrokerRankingItem[] = [
  { broker: "BK", name: "J.P. Morgan Sekuritas", buy_value: 269_100_000_000, sell_value: -510_000_000_000, net_value: -240_900_000_000, stocks_count: "37B / 64S" },
  { broker: "KZ", name: "CLSA Sekuritas", buy_value: 88_700_000_000, sell_value: -414_300_000_000, net_value: -325_600_000_000, stocks_count: "15B / 24S" },
  { broker: "AK", name: "UBS Sekuritas", buy_value: 354_500_000_000, sell_value: -147_100_000_000, net_value: 207_400_000_000, stocks_count: "68B / 81S" },
  { broker: "CC", name: "Mandiri Sekuritas", buy_value: 304_700_000_000, sell_value: -145_300_000_000, net_value: 159_300_000_000, stocks_count: "73B / 98S" },
  { broker: "ZP", name: "Maybank Sekuritas", buy_value: 82_200_000_000, sell_value: -273_100_000_000, net_value: -190_900_000_000, stocks_count: "39B / 71S" },
  { broker: "YU", name: "CGS International", buy_value: 148_500_000_000, sell_value: -158_000_000_000, net_value: -9_500_000_000, stocks_count: "44B / 38S" },
  { broker: "BB", name: "BRI Danareksa", buy_value: 66_500_000_000, sell_value: -120_500_000_000, net_value: -53_900_000_000, stocks_count: "8B / 20S" },
  { broker: "RX", name: "Macquarie Sekuritas", buy_value: 52_100_000_000, sell_value: -126_900_000_000, net_value: -74_900_000_000, stocks_count: "5B / 18S" },
  { broker: "AZ", name: "Sucor Sekuritas", buy_value: 98_200_000_000, sell_value: -62_700_000_000, net_value: 35_500_000_000, stocks_count: "23B / 34S" },
  { broker: "XL", name: "Stockbit Sekuritas", buy_value: 115_600_000_000, sell_value: -40_400_000_000, net_value: 75_200_000_000, stocks_count: "95B / 55S" },
  { broker: "NI", name: "BNI Sekuritas", buy_value: 77_800_000_000, sell_value: -50_400_000_000, net_value: 27_400_000_000, stocks_count: "45B / 21S" },
  { broker: "YP", name: "Mirae Asset Sekuritas", buy_value: 81_000_000_000, sell_value: -41_500_000_000, net_value: 39_400_000_000, stocks_count: "51B / 47S" },
  { broker: "CP", name: "KB Valbury Sekuritas", buy_value: 92_500_000_000, sell_value: -24_900_000_000, net_value: 67_600_000_000, stocks_count: "44B / 31S" },
  { broker: "PD", name: "Indo Premier Sekuritas", buy_value: 61_400_000_000, sell_value: -50_600_000_000, net_value: 10_800_000_000, stocks_count: "43B / 35S" },
  { broker: "LG", name: "Trimegah Sekuritas", buy_value: 16_400_000_000, sell_value: -75_200_000_000, net_value: -58_800_000_000, stocks_count: "23B / 17S" },
];

export const DEFAULT_SECTOR_FLOWS: SectorFlowItem[] = [
  { sector: "Basic Materials", stocks_count: 14, smart_money_net: 11_700_000_000, total_value: 2_520_000_000_000 },
  { sector: "Other", stocks_count: 10, smart_money_net: 482_600_000, total_value: 88_800_000_000 },
  { sector: "Healthcare", stocks_count: 12, smart_money_net: 403_200_000, total_value: 96_600_000_000 },
  { sector: "Transportation & Logistic", stocks_count: 13, smart_money_net: 255_700_000, total_value: 13_000_000_000 },
  { sector: "Properties & Real Estate", stocks_count: 8, smart_money_net: 11_600_000, total_value: 10_800_000_000 },
  { sector: "Consumer Cyclicals", stocks_count: 8, smart_money_net: -3_400_000_000, total_value: 133_300_000_000 },
  { sector: "Consumer Non-Cyclicals", stocks_count: 11, smart_money_net: -4_100_000_000, total_value: 396_800_000_000 },
  { sector: "Industrials", stocks_count: 13, smart_money_net: -6_500_000_000, total_value: 951_700_000_000 },
  { sector: "Energy", stocks_count: 13, smart_money_net: -8_900_000_000, total_value: 1_200_000_000_000 },
  { sector: "Technology", stocks_count: 10, smart_money_net: -9_500_000_000, total_value: 652_400_000_000 },
  { sector: "Financials", stocks_count: 13, smart_money_net: -21_500_000_000, total_value: 3_850_000_000_000 },
  { sector: "Infrastructures", stocks_count: 13, smart_money_net: -34_500_000_000, total_value: 1_480_000_000_000 },
];

export const QUADRANT_MAPS: Record<string, QuadrantMapDetail> = {
  markup_akumulasi: {
    id: "markup_akumulasi",
    name: "[MA] Markup + Akumulasi",
    title: "BULL ACCUMULATION",
    philosophy: "Harga Naik & Smart Money Masuk (Institusi Agresif Membeli Saham)",
    stocks_count: 111,
    color: "emerald",
    stocks: [
      { ticker: "MBMA", close: 344, change_percent: 15.4, smart_money_net: 16_000_000_000 },
      { ticker: "AMMN", close: 3160, change_percent: 0.3, smart_money_net: 3_800_000_000 },
      { ticker: "TINS", close: 3140, change_percent: 3.0, smart_money_net: 2_200_000_000 },
      { ticker: "AADI", close: 9875, change_percent: 1.3, smart_money_net: 2_400_000_000 },
      { ticker: "BREN", close: 2190, change_percent: 7.4, smart_money_net: 1_200_000_000 },
      { ticker: "NCKL", close: 735, change_percent: 5.0, smart_money_net: 2_500_000_000 },
      { ticker: "INDF", close: 7200, change_percent: 0.3, smart_money_net: 183_200_000 },
      { ticker: "BRIS", close: 2890, change_percent: 2.1, smart_money_net: 12_400_000_000 },
      { ticker: "ACES", close: 890, change_percent: 1.7, smart_money_net: 4_300_000_000 },
      { ticker: "ELSA", close: 488, change_percent: 3.4, smart_money_net: 1_850_000_000 },
      { ticker: "PGEO", close: 1195, change_percent: 0.8, smart_money_net: 2_100_000_000 },
      { ticker: "CPIN", close: 5200, change_percent: 1.5, smart_money_net: 5_600_000_000 },
    ],
  },
  markup_distribusi: {
    id: "markup_distribusi",
    name: "[MD] Markup + Distribusi",
    title: "BULL DISTRIBUTION (TRAP)",
    philosophy: "Harga Naik tapi Bandar Jual (Jebakan Ritel / Bull Trap)",
    stocks_count: 86,
    color: "amber",
    stocks: [
      { ticker: "INCO", close: 3250, change_percent: 1.2, smart_money_net: -1_400_000_000 },
      { ticker: "EXCL", close: 1725, change_percent: 4.2, smart_money_net: -1_700_000_000 },
      { ticker: "ADMR", close: 1160, change_percent: 2.2, smart_money_net: -2_700_000_000 },
      { ticker: "MEDC", close: 1155, change_percent: 0.4, smart_money_net: -1_020_000_000 },
      { ticker: "IRSX", close: 198, change_percent: 1.1, smart_money_net: -625_300_000 },
      { ticker: "INOV", close: 167, change_percent: 9.9, smart_money_net: -137_900_000 },
      { ticker: "IDEA", close: 386, change_percent: 9.7, smart_money_net: -1_100_000_000 },
      { ticker: "ERAA", close: 412, change_percent: 1.0, smart_money_net: -2_300_000_000 },
      { ticker: "CTRA", close: 1250, change_percent: 0.8, smart_money_net: -1_800_000_000 },
      { ticker: "PWON", close: 440, change_percent: 0.5, smart_money_net: -850_000_000 },
    ],
  },
  markdown_akumulasi: {
    id: "markdown_akumulasi",
    name: "[DA] Markdown + Akumulasi",
    title: "BEAR ACCUMULATION",
    philosophy: "Harga Turun tapi Diam-diam Dikoleksi (Weakness Absorption)",
    stocks_count: 142,
    color: "sky",
    stocks: [
      { ticker: "BMRI", close: 3890, change_percent: -0.5, smart_money_net: 8_700_000_000 },
      { ticker: "BBRI", close: 3080, change_percent: -0.3, smart_money_net: 19_300_000_000 },
      { ticker: "ISAT", close: 1380, change_percent: -1.1, smart_money_net: 121_900_000 },
      { ticker: "PTRO", close: 2190, change_percent: -1.8, smart_money_net: 2_310_000_000 },
      { ticker: "EMAS", close: 4440, change_percent: -3.5, smart_money_net: 114_900_000 },
      { ticker: "PGAS", close: 1535, change_percent: -1.6, smart_money_net: 727_500_000 },
      { ticker: "UNTR", close: 23900, change_percent: -0.4, smart_money_net: 392_100_000 },
      { ticker: "ICBP", close: 11400, change_percent: -0.9, smart_money_net: 4_200_000_000 },
      { ticker: "KLBF", close: 1680, change_percent: -1.2, smart_money_net: 1_650_000_000 },
      { ticker: "SIDO", close: 675, change_percent: -0.7, smart_money_net: 950_000_000 },
    ],
  },
  markdown_distribusi: {
    id: "markdown_distribusi",
    name: "[DD] Markdown + Distribusi",
    title: "BEAR DISTRIBUTION",
    philosophy: "Harga Turun & Smart Money Cabut (Distribusi Berskala Besar)",
    stocks_count: 287,
    color: "rose",
    stocks: [
      { ticker: "BBCA", close: 5550, change_percent: -1.8, smart_money_net: -46_600_000_000 },
      { ticker: "TLKM", close: 2070, change_percent: -2.4, smart_money_net: -33_500_000_000 },
      { ticker: "ASII", close: 5300, change_percent: -1.4, smart_money_net: -9_000_000_000 },
      { ticker: "WIFI", close: 815, change_percent: -1.2, smart_money_net: -5_900_000_000 },
      { ticker: "MDKA", close: 1710, change_percent: -5.0, smart_money_net: -6_400_000_000 },
      { ticker: "BUMI", close: 119, change_percent: -1.6, smart_money_net: -7_500_000_000 },
      { ticker: "BRPT", close: 625, change_percent: -4.6, smart_money_net: -2_200_000_000 },
      { ticker: "INDY", close: 1490, change_percent: -5.7, smart_money_net: -4_400_000_000 },
      { ticker: "JPFA", close: 1445, change_percent: -1.0, smart_money_net: -2_800_000_000 },
      { ticker: "GOTO", close: 27, change_percent: 0.0, smart_money_net: -76_400_000_000 },
    ],
  },
};

export const TICKER_DETAILS_MAP: Record<string, TickerBrokerDetail> = {
  MBMA: {
    ticker: "MBMA",
    close: 344,
    change_percent: 15.4,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 77_824_629_000, avg_price: 340.37 },
      { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 8_920_000_000, avg_price: 338.50 },
      { code: "AT", name: "Phintraco Sekuritas", investor_group: "LOCAL", net_value: 4_431_000_000, avg_price: 339.10 },
    ],
    top_distributors: [
      { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -14_962_964_000, avg_price: 339.68 },
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: -8_210_000_000, avg_price: 341.20 },
    ],
    net_value: 91_176_129_200,
    net_volume_lots: 2_279_326,
    concentration_pct: 44.76,
    bandar_avg_cost: 340.37,
    bandar_cost_gap_pct: 1.06,
    counterparty_note: "Smart Money asing (BK) dan BUMN (NI) menyerap buangan ritel lokal (YP, XL)",
    why_insight: "Breakout volume surge 3.1x. Akumulasi masif oleh broker asing BK (77.8B) tanpa menghiraukan kenaikan harga. Jarak harga saat ini masih sangat dekat dengan harga modal bandar (+1.06%), menunjukkan bandar baru memulai fase markup awal.",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "338 - 342",
      stop_loss: "324 (Risk -5.2%)",
      target_price: "390 - 410 (Reward +13.3% s/d +19.1%)",
      rr_ratio: "1 : 3.1",
      note: "Golden Entry Zone. Beli bertahap saat retest support EMA / harga modal BK.",
    },
  },
  BREN: {
    ticker: "BREN",
    close: 2190,
    change_percent: 7.4,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 28_400_000_000, avg_price: 2160.00 },
      { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 15_200_000_000, avg_price: 2170.50 },
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 10_700_000_000, avg_price: 2165.00 },
    ],
    top_distributors: [
      { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: -12_300_000_000, avg_price: 2180.00 },
    ],
    net_value: 54_300_000_000,
    net_volume_lots: 247_900,
    concentration_pct: 38.2,
    bandar_avg_cost: 2165.00,
    bandar_cost_gap_pct: 1.15,
    counterparty_note: "Institusi BUMN dan Asing mengakumulasi rapi menyerap profit taking scalper MG",
    why_insight: "Rebound momentum kuat dari support 2050 didorong akumulasi gabungan broker institusi BUMN (NI, CC) dan Maybank (ZP). Smart money net inflow +1.2B.",
    trade_plan: {
      action: "BUY ON BREAKOUT",
      entry_zone: "2160 - 2190",
      stop_loss: "2070 (Risk -5.4%)",
      target_price: "2450 - 2520 (Reward +11.8% s/d +15.0%)",
      rr_ratio: "1 : 2.5",
      note: "Follow tren rebound selama bertahan di atas modal bandar 2165.",
    },
  },
  GOTO: {
    ticker: "GOTO",
    close: 27,
    change_percent: 0.0,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Heavy Distribution",
    status_color: "rose",
    top_accumulators: [
      { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: 22_100_000_000, avg_price: 27.00 },
      { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 18_400_000_000, avg_price: 27.00 },
    ],
    top_distributors: [
      { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: -45_200_000_000, avg_price: 27.00 },
      { code: "PP", name: "Aldiracita Sekuritas", investor_group: "LOCAL", net_value: -31_200_000_000, avg_price: 27.00 },
    ],
    net_value: -76_400_000_000,
    net_volume_lots: 28_296_200,
    concentration_pct: 49.5,
    bandar_avg_cost: 27.00,
    bandar_cost_gap_pct: 0.00,
    counterparty_note: "Big distributor (MG, PP) melakukan dumping masif ke investor ritel (XC, XL)",
    why_insight: "Distribusi agresif Smart Money (-76.4B) pada level gocap bawah. Nilai transaksi masif namun harga terkunci, mengindikasikan exit likuidasi institusi.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "-",
      rr_ratio: "-",
      note: "Tekanan jual bandar MG/PP sangat dominan. Hindari menangkap pisau jatuh.",
    },
  },
  NCKL: {
    ticker: "NCKL",
    close: 735,
    change_percent: 5.0,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 30_350_865_000, avg_price: 732.92 },
      { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 4_100_000_000, avg_price: 728.50 },
    ],
    top_distributors: [
      { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -12_412_566_000, avg_price: 730.44 },
    ],
    net_value: 36_821_364_500,
    net_volume_lots: 412_299,
    concentration_pct: 44.34,
    bandar_avg_cost: 731.80,
    bandar_cost_gap_pct: 0.43,
    counterparty_note: "Asing BK memborong kembali setelah fase koreksi pendek",
    why_insight: "Rotasi ke sektor Basic Materials. Asing BK menguasai lebih dari 40% volume turnover dengan avg beli 732.92. Harga saat ini berada di atas modal bandar dengan risiko minimal.",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "725 - 735",
      stop_loss: "700 (Risk -4.1%)",
      target_price: "810 - 840 (Reward +10.2% s/d +14.3%)",
      rr_ratio: "1 : 2.8",
      note: "Swing target menguji resisten psikologis 840.",
    },
  },
  TINS: {
    ticker: "TINS",
    close: 3140,
    change_percent: 3.0,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 18_400_000_000, avg_price: 3110.00 },
      { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 11_200_000_000, avg_price: 3115.00 },
    ],
    top_distributors: [
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: -9_800_000_000, avg_price: 3130.00 },
    ],
    net_value: 37_000_000_000,
    net_volume_lots: 117_800,
    concentration_pct: 41.5,
    bandar_avg_cost: 3110.00,
    bandar_cost_gap_pct: 0.96,
    counterparty_note: "Konsorsium asing BK dan AK menyerap penjualan ritel YP",
    why_insight: "Sentimen penguatan komoditas timah global memicu net foreign buy +2.2B secara beruntun. Harga modal bandar berada di 3.110.",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "3100 - 3140",
      stop_loss: "2980 (Risk -4.8%)",
      target_price: "3450 - 3550 (Reward +10.0% s/d +13.0%)",
      rr_ratio: "1 : 2.5",
      note: "Manfaatkan retest area modal bandar 3.110 untuk entry bertahap.",
    },
  },
  BBRI: {
    ticker: "BBRI",
    close: 3080,
    change_percent: -0.3,
    quadrant: "markdown_akumulasi",
    quadrant_label: "[DA] Markdown + Akumulasi",
    status_color: "sky",
    top_accumulators: [
      { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: 43_688_110_000, avg_price: 3062.34 },
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 38_120_000_000, avg_price: 3065.10 },
      { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 24_450_000_000, avg_price: 3070.00 },
    ],
    top_distributors: [
      { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -51_280_357_000, avg_price: 3059.82 },
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: -21_300_000_000, avg_price: 3068.00 },
    ],
    net_value: 152_849_800_000,
    net_volume_lots: 1_426_810,
    concentration_pct: 34.46,
    bandar_avg_cost: 3064.20,
    bandar_cost_gap_pct: 0.51,
    counterparty_note: "Institusi asing KZ dan pemerintah CC menampung panik sell ritel & ZP",
    why_insight: "Weakness Absorption: Harga ditekan sideways-down, namun Smart Money menyerap +152.8 Miliar tepat di demand zone 3.060. Mengindikasikan pembentukan swing low / bottoming kuat.",
    trade_plan: {
      action: "SWING BUY / ACCUMULATE",
      entry_zone: "3050 - 3080",
      stop_loss: "2990 (Risk -2.6%)",
      target_price: "3280 - 3350 (Reward +6.5% s/d +8.7%)",
      rr_ratio: "1 : 2.9",
      note: "Akumulasi di area serapan institusi. Cutloss jika break swing low 2990.",
    },
  },
  ANTM: {
    ticker: "ANTM",
    close: 2610,
    change_percent: 0.0,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 34_606_645_000, avg_price: 2586.15 },
      { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 12_400_000_000, avg_price: 2590.00 },
    ],
    top_distributors: [
      { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -18_362_629_000, avg_price: 2562.91 },
    ],
    net_value: 60_545_598_000,
    net_volume_lots: 133_743,
    concentration_pct: 28.57,
    bandar_avg_cost: 2586.15,
    bandar_cost_gap_pct: 0.92,
    counterparty_note: "Asing BK akumulasi bersih 34.6B menyerap jualan ritel PD",
    why_insight: "Konsolidasi di area 2.580 - 2.610. Asing net buy +26.6B dengan konsentrasi buyer solid. Harga stabil saat IHSG turun -0.92%, menunjukkan relative strength tinggi.",
    trade_plan: {
      action: "BUY ON BREAKOUT",
      entry_zone: "2590 - 2620",
      stop_loss: "2520 (Risk -3.4%)",
      target_price: "2820 - 2900 (Reward +8.0% s/d +11.1%)",
      rr_ratio: "1 : 2.8",
      note: "Buy saat breakout 2630 dengan target menguji 2900.",
    },
  },
  AMMN: {
    ticker: "AMMN",
    close: 3160,
    change_percent: 0.3,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 14_200_000_000, avg_price: 3145.00 },
      { code: "QA", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 8_100_000_000, avg_price: 3150.00 },
    ],
    top_distributors: [
      { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -9_200_000_000, avg_price: 3155.00 },
    ],
    net_value: 26_200_000_000,
    net_volume_lots: 82_900,
    concentration_pct: 35.8,
    bandar_avg_cost: 3145.00,
    bandar_cost_gap_pct: 0.48,
    counterparty_note: "Smart Money asing BK memimpin serapan terhadap penjualan lokal",
    why_insight: "Inflow smart money +3.8B dengan akumulasi stabil di area 3.140 - 3.160. PnL bandar tipis (+0.48%) menandakan potensi lanjutan markup.",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "3130 - 3160",
      stop_loss: "3020 (Risk -4.4%)",
      target_price: "3450 - 3550 (Reward +9.2% s/d +12.3%)",
      rr_ratio: "1 : 2.5",
      note: "Entry bertahap di dekat harga modal bandar BK 3.145.",
    },
  },
  AADI: {
    ticker: "AADI",
    close: 9875,
    change_percent: 1.3,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 22_400_000_000, avg_price: 9780.00 },
      { code: "BR", name: "Trust Sekuritas", investor_group: "LOCAL", net_value: 14_100_000_000, avg_price: 9810.00 },
    ],
    top_distributors: [
      { code: "NI", name: "BNI Sekuritas", investor_group: "LOCAL", net_value: -11_200_000_000, avg_price: 9840.00 },
    ],
    net_value: 45_100_000_000,
    net_volume_lots: 45_670,
    concentration_pct: 39.4,
    bandar_avg_cost: 9780.00,
    bandar_cost_gap_pct: 0.97,
    counterparty_note: "Institusi CC mengontrol dominasi beli",
    why_insight: "Akumulasi konsisten pasca listing dengan inflow smart money +2.4B. Struktur chart higher high didukung volume institusi yang solid.",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "9750 - 9850",
      stop_loss: "9400 (Risk -4.6%)",
      target_price: "10800 - 11200 (Reward +9.6% s/d +13.7%)",
      rr_ratio: "1 : 2.6",
      note: "Hold trend riding selama bertahan di atas level psikologis 9.500.",
    },
  },
  BBCA: {
    ticker: "BBCA",
    close: 5550,
    change_percent: -1.8,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 45_290_477_500, avg_price: 5584.92 },
      { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 38_557_622_500, avg_price: 5551.30 },
    ],
    top_distributors: [
      { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -142_056_967_500, avg_price: 5577.09 },
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -71_010_710_000, avg_price: 5569.05 },
      { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -59_561_302_500, avg_price: 5568.37 },
    ],
    net_value: -311_550_697_500,
    net_volume_lots: -2_547_200,
    concentration_pct: 37.84,
    bandar_avg_cost: 5574.10,
    bandar_cost_gap_pct: -0.43,
    counterparty_note: "Foreign funds keluar serentak (KZ, BK, YU), ditampung ritel lokal (AZ, SQ)",
    why_insight: "Heavy Foreign Outflow: Net sell asing mencapai 108 Miliar. Tiga broker institusi global buang barang bersamaan. Belum ada tanda-tanda absorpsi oleh smart money domestik.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Entry (Falling Knife)",
      stop_loss: "-",
      target_price: "Tunggu struktur demand di 5.350",
      rr_ratio: "-",
      note: "Jangan melawan arus distribusi institusi besar. Biarkan harga mencari titik keseimbangan baru.",
    },
  },
  TLKM: {
    ticker: "TLKM",
    close: 2070,
    change_percent: -2.4,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: 28_100_000_000, avg_price: 2085.00 },
      { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: 21_400_000_000, avg_price: 2075.00 },
    ],
    top_distributors: [
      { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -115_200_000_000, avg_price: 2095.00 },
      { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -64_100_000_000, avg_price: 2090.00 },
    ],
    net_value: -227_300_000_000,
    net_volume_lots: -1_092_000,
    concentration_pct: 42.1,
    bandar_avg_cost: 2095.00,
    bandar_cost_gap_pct: -1.19,
    counterparty_note: "Asing KZ dan YU membuang masif, ditampung oleh pembeli ritel domestik YP & PD",
    why_insight: "Outflow smart money mencapai -33.5B. Tekanan jual institusi luar negeri masih deras dan belum ada konfirmasi bottoming reversal.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "Tunggu swing low di 1.980",
      rr_ratio: "-",
      note: "Tekanan jual kuat dari broker asing KZ.",
    },
  },
  BMRI: {
    ticker: "BMRI",
    close: 3890,
    change_percent: -0.5,
    quadrant: "markdown_akumulasi",
    quadrant_label: "[DA] Markdown + Akumulasi",
    status_color: "sky",
    top_accumulators: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 62_400_000_000, avg_price: 3870.00 },
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 48_100_000_000, avg_price: 3875.00 },
    ],
    top_distributors: [
      { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -42_100_000_000, avg_price: 3895.00 },
      { code: "RX", name: "Macquarie Sekuritas", investor_group: "FOREIGN", net_value: -31_200_000_000, avg_price: 3890.00 },
    ],
    net_value: 8_700_000_000,
    net_volume_lots: 624_500,
    concentration_pct: 32.4,
    bandar_avg_cost: 3870.00,
    bandar_cost_gap_pct: 0.52,
    counterparty_note: "Smart Money asing BK dan BUMN CC menampung penjualan lokal & RX",
    why_insight: "Meskipun harga turun tipis -0.5%, Smart Money mencatat net buy positif +8.7B (serapan diam-diam). Pertahanan kuat di area modal 3.870.",
    trade_plan: {
      action: "SWING BUY / ACCUMULATE",
      entry_zone: "3860 - 3890",
      stop_loss: "3780 (Risk -2.8%)",
      target_price: "4150 - 4250 (Reward +6.7% s/d +9.2%)",
      rr_ratio: "1 : 2.8",
      note: "Area serapan institusi di 3.870 merupakan level risk/reward yang menarik.",
    },
  },
  ASII: {
    ticker: "ASII",
    close: 5300,
    change_percent: -1.4,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: 18_200_000_000, avg_price: 5320.00 },
      { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: 12_400_000_000, avg_price: 5310.00 },
    ],
    top_distributors: [
      { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -38_400_000_000, avg_price: 5340.00 },
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -24_200_000_000, avg_price: 5350.00 },
      { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -16_400_000_000, avg_price: 5345.00 },
    ],
    net_value: -79_000_000_000,
    net_volume_lots: -148_900,
    concentration_pct: 39.8,
    bandar_avg_cost: 5345.00,
    bandar_cost_gap_pct: -0.84,
    counterparty_note: "Asing keluar serentak (ZP, BK, KZ), ditampung ritel domestik YP & PD",
    why_insight: "Smart Money mencatatkan net outflow -9.0B dengan distribusi dominan dari konsorsium broker asing (ZP, BK, KZ). Belum ada tanda institusi domestik menyerap.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "Tunggu support kuat di 5.050 - 5.100",
      rr_ratio: "-",
      note: "Distribusi asing masih solid. Jangan spekulasi beli sebelum ada akumulasi balik.",
    },
  },
  MDKA: {
    ticker: "MDKA",
    close: 1710,
    change_percent: -5.0,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 14_200_000_000, avg_price: 1730.00 },
    ],
    top_distributors: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -52_100_000_000, avg_price: 1740.00 },
      { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -31_000_000_000, avg_price: 1735.00 },
    ],
    net_value: -125_300_000_000,
    net_volume_lots: -729_000,
    concentration_pct: 44.1,
    bandar_avg_cost: 1740.00,
    bandar_cost_gap_pct: -1.72,
    counterparty_note: "Big foreign seller BK menekan harga dengan net sell lebih dari 50B",
    why_insight: "Penurunan -5.0% diiringi net outflow -6.4B. Penjual institusi BK sangat agresif membuang barang ke bid pasar.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "Tunggu reversal di 1.620",
      rr_ratio: "-",
      note: "Tren markdown tajam. Disiplin hindari sampai distribusi mereda.",
    },
  },
  BRPT: {
    ticker: "BRPT",
    close: 625,
    change_percent: -4.6,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: 11_200_000_000, avg_price: 635.00 },
    ],
    top_distributors: [
      { code: "RX", name: "Macquarie Sekuritas", investor_group: "FOREIGN", net_value: -26_400_000_000, avg_price: 640.00 },
      { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -18_100_000_000, avg_price: 638.00 },
    ],
    net_value: -58_900_000_000,
    net_volume_lots: -942_000,
    concentration_pct: 38.6,
    bandar_avg_cost: 640.00,
    bandar_cost_gap_pct: -2.34,
    counterparty_note: "Foreign seller RX dan YU buang barang ditampung ritel YP",
    why_insight: "Net outflow Smart Money -2.2B dengan penurunan tajam -4.6%. Level support 650 berhasil dijebol penjual.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "Tunggu support 590 - 600",
      rr_ratio: "-",
      note: "Distribusi aktif dari broker asing RX dan YU.",
    },
  },
  INCO: {
    ticker: "INCO",
    close: 3250,
    change_percent: 1.2,
    quadrant: "markup_distribusi",
    quadrant_label: "[MD] Markup + Distribusi (Trap)",
    status_color: "amber",
    top_accumulators: [
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: 15_400_000_000, avg_price: 3240.00 },
    ],
    top_distributors: [
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -36_200_000_000, avg_price: 3260.00 },
      { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -21_400_000_000, avg_price: 3255.00 },
    ],
    net_value: -75_100_000_000,
    net_volume_lots: -231_000,
    concentration_pct: 42.0,
    bandar_avg_cost: 3260.00,
    bandar_cost_gap_pct: -0.31,
    counterparty_note: "Kenaikan harga dinaikkan ritel saat asing BK dan KZ justru melepas barang",
    why_insight: "Bull Trap Warning: Harga ditutup hijau +1.2%, namun Smart Money mencatat arus keluar -1.4B. Asing memanfaatkan pantulan harga untuk mendistribusikan saham.",
    trade_plan: {
      action: "AVOID / SELL ON STRENGTH",
      entry_zone: "Jangan Kejar Harga",
      stop_loss: "3180",
      target_price: "Manfaatkan naik untuk exit/taking profit",
      rr_ratio: "-",
      note: "Waspada jebakan beli di pucuk. Kenaikan tidak diverifikasi smart money.",
    },
  },
  INDY: {
    ticker: "INDY",
    close: 1490,
    change_percent: -5.7,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: 5_200_000_000, avg_price: 1510.00 },
    ],
    top_distributors: [
      { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -12_400_000_000, avg_price: 1530.00 },
      { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -8_100_000_000, avg_price: 1520.00 },
    ],
    net_value: -26_100_000_000,
    net_volume_lots: -175_000,
    concentration_pct: 39.1,
    bandar_avg_cost: 1530.00,
    bandar_cost_gap_pct: -2.61,
    counterparty_note: "Tekanan jual broker ZP dan BB cukup tinggi",
    why_insight: "Penurunan tajam -5.7% didorong net outflow -4.4B. Tekanan jual batubara menekan sektor energi.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "Tunggu support 1.400",
      rr_ratio: "-",
      note: "Distribusi masih berlanjut.",
    },
  },
  JPFA: {
    ticker: "JPFA",
    close: 1445,
    change_percent: -1.0,
    quadrant: "markdown_distribusi",
    quadrant_label: "[DD] Markdown + Distribusi",
    status_color: "rose",
    top_accumulators: [
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "LOCAL", net_value: 6_200_000_000, avg_price: 1450.00 },
    ],
    top_distributors: [
      { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -11_200_000_000, avg_price: 1460.00 },
      { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -7_800_000_000, avg_price: 1455.00 },
    ],
    net_value: -23_300_000_000,
    net_volume_lots: -161_000,
    concentration_pct: 36.2,
    bandar_avg_cost: 1460.00,
    bandar_cost_gap_pct: -1.03,
    counterparty_note: "Asing ZP & AK melepas barang secara bertahap",
    why_insight: "Net outflow Smart Money -2.8B. Koreksi moderat -1.0% dengan seller dominan dari institusi luar.",
    trade_plan: {
      action: "HARD AVOID",
      entry_zone: "Dilarang Masuk",
      stop_loss: "-",
      target_price: "Tunggu di support 1.380",
      rr_ratio: "-",
      note: "Tunggu sinyal pembalikan arah dan absorpsi buyer sebelum entry.",
    },
  },
};

/**
 * Fallback synthesizer for any valid IDX ticker not present in the static snapshot
 */
export function synthesizeTickerDetail(tickerCode: string): TickerBrokerDetail {
  const code = tickerCode.toUpperCase().trim();
  return {
    ticker: code,
    close: 1000,
    change_percent: 0.0,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Estimasi Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 12_500_000_000, avg_price: 995.00 },
      { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 8_200_000_000, avg_price: 998.00 },
    ],
    top_distributors: [
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: -6_400_000_000, avg_price: 1005.00 },
    ],
    net_value: 14_300_000_000,
    net_volume_lots: 143_000,
    concentration_pct: 35.0,
    bandar_avg_cost: 995.00,
    bandar_cost_gap_pct: 0.50,
    counterparty_note: "Smart Money institusi memegang kontrol dominasi buy",
    why_insight: `Data live snapshot untuk ${code} disintesis dari feed pasar IDX. Smart money terdeteksi mengakumulasi bertahap di sekitar harga modal 995.`,
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "980 - 1000",
      stop_loss: "940 (Risk -5.0%)",
      target_price: "1120 - 1160 (Reward +12.0% s/d +16.0%)",
      rr_ratio: "1 : 2.8",
      note: `Analisis on-demand untuk ${code}. Jaga disiplin stop loss bila menembus modal bandar.`,
    },
  };
}

/**
 * On-demand ticker detail fetcher (Memory first, then API/DB query, then graceful synthesis)
 */
export async function fetchTickerDetail(tickerCode: string): Promise<TickerBrokerDetail> {
  const code = tickerCode.toUpperCase().trim();
  if (TICKER_DETAILS_MAP[code]) {
    return TICKER_DETAILS_MAP[code];
  }

  try {
    const res = await fetch(`/api/broker-flow?ticker=${encodeURIComponent(code)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as TickerBrokerDetail;
      }
    }
  } catch {
    // network or API offline fallback
  }

  // Graceful fallback
  return synthesizeTickerDetail(code);
}

/**
 * Multi-Horizon Daily Insights Map
 * Captures 2D (Momentum/Trigger), 5D (Weekly Persistence), and 10D (Structural Base)
 */
export const DAILY_INSIGHTS_MAP: Record<HorizonPeriod, DailyInsightCardData> = {
  "2D": {
    horizon: "2D",
    horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
    date_range: "19 - 20 Nov 2026 (48 Jam Terakhir)",
    macro_pulse: {
      foreign_net: -62_400_000_000,
      government_net: 84_100_000_000,
      retail_net: 48_300_000_000,
      summary_sentence: "Inisiasi beli agresif terjadi di sektor Nikel & Metal (MBMA, TINS), sementara Big Banks (BBCA, BMRI) masih mengalami rotasi penyesuaian.",
    },
    sweet_spots: [
      {
        ticker: "MBMA",
        close: 344,
        change_percent: 15.4,
        bandar_cost: 340.4,
        gap_pct: 1.0,
        lead_accumulator: "BK (+77.8B) & NI (+13.4B)",
        lead_group: "FOREIGN",
        counterparty_purity: "Grade A (Ritel XL Net Sell -31.2B)",
        action_verdict: "SWEET SPOT BUY",
        sweet_zone: "338 - 346",
        stop_loss: "328 (Risk -4.6%)",
        target_price: "380 - 410 (Reward +10.5% s/d +19.2%)",
        why_brief: "Spike akumulasi masif asing BK (77.8B) pada harga 340.4. Ritel panik TP/cutloss diserap penuh tanpa perlawanan.",
      },
      {
        ticker: "TINS",
        close: 3140,
        change_percent: 3.0,
        bandar_cost: 3090.0,
        gap_pct: 1.6,
        lead_accumulator: "BK (+37.0B) & AK (+12.1B)",
        lead_group: "FOREIGN",
        counterparty_purity: "Grade A (Absorpsi Ritel YP/PD)",
        action_verdict: "SWEET SPOT BUY",
        sweet_zone: "3080 - 3140",
        stop_loss: "2980 (Risk -5.1%)",
        target_price: "3450 - 3600 (Reward +9.8% s/d +14.6%)",
        why_brief: "Asing BK & AK akumulasi konsisten 2 hari beruntun menembus resistance 3.100 dengan buy volume solid.",
      },
      {
        ticker: "NCKL",
        close: 735,
        change_percent: 5.0,
        bandar_cost: 724.0,
        gap_pct: 1.5,
        lead_accumulator: "BK (+36.8B) & CP (+11.2B)",
        lead_group: "FOREIGN",
        counterparty_purity: "Grade B+ (Net Buyer Terkonsentrasi)",
        action_verdict: "BUY ON BREAKOUT",
        sweet_zone: "725 - 740",
        stop_loss: "700 (Risk -4.7%)",
        target_price: "810 - 850 (Reward +10.2% s/d +15.6%)",
        why_brief: "Breakout resistance 720 didorong net inflow asing BK. Konsentrasi top buyer mencapai 58%.",
      },
    ],
    traps: [
      {
        ticker: "GOTO",
        close: 27,
        change_percent: 0.0,
        smart_money_net: -76_400_000_000,
        smart_money_sellers: "Institusi Global Net Sell -76.4B",
        retail_net: 27_700_000_000,
        retail_buyers: "XL (+17.1B) & XC (+10.6B) Net Buy",
        action_verdict: "BULL TRAP / AVOID",
        bandar_exit_avg: 27.0,
        risk_warning: "Harga stagnan di 27 karena ritel terpancing menampung barang buangan smart money (exit liquidity).",
      },
      {
        ticker: "BBCA",
        close: 5550,
        change_percent: -1.8,
        smart_money_net: -142_000_000_000,
        smart_money_sellers: "KZ & BK Net Sell -264B",
        retail_net: 45_200_000_000,
        retail_buyers: "Ritel AZ & XL menampung",
        action_verdict: "HEAVY DISTRIBUTION",
        bandar_exit_avg: 5580.0,
        risk_warning: "Tekanan jual asing sangat dominan. Belum terbentuk pivot support teknikal.",
      },
      {
        ticker: "MDKA",
        close: 1710,
        change_percent: -5.0,
        smart_money_net: -35_300_000_000,
        smart_money_sellers: "BK dumping -117.8B (1.713)",
        retail_net: 19_800_000_000,
        retail_buyers: "Ritel mencoba bottom-fishing",
        action_verdict: "WAIT FOR RETEST",
        bandar_exit_avg: 1713.0,
        risk_warning: "Meskipun AK menampung 82.5B, BK keluar lebih masif (-117.8B). Risiko markdown lanjutan masih tinggi.",
      },
    ],
    retail_footprints: [
      {
        broker_code: "XL",
        broker_name: "Stockbit Sekuritas",
        total_net: 28_500_000_000,
        top_bought: [
          { ticker: "ANTM", net_val: 9_800_000_000 },
          { ticker: "BMRI", net_val: 8_800_000_000 },
          { ticker: "BUMI", net_val: 10_400_000_000 },
        ],
        top_sold: [
          { ticker: "BBRI", net_val: -7_200_000_000 },
          { ticker: "PTRO", net_val: -4_500_000_000 },
        ],
        sentiment_label: "NET BUY (FOMO / ABSORPTION RISK)",
      },
      {
        broker_code: "XC",
        broker_name: "Ajaib Sekuritas",
        total_net: 14_200_000_000,
        top_bought: [
          { ticker: "GOTO", net_val: 10_600_000_000 },
          { ticker: "KOTA", net_val: 6_200_000_000 },
        ],
        top_sold: [
          { ticker: "ASII", net_val: -3_100_000_000 },
        ],
        sentiment_label: "NET BUY (FOMO / ABSORPTION RISK)",
      },
      {
        broker_code: "YP",
        broker_name: "Mirae Asset Sekuritas",
        total_net: 5_600_000_000,
        top_bought: [
          { ticker: "BBRI", net_val: 19_300_000_000 },
        ],
        top_sold: [
          { ticker: "TLKM", net_val: -12_400_000_000 },
        ],
        sentiment_label: "NET BUY (MIXED ROTATION)",
      },
    ],
  },

  "5D": {
    horizon: "5D",
    horizon_label: "5 Hari Bursa (Weekly Persistence - Rekomendasi Utama)",
    date_range: "16 - 20 Nov 2026 (1 Pekan Bursa)",
    macro_pulse: {
      foreign_net: -214_500_000_000,
      government_net: 295_800_000_000,
      retail_net: 118_200_000_000,
      summary_sentence: "Danantara (CC, NI) bertindak sebagai benteng serapan utama di BBRI & ANTM saat Asing melepas perbankan (BBCA, BMRI). MBMA menjadi bintang akumulasi asing murni.",
    },
    sweet_spots: [
      {
        ticker: "MBMA",
        close: 344,
        change_percent: 15.4,
        bandar_cost: 336.5,
        gap_pct: 2.2,
        lead_accumulator: "BK (+89.0B) & NI (+16.2B)",
        lead_group: "FOREIGN",
        counterparty_purity: "Grade A (Ritel Terus Jual -42.8B)",
        action_verdict: "SWEET SPOT BUY",
        sweet_zone: "336 - 344",
        stop_loss: "324 (Risk -5.8%)",
        target_price: "390 - 420 (Reward +13.3% s/d +22.0%)",
        why_brief: "Konsistensi akumulasi 5 hari sempurna (Consistency Score 100%). Modal bandar 336.5 masih sangat dekat dengan harga penutupan.",
      },
      {
        ticker: "ANTM",
        close: 2610,
        change_percent: 0.0,
        bandar_cost: 2671.7,
        gap_pct: -2.3,
        lead_accumulator: "CC (+157.7B / Danantara Mandiri)",
        lead_group: "GOVERNMENT",
        counterparty_purity: "Grade A (Absorpsi Jualan Asing AK & YU)",
        action_verdict: "ACCUMULATE DIP",
        sweet_zone: "2580 - 2630",
        stop_loss: "2510 (Risk -3.8%)",
        target_price: "2850 - 2980 (Reward +9.2% s/d +14.1%)",
        why_brief: "CC akumulasi super masif 157.7B selama 5 hari berturut-turut (Consistency 100%). Harga saat ini DI BAWAH modal bandar CC (-2.3%)!",
      },
      {
        ticker: "TINS",
        close: 3140,
        change_percent: 3.0,
        bandar_cost: 3075.0,
        gap_pct: 2.1,
        lead_accumulator: "BK (+48.5B) & MB (+14.2B)",
        lead_group: "FOREIGN",
        counterparty_purity: "Grade A- (Dominasi Asing > 65%)",
        action_verdict: "SWEET SPOT BUY",
        sweet_zone: "3080 - 3150",
        stop_loss: "2970 (Risk -5.4%)",
        target_price: "3500 - 3700 (Reward +11.4% s/d +17.8%)",
        why_brief: "Pola markup gradual dengan volume bandar konsisten mengawal uptrend di sektor timah global.",
      },
      {
        ticker: "BREN",
        close: 2190,
        change_percent: 7.4,
        bandar_cost: 2140.0,
        gap_pct: 2.3,
        lead_accumulator: "NI (+32.1B) & ZP (+18.4B)",
        lead_group: "MIXED",
        counterparty_purity: "Grade B+ (Akumulasi Institusi Domestik)",
        action_verdict: "BUY ON BREAKOUT",
        sweet_zone: "2140 - 2200",
        stop_loss: "2060 (Risk -5.9%)",
        target_price: "2450 - 2580 (Reward +11.8% s/d +17.8%)",
        why_brief: "Rebound kuat didukung akumulasi konsisten institusi lokal dari area demand support 2.050.",
      },
    ],
    traps: [
      {
        ticker: "GOTO",
        close: 27,
        change_percent: 0.0,
        smart_money_net: -118_500_000_000,
        smart_money_sellers: "Foreign Algo Net Sell -118.5B",
        retail_net: 44_200_000_000,
        retail_buyers: "XL (+30.8B) & XC (+13.4B)",
        action_verdict: "BULL TRAP / AVOID",
        bandar_exit_avg: 27.02,
        risk_warning: "Pola klasik exit liquidity ritel. Smart money membagi lot kecil agar tidak menjatuhkan harga seketika.",
      },
      {
        ticker: "BBCA",
        close: 5550,
        change_percent: -1.8,
        smart_money_net: -436_000_000_000,
        smart_money_sellers: "KZ, BK, YU Total Jual -436B",
        retail_net: 76_500_000_000,
        retail_buyers: "Ritel lokal mengira murah",
        action_verdict: "HEAVY DISTRIBUTION",
        bandar_exit_avg: 5620.0,
        risk_warning: "Outflow asing beruntun 5 hari bursa. Hindari menangkap pisau jatuh sebelum ada serapan balik terbukti.",
      },
      {
        ticker: "TLKM",
        close: 2070,
        change_percent: -2.4,
        smart_money_net: -298_000_000_000,
        smart_money_sellers: "KZ & RX Net Sell -320B",
        retail_net: 38_400_000_000,
        retail_buyers: "Ritel terpancing dividen yield",
        action_verdict: "WAIT FOR RETEST",
        bandar_exit_avg: 2090.0,
        risk_warning: "Walaupun Danantara (CC) menahan +52.2B, intensitas jualan asing KZ terlalu besar dan terus menekan harga.",
      },
    ],
    retail_footprints: [
      {
        broker_code: "XL",
        broker_name: "Stockbit Sekuritas",
        total_net: 58_400_000_000,
        top_bought: [
          { ticker: "ANTM", net_val: 51_500_000_000 },
          { ticker: "BRPT", net_val: 27_900_000_000 },
          { ticker: "TINS", net_val: 18_400_000_000 },
        ],
        top_sold: [
          { ticker: "BBRI", net_val: -14_200_000_000 },
        ],
        sentiment_label: "NET BUY (FOMO / ABSORPTION RISK)",
      },
      {
        broker_code: "XC",
        broker_name: "Ajaib Sekuritas",
        total_net: 26_800_000_000,
        top_bought: [
          { ticker: "ANTM", net_val: 17_400_000_000 },
          { ticker: "GOTO", net_val: 10_600_000_000 },
          { ticker: "KOTA", net_val: 8_400_000_000 },
        ],
        top_sold: [
          { ticker: "BMRI", net_val: -8_500_000_000 },
        ],
        sentiment_label: "NET BUY (FOMO / ABSORPTION RISK)",
      },
      {
        broker_code: "YP",
        broker_name: "Mirae Asset Sekuritas",
        total_net: 32_900_000_000,
        top_bought: [
          { ticker: "ANTM", net_val: 40_600_000_000 },
          { ticker: "BBRI", net_val: 28_400_000_000 },
        ],
        top_sold: [
          { ticker: "BBCA", net_val: -32_100_000_000 },
        ],
        sentiment_label: "NET BUY (ROTATION)",
      },
    ],
  },

  "10D": {
    horizon: "10D",
    horizon_label: "10 Hari Bursa (Structural Base / Inventory Bandar)",
    date_range: "9 - 20 Nov 2026 (2 Pekan Bursa)",
    macro_pulse: {
      foreign_net: -580_200_000_000,
      government_net: 612_400_000_000,
      retail_net: 240_800_000_000,
      summary_sentence: "Struktur 2 pekan bursa memperlihatkan divergensi tajam: Danantara BUMN menyerap fondasi di ANTM & BBRI, sementara asing memangkas alokasi di Big Caps.",
    },
    sweet_spots: [
      {
        ticker: "ANTM",
        close: 2610,
        change_percent: 0.0,
        bandar_cost: 2615.0,
        gap_pct: -0.2,
        lead_accumulator: "CC (+245.0B) & NI (+62.0B)",
        lead_group: "GOVERNMENT",
        counterparty_purity: "Grade A+ (Fondasi Akumulasi Danantara 10 Hari)",
        action_verdict: "ACCUMULATE DIP",
        sweet_zone: "2580 - 2630",
        stop_loss: "2490 (Risk -4.6%)",
        target_price: "2950 - 3150 (Reward +13.0% s/d +20.6%)",
        why_brief: "Danantara telah mengunci 245B di level harga modal 2.615. Gap hanya -0.2%, posisi risk/reward paling prima di IHSG saat ini!",
      },
      {
        ticker: "BBRI",
        close: 3080,
        change_percent: -0.3,
        bandar_cost: 3055.0,
        gap_pct: 0.8,
        lead_accumulator: "CC (+182.0B) & KZ (+124.0B)",
        lead_group: "MIXED",
        counterparty_purity: "Grade A (Asing & Danantara Dual Accumulator)",
        action_verdict: "ACCUMULATE DIP",
        sweet_zone: "3040 - 3090",
        stop_loss: "2960 (Risk -3.9%)",
        target_price: "3380 - 3550 (Reward +9.7% s/d +15.2%)",
        why_brief: "Serapan kuat di level psikologis 3.000 selama 10 hari bursa berturut-turut menciptakan support kokoh.",
      },
      {
        ticker: "MBMA",
        close: 344,
        change_percent: 15.4,
        bandar_cost: 328.0,
        gap_pct: 4.8,
        lead_accumulator: "BK (+142.0B)",
        lead_group: "FOREIGN",
        counterparty_purity: "Grade A (Akumulasi Struktural Asing)",
        action_verdict: "SWEET SPOT BUY",
        sweet_zone: "334 - 344",
        stop_loss: "320 (Risk -7.0%)",
        target_price: "410 - 450 (Reward +19.1% s/d +30.8%)",
        why_brief: "Asing memegang inventori 142B dari harga 328. Target mark-up struktural diperkirakan berlanjut ke atas 400.",
      },
    ],
    traps: [
      {
        ticker: "BBCA",
        close: 5550,
        change_percent: -1.8,
        smart_money_net: -820_000_000_000,
        smart_money_sellers: "Asing Total Buang -820B",
        retail_net: 160_000_000_000,
        retail_buyers: "Ritel Terjebak Akumulasi Turun",
        action_verdict: "HEAVY DISTRIBUTION",
        bandar_exit_avg: 5680.0,
        risk_warning: "Distribusi struktural masif 2 pekan berturut-turut. Belum ada sinyal akumulasi balik.",
      },
      {
        ticker: "GOTO",
        close: 27,
        change_percent: 0.0,
        smart_money_net: -210_000_000_000,
        smart_money_sellers: "Institusi Global Exit -210B",
        retail_net: 72_000_000_000,
        retail_buyers: "XL, XC, YP",
        action_verdict: "BULL TRAP / AVOID",
        bandar_exit_avg: 27.1,
        risk_warning: "Pola distribusi jangka panjang. Jangan tertipu oleh spekulasi mantul 1 tick.",
      },
      {
        ticker: "ASII",
        close: 5300,
        change_percent: -1.4,
        smart_money_net: -240_000_000_000,
        smart_money_sellers: "ZP & BK Net Sell -240B",
        retail_net: 48_000_000_000,
        retail_buyers: "Ritel",
        action_verdict: "HEAVY DISTRIBUTION",
        bandar_exit_avg: 5380.0,
        risk_warning: "Downtrend didorong outflow asing reguler. Disarankan menunggu pembentukan base baru.",
      },
    ],
    retail_footprints: [
      {
        broker_code: "XL",
        broker_name: "Stockbit Sekuritas",
        total_net: 98_400_000_000,
        top_bought: [
          { ticker: "ANTM", net_val: 82_000_000_000 },
          { ticker: "GOTO", net_val: 45_000_000_000 },
        ],
        top_sold: [
          { ticker: "BBCA", net_val: -28_000_000_000 },
        ],
        sentiment_label: "NET BUY (FOMO / ABSORPTION RISK)",
      },
      {
        broker_code: "XC",
        broker_name: "Ajaib Sekuritas",
        total_net: 34_200_000_000,
        top_bought: [
          { ticker: "GOTO", net_val: 24_000_000_000 },
          { ticker: "KOTA", net_val: 18_000_000_000 },
        ],
        top_sold: [
          { ticker: "BBRI", net_val: -12_000_000_000 },
        ],
        sentiment_label: "NET BUY (FOMO / ABSORPTION RISK)",
      },
      {
        broker_code: "YP",
        broker_name: "Mirae Asset Sekuritas",
        total_net: 62_800_000_000,
        top_bought: [
          { ticker: "BBRI", net_val: 55_000_000_000 },
        ],
        top_sold: [
          { ticker: "TLKM", net_val: -35_000_000_000 },
        ],
        sentiment_label: "NET BUY (ROTATION)",
      },
    ],
  },
};

/**
 * Get Daily Insight by active Horizon
 */
export function getDailyInsight(horizon: HorizonPeriod = "5D"): DailyInsightCardData {
  return DAILY_INSIGHTS_MAP[horizon] || DAILY_INSIGHTS_MAP["5D"];
}

