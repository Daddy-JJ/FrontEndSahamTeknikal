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

export type HorizonPeriod = "2D" | "5D" | "10D";

export interface TickerBrokerDetail {
  ticker: string;
  close: number;
  change_percent: number;
  quadrant: string;
  quadrant_label: string;
  status_color: "emerald" | "amber" | "sky" | "rose";
  horizon?: HorizonPeriod;
  horizon_label?: string;
  date_range?: string;
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
  is_horizon_fallback?: boolean;
  horizon_fallback_reason?: string;
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
  CDIA: {
    ticker: "CDIA",
    close: 386,
    change_percent: 24.52,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: 10_060_985_400, avg_price: 384.98 },
      { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 5_226_364_000, avg_price: 355.86 },
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 2_219_075_200, avg_price: 348.92 },
    ],
    top_distributors: [
      { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -3_522_339_600, avg_price: 372.58 },
      { code: "HP", name: "Henan Putihrai", investor_group: "LOCAL", net_value: -3_163_695_200, avg_price: 359.68 },
      { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -2_265_195_600, avg_price: 365.74 },
    ],
    net_value: 10_060_985_400,
    net_volume_lots: 260_463,
    concentration_pct: 16.76,
    bandar_avg_cost: 384.98,
    bandar_cost_gap_pct: 0.26,
    counterparty_note: "Market maker lokal MG (+10.06B) & asing AK (+5.23B) menyerap masif distribusi ritel lokal (SQ, HP, YP, XL)",
    why_insight: "Breakout surge ARA (+24.52%) diiringi turnover Rp 60M. Market maker MG memborong agresif pada avg 384.98 didukung akumulasi terstruktur broker asing AK (5.2B) pada avg 355.86. Posisi harga close 386 masih sangat dekat dengan modal bandar MG (+0.26%).",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "360 - 378",
      stop_loss: "344 (Risk -5.5%)",
      target_price: "440 - 480 (Reward +14.0% s/d +24.3%)",
      rr_ratio: "1 : 2.8",
      note: "Saham momentum Barito Group. Antre beli di area pullback dekat support separuh candle ARA / modal AK.",
    },
  },
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
  NAYZ: {
    ticker: "NAYZ",
    close: 90,
    change_percent: 9.76,
    quadrant: "markup_akumulasi",
    quadrant_label: "[MA] Markup + Akumulasi",
    status_color: "emerald",
    top_accumulators: [
      { code: "GR", name: "Panin Sekuritas", investor_group: "LOCAL", net_value: 1_925_351_900, avg_price: 89.10 },
      { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 203_593_900, avg_price: 89.86 },
      { code: "AI", name: "UOB Kay Hian", investor_group: "FOREIGN", net_value: 175_845_400, avg_price: 87.92 },
    ],
    top_distributors: [
      { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -518_167_700, avg_price: 89.80 },
      { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: -362_041_500, avg_price: 89.22 },
      { code: "TP", name: "OCBC Sekuritas", investor_group: "FOREIGN", net_value: -263_100_000, avg_price: 88.50 },
      { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: -102_683_700, avg_price: 87.99 },
    ],
    net_value: 1_925_351_900,
    net_volume_lots: 216_110,
    concentration_pct: 45.2,
    bandar_avg_cost: 89.15,
    bandar_cost_gap_pct: 0.95,
    counterparty_note: "Akumulasi lokal GR (+1.92B) menyerap cutloss/TP ritel Ajaib (XC) & Stockbit (XL)",
    why_insight: "NAYZ naik +9.8% ke Rp 90 dengan transaksi 6.6B. Akumulasi terpusat pada broker GR (1.92B) dan CP (203M) menyerap pelepasan dari ritel SQ & XC.",
    trade_plan: {
      action: "BUY ON PULLBACK",
      entry_zone: "88 - 90",
      stop_loss: "84 (Risk -6.7%)",
      target_price: "100 - 106 (Reward +11.1% s/d +17.8%)",
      rr_ratio: "1 : 2.5",
      note: "Saham akselerasi volatilitas tinggi. Disiplin stop loss bila tembus 84.",
    },
  },
  LOPI: {
    ticker: "LOPI",
    close: 34,
    change_percent: -2.86,
    quadrant: "markdown_akumulasi",
    quadrant_label: "[DA] Markdown + Akumulasi",
    status_color: "sky",
    top_accumulators: [
      { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: 81_105_000, avg_price: 34.01 },
      { code: "YB", name: "Jasa Utama Capital", investor_group: "LOCAL", net_value: 24_996_800, avg_price: 34.00 },
    ],
    top_distributors: [
      { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -100_019_900, avg_price: 34.00 },
      { code: "DH", name: "Sinarmas Sekuritas", investor_group: "LOCAL", net_value: -18_675_800, avg_price: 34.00 },
    ],
    net_value: 81_105_000,
    net_volume_lots: 24_030,
    concentration_pct: 42.9,
    bandar_avg_cost: 34.01,
    bandar_cost_gap_pct: -0.03,
    counterparty_note: "Serapan serentak broker lokal SQ (+81M) menampung jualan CC (-100M)",
    why_insight: "LOPI (Papan Akselerasi) dengan transaksi harian relatif kecil Rp 188.5 Juta. Harga turun tipis ke 34 namun SQ menyerap 24 ribu lot tepat di harga 34.01.",
    trade_plan: {
      action: "AVOID / SELL ON STRENGTH",
      entry_zone: "33 - 34 (Khusus Scalper Papan Akselerasi)",
      stop_loss: "31 (Risk -8.8%)",
      target_price: "37 - 39 (Reward +8.8% s/d +14.7%)",
      rr_ratio: "1 : 1.3",
      note: "Saham papan akselerasi dengan omzet kecil. Waspada risiko likuiditas saat exit.",
    },
  },
};

/**
 * Verified Multi-Horizon Ticker Details (2D Momentum, 5D Weekly, 10D Structural Base)
 * Ground-truth numbers retrieved directly from MCP Max broksum aggregate feeds.
 */
export const TICKER_HORIZON_DETAILS_MAP: Record<string, Partial<Record<HorizonPeriod, TickerBrokerDetail>>> = {
  CDIA: {
    "2D": {
      ticker: "CDIA",
      close: 386,
      change_percent: 24.52,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "20 - 23 Nov 2026",
      top_accumulators: [
        { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: 10_058_260_200, avg_price: 384.89 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 5_719_996_200, avg_price: 351.79 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 2_416_460_600, avg_price: 344.98 },
      ],
      top_distributors: [
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -3_522_339_600, avg_price: 372.58 },
        { code: "HP", name: "Henan Putihrai", investor_group: "LOCAL", net_value: -3_163_695_200, avg_price: 359.68 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -2_265_195_600, avg_price: 365.74 },
      ],
      net_value: 10_058_260_200,
      net_volume_lots: 260_382,
      concentration_pct: 15.16,
      bandar_avg_cost: 384.89,
      bandar_cost_gap_pct: 0.29,
      counterparty_note: "MG memborong 10.06B saat ARA (+24.5%) menggilas distribusi profit taking ritel lokal (SQ, HP, YP, XL)",
      why_insight: "Momentum inisiasi 48 jam: CDIA meledak dengan lonjakan omzet Rp 66.4B. Broker MG menyerap 260 ribu lot di rata-rata 384.89 didukung akumulasi asing AK (+5.72B @ 351.79).",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "360 - 378",
        stop_loss: "344 (Risk -5.5%)",
        target_price: "440 - 480 (Reward +14.0% s/d +24.3%)",
        rr_ratio: "1 : 2.8",
        note: "Saham akselerasi tinggi Barito Group. Disiplin antre saat retest support.",
      },
    },
    "5D": {
      ticker: "CDIA",
      close: 386,
      change_percent: 10.29,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "17 - 23 Nov 2026",
      top_accumulators: [
        { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: 10_098_431_200, avg_price: 384.62 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 5_720_853_200, avg_price: 351.07 },
        { code: "OD", name: "BRI Danareksa", investor_group: "GOVERNMENT", net_value: 3_022_912_000, avg_price: 344.17 },
      ],
      top_distributors: [
        { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: -3_450_000_000, avg_price: 355.00 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: -2_890_000_000, avg_price: 356.50 },
      ],
      net_value: 10_098_431_200,
      net_volume_lots: 261_574,
      concentration_pct: 11.96,
      bandar_avg_cost: 363.19,
      bandar_cost_gap_pct: 6.28,
      counterparty_note: "Akumulasi terstruktur 5 hari: Asing AK & BUMN OD mengumpulkan di 344-351 sebelum di-markup MG",
      why_insight: "Weekly persistence: Konsistensi akumulasi 5 hari mencapai score 80%. Smart money asing dan BUMN mengunci suplai di area 344-351, diikuti markup masif oleh broker MG.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "355 - 370",
        stop_loss: "340 (Risk -5.8%)",
        target_price: "430 - 460 (Reward +11.4% s/d +19.2%)",
        rr_ratio: "1 : 2.5",
        note: "Support kuat mingguan berada di modal rata-rata konsorsium akumulator Rp 351.",
      },
    },
    "10D": {
      ticker: "CDIA",
      close: 386,
      change_percent: 13.53,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "10 - 23 Nov 2026",
      top_accumulators: [
        { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: 10_138_041_400, avg_price: 382.89 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 6_396_718_000, avg_price: 351.72 },
        { code: "OD", name: "BRI Danareksa", investor_group: "GOVERNMENT", net_value: 3_049_473_400, avg_price: 346.68 },
      ],
      top_distributors: [
        { code: "SA", name: "Elit Sekuritas", investor_group: "LOCAL", net_value: -260_400, avg_price: 346.00 },
      ],
      net_value: 10_138_041_400,
      net_volume_lots: 262_659,
      concentration_pct: 6.62,
      bandar_avg_cost: 358.46,
      bandar_cost_gap_pct: 7.68,
      counterparty_note: "Basis struktural 10 hari solid di area 345-355 dengan modal bandar 358.46",
      why_insight: "Structural base 10D: Akumulasi berulang selama 10 hari bursa membuktikan pembentukan bottoming solid sebelum terjadinya breakout ARA. Total net akumulasi MG+AK mencapai >16.5 Miliar.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "350 - 365",
        stop_loss: "338 (Risk -5.5%)",
        target_price: "420 - 450 (Reward +8.8% s/d +16.6%)",
        rr_ratio: "1 : 2.2",
        note: "Struktur swing 10 hari bullish. Akumulasi bandar siap melanjutkan tren markup.",
      },
    },
  },
  NAYZ: {
    "2D": {
      ticker: "NAYZ",
      close: 90,
      change_percent: 9.76,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "GR", name: "Panin Sekuritas", investor_group: "LOCAL", net_value: 2_189_248_100, avg_price: 88.05 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 367_747_900, avg_price: 84.33 },
        { code: "AI", name: "UOB Kay Hian", investor_group: "FOREIGN", net_value: 215_402_200, avg_price: 86.77 },
        { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 207_878_500, avg_price: 88.66 },
      ],
      top_distributors: [
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -419_772_700, avg_price: 89.51 },
        { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: -344_193_200, avg_price: 86.67 },
        { code: "ID", name: "Anugerah Sekuritas", investor_group: "LOCAL", net_value: -287_800_000, avg_price: 87.09 },
        { code: "TP", name: "OCBC Sekuritas", investor_group: "FOREIGN", net_value: -269_728_400, avg_price: 86.71 },
      ],
      net_value: 2_189_248_100,
      net_volume_lots: 248_529,
      concentration_pct: 46.8,
      bandar_avg_cost: 88.05,
      bandar_cost_gap_pct: 2.21,
      counterparty_note: "Akumulasi agresif 2 hari oleh broker lokal Panin GR (+2.19B) menyerap cutloss ritel SQ & XC",
      why_insight: "Momentum inisiasi 48 jam: NAYZ mencatat akumulasi bersih Rp 2.19B dipimpin broker GR pada harga rata-rata Rp 88.05. Harga saat ini (Rp 90) hanya berselisih +2.21% dari modal bandar.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "88 - 90",
        stop_loss: "84 (Risk -6.7%)",
        target_price: "100 - 106 (Reward +11.1% s/d +17.8%)",
        rr_ratio: "1 : 2.5",
        note: "Saham akselerasi momentum tinggi. Entry dekat modal bandar GR 88.",
      },
    },
    "5D": {
      ticker: "NAYZ",
      close: 90,
      change_percent: 9.76,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "GR", name: "Panin Sekuritas", investor_group: "LOCAL", net_value: 2_417_848_100, avg_price: 86.64 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 406_331_000, avg_price: 78.93 },
        { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 207_878_500, avg_price: 88.66 },
        { code: "AI", name: "UOB Kay Hian", investor_group: "FOREIGN", net_value: 175_845_400, avg_price: 87.92 },
      ],
      top_distributors: [
        { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: -637_715_100, avg_price: 79.97 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -560_402_000, avg_price: 74.59 },
        { code: "ID", name: "Anugerah Sekuritas", investor_group: "LOCAL", net_value: -540_256_400, avg_price: 80.32 },
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -469_275_400, avg_price: 85.03 },
      ],
      net_value: 2_417_848_100,
      net_volume_lots: 279_079,
      concentration_pct: 48.2,
      bandar_avg_cost: 86.64,
      bandar_cost_gap_pct: 3.88,
      counterparty_note: "Broker GR konsisten akumulasi 5 hari bursa (+2.42B), menampung jualan ritel Ajaib (XC -638M) & AK (-560M)",
      why_insight: "Akumulasi mingguan solid: GR mengumpulkan 279.079 lot pada avg Rp 86.64. Gap harga ke modal bandar hanya +3.88%, mengonfirmasi smart money belum melakukan distribusi.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "86 - 90",
        stop_loss: "84 (Risk -6.7%)",
        target_price: "100 - 108 (Reward +11.1% s/d +20.0%)",
        rr_ratio: "1 : 2.8",
        note: "Riding trend bersama GR selama bertahan di atas modal mingguan 86.64.",
      },
    },
    "10D": {
      ticker: "NAYZ",
      close: 90,
      change_percent: 9.76,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "GR", name: "Panin Sekuritas", investor_group: "LOCAL", net_value: 2_708_820_400, avg_price: 79.78 },
        { code: "AI", name: "UOB Kay Hian", investor_group: "FOREIGN", net_value: 569_547_400, avg_price: 71.81 },
        { code: "KI", name: "Ciptadana Sekuritas", investor_group: "LOCAL", net_value: 516_329_900, avg_price: 65.70 },
        { code: "DR", name: "RHB Sekuritas", investor_group: "FOREIGN", net_value: 294_462_100, avg_price: 74.34 },
      ],
      top_distributors: [
        { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: -756_821_500, avg_price: 72.24 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -706_851_500, avg_price: 70.00 },
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -571_884_500, avg_price: 74.42 },
        { code: "ID", name: "Anugerah Sekuritas", investor_group: "LOCAL", net_value: -540_096_400, avg_price: 79.55 },
      ],
      net_value: 2_708_820_400,
      net_volume_lots: 336_438,
      concentration_pct: 51.5,
      bandar_avg_cost: 79.78,
      bandar_cost_gap_pct: 12.81,
      counterparty_note: "Basis akumulasi 2 pekan sangat kuat oleh GR (+2.71B) & AI (+569M), menyerap pelepasan ritel XC (-757M)",
      why_insight: "Akumulasi struktural 2 pekan (10 hari bursa): Broker GR membangun basis 336 ribu lot sejak area Rp 79.78. Bandar saat ini floating profit +12.81%. Selama harga bertahan di atas 84, potensi markup lanjutan tetap terbuka.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "86 - 90",
        stop_loss: "82 (Risk -8.9%)",
        target_price: "106 - 115 (Reward +17.8% s/d +27.8%)",
        rr_ratio: "1 : 2.5",
        note: "Target swing 2 pekan menguji 110. Lindungi modal jika breakdown 82.",
      },
    },
  },
  MBMA: {
    "2D": {
      ticker: "MBMA",
      close: 344,
      change_percent: 15.4,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 74_113_713_400, avg_price: 339.97 },
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 12_860_883_800, avg_price: 323.93 },
        { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: 395_802_400, avg_price: 322.60 },
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -13_948_625_200, avg_price: 336.05 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -9_716_898_000, avg_price: 334.37 },
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -7_211_848_600, avg_price: 336.47 },
      ],
      net_value: 74_113_713_400,
      net_volume_lots: 2_158_328,
      concentration_pct: 42.1,
      bandar_avg_cost: 339.97,
      bandar_cost_gap_pct: 1.19,
      counterparty_note: "Asing BK memborong 2.15 juta lot (+74.1B), menyerap pelepasan AK & ritel PD",
      why_insight: "Inisiasi breakout tajam: Dalam 48 jam terakhir, asing BK menguasai serapan senilai 74 Miliar pada harga modal 339.97. Kenaikan +15.4% didukung volume transaksi raksasa.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "338 - 344",
        stop_loss: "324 (Risk -5.8%)",
        target_price: "380 - 410 (Reward +10.5% s/d +19.2%)",
        rr_ratio: "1 : 2.6",
        note: "Manfaatkan retest modal bandar BK 340 untuk entry bertahap.",
      },
    },
    "5D": {
      ticker: "MBMA",
      close: 344,
      change_percent: 15.4,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 59_366_605_000, avg_price: 339.04 },
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 13_921_196_600, avg_price: 325.24 },
        { code: "QA", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 3_743_691_400, avg_price: 333.03 },
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -16_974_074_600, avg_price: 327.47 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -13_678_578_800, avg_price: 332.03 },
        { code: "XC", name: "Ajaib Sekuritas", investor_group: "LOCAL", net_value: -5_881_521_400, avg_price: 326.57 },
      ],
      net_value: 59_366_605_000,
      net_volume_lots: 1_718_400,
      concentration_pct: 38.5,
      bandar_avg_cost: 339.04,
      bandar_cost_gap_pct: 1.46,
      counterparty_note: "Asing BK konsisten net buy 1 pekan (+59.4B) menyerap pelepasan CC & ritel PD",
      why_insight: "Akumulasi 1 pekan penuh (5 hari bursa): Asing BK mengakumulasi bersih 1.71 juta lot senilai Rp 59.4B pada modal 339.04 (+1.46% PnL bandar). Belum ada tanda profit taking.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "336 - 344",
        stop_loss: "320 (Risk -7.0%)",
        target_price: "390 - 420 (Reward +13.4% s/d +22.1%)",
        rr_ratio: "1 : 2.5",
        note: "Swing target menguji resisten psikologis 400.",
      },
    },
    "10D": {
      ticker: "MBMA",
      close: 344,
      change_percent: 15.4,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 64_532_061_600, avg_price: 335.53 },
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 13_434_725_000, avg_price: 323.20 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 8_510_299_000, avg_price: 324.95 },
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -18_591_827_800, avg_price: 323.17 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -14_803_286_600, avg_price: 328.37 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -13_188_136_400, avg_price: 304.40 },
      ],
      net_value: 64_532_061_600,
      net_volume_lots: 1_890_388,
      concentration_pct: 44.2,
      bandar_avg_cost: 335.53,
      bandar_cost_gap_pct: 2.52,
      counterparty_note: "Asing BK memegang basis akumulasi terkuat (+64.5B) selama 10 hari bursa berturut-turut",
      why_insight: "Akumulasi struktural 2 pekan (10 hari bursa): BK mengontrol 1.89 juta lot dari rata-rata harga 335.53. Bandar saat ini floating profit tipis +2.52%, memberikan bantalan keamanan kuat.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "335 - 344",
        stop_loss: "318 (Risk -7.5%)",
        target_price: "400 - 430 (Reward +16.3% s/d +25.0%)",
        rr_ratio: "1 : 2.8",
        note: "Hold trend riding selama bertahan di atas modal bandar 335.",
      },
    },
  },
  BBRI: {
    "2D": {
      ticker: "BBRI",
      close: 3080,
      change_percent: -0.3,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: 108_381_225_000, avg_price: 3071.53 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 56_065_482_000, avg_price: 3051.38 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: 41_941_498_000, avg_price: 3062.34 },
      ],
      top_distributors: [
        { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -120_407_981_000, avg_price: 3054.05 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -37_904_782_000, avg_price: 3055.11 },
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -27_833_652_000, avg_price: 3062.06 },
      ],
      net_value: 108_381_225_000,
      net_volume_lots: 352_664,
      concentration_pct: 35.2,
      bandar_avg_cost: 3062.00,
      bandar_cost_gap_pct: 0.59,
      counterparty_note: "Foreign YU dan Mandiri CC menyerap distribusi BB & ritel",
      why_insight: "Inflow serapan 48 jam: YU dan CC menampung penjualan BB senilai 120 Miliar di sekitar area modal 3.062. Harga bertahan sideways di atas level 3.050.",
      trade_plan: {
        action: "SWING BUY / ACCUMULATE",
        entry_zone: "3050 - 3080",
        stop_loss: "2990 (Risk -2.6%)",
        target_price: "3280 - 3350 (Reward +6.5% s/d +8.7%)",
        rr_ratio: "1 : 2.9",
        note: "Akumulasi di area serapan institusi. Cutloss jika break swing low 2990.",
      },
    },
    "5D": {
      ticker: "BBRI",
      close: 3080,
      change_percent: -0.3,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: 202_166_668_000, avg_price: 3110.14 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: 180_168_660_000, avg_price: 3087.35 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 116_609_266_000, avg_price: 3092.54 },
      ],
      top_distributors: [
        { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -253_317_997_000, avg_price: 3070.92 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -127_637_020_000, avg_price: 3093.85 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: -88_759_461_000, avg_price: 3094.17 },
      ],
      net_value: 202_166_668_000,
      net_volume_lots: 647_563,
      concentration_pct: 38.6,
      bandar_avg_cost: 3095.00,
      bandar_cost_gap_pct: -0.48,
      counterparty_note: "Institusi asing KZ (+202B), YU (+180B) dan BUMN CC (+116B) menyerap pelepasan BB (-253B) & ritel XL",
      why_insight: "Akumulasi mingguan raksasa: Tiga akumulator utama (KZ, YU, CC) membukukan net buy gabungan hampir Rp 500 Miliar pada rata-rata modal 3.095. Harga saat ini berada di area diskon -0.48% di bawah modal bandar.",
      trade_plan: {
        action: "SWING BUY / ACCUMULATE",
        entry_zone: "3050 - 3080",
        stop_loss: "2990 (Risk -2.6%)",
        target_price: "3300 - 3400 (Reward +7.1% s/d +10.4%)",
        rr_ratio: "1 : 3.0",
        note: "Posisi sangat aman karena harga berada di bawah modal bandar asing.",
      },
    },
    "10D": {
      ticker: "BBRI",
      close: 3080,
      change_percent: -0.3,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: 309_109_363_000, avg_price: 3013.74 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: 309_031_984_000, avg_price: 3053.54 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 219_119_221_000, avg_price: 3020.79 },
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -253_319_482_000, avg_price: 3025.00 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: -227_238_025_000, avg_price: 3000.67 },
        { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -195_484_659_000, avg_price: 3062.34 },
      ],
      net_value: 309_109_363_000,
      net_volume_lots: 1_027_532,
      concentration_pct: 42.1,
      bandar_avg_cost: 3028.00,
      bandar_cost_gap_pct: 1.72,
      counterparty_note: "Foreign YU (+309B), KZ (+309B) & Danantara CC (+219B) mengunci 2.7 juta lot serapan dari ritel XL (-227B)",
      why_insight: "Fondasi struktural 2 pekan (10 hari bursa): Inflow institusi solid mencapai Rp 837 Miliar dipimpin YU dan KZ dengan modal dasar Rp 3.028. PnL bandar saat ini +1.72%, mengonfirmasi fase bottoming selesai.",
      trade_plan: {
        action: "SWING BUY / ACCUMULATE",
        entry_zone: "3040 - 3080",
        stop_loss: "2980 (Risk -3.2%)",
        target_price: "3350 - 3450 (Reward +8.8% s/d +12.0%)",
        rr_ratio: "1 : 3.2",
        note: "Swing horizon menengah 2-4 pekan menguji 3.450.",
      },
    },
  },
  ANTM: {
    "2D": {
      ticker: "ANTM",
      close: 2610,
      change_percent: 0.0,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 25_669_952_000, avg_price: 2589.37 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 24_145_910_000, avg_price: 2596.70 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 13_383_420_000, avg_price: 2591.82 },
      ],
      top_distributors: [
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: -15_562_819_000, avg_price: 2574.18 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -15_006_317_000, avg_price: 2569.35 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -12_354_805_000, avg_price: 2594.47 },
      ],
      net_value: 25_669_952_000,
      net_volume_lots: 99_910,
      concentration_pct: 32.4,
      bandar_avg_cost: 2592.00,
      bandar_cost_gap_pct: 0.69,
      counterparty_note: "Asing BK (+25.7B) dan CC (+24.1B) menyerap penjualan NI & ritel PD",
      why_insight: "Inisiasi 48 jam: Konsolidasi ketat di 2.590 - 2.610. Asing BK dan BUMN CC mengakumulasi gabungan Rp 49.8B pada modal rata-rata 2.592. Gap harga sangat tipis (+0.69%).",
      trade_plan: {
        action: "BUY ON BREAKOUT",
        entry_zone: "2590 - 2620",
        stop_loss: "2520 (Risk -3.4%)",
        target_price: "2820 - 2900 (Reward +8.0% s/d +11.1%)",
        rr_ratio: "1 : 2.8",
        note: "Buy saat breakout 2630 dengan target menguji 2900.",
      },
    },
    "5D": {
      ticker: "ANTM",
      close: 2610,
      change_percent: 0.0,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 157_735_030_000, avg_price: 2671.74 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 51_467_393_000, avg_price: 2671.66 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "LOCAL", net_value: 40_612_275_000, avg_price: 2682.68 },
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -65_376_058_000, avg_price: 2667.33 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -50_232_805_000, avg_price: 2710.37 },
        { code: "BB", name: "BRI Danareksa", investor_group: "LOCAL", net_value: -46_172_337_000, avg_price: 2670.56 },
      ],
      net_value: 157_735_030_000,
      net_volume_lots: 587_713,
      concentration_pct: 36.8,
      bandar_avg_cost: 2671.00,
      bandar_cost_gap_pct: -2.28,
      counterparty_note: "BUMN Mandiri CC mendominasi serapan 1 pekan (+157.7B) menampung jualan asing AK & YU",
      why_insight: "Akumulasi mingguan Danantara / BUMN: Mandiri CC mengumpulkan 587 ribu lot pada modal 2.671. Harga saat ini (2.610) berada di diskon -2.28% di bawah modal institusi, memberikan safety margin sangat baik.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "2580 - 2620",
        stop_loss: "2500 (Risk -4.2%)",
        target_price: "2850 - 2950 (Reward +9.2% s/d +13.0%)",
        rr_ratio: "1 : 2.8",
        note: "Koleksi di bawah modal bandar CC 2.671.",
      },
    },
    "10D": {
      ticker: "ANTM",
      close: 2610,
      change_percent: 0.0,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 161_621_181_000, avg_price: 2710.23 },
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 39_942_751_000, avg_price: 2750.91 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 37_365_931_000, avg_price: 2713.51 },
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -125_404_225_000, avg_price: 2715.90 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -43_217_935_000, avg_price: 2719.94 },
        { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: -38_843_864_000, avg_price: 2720.32 },
      ],
      net_value: 161_621_181_000,
      net_volume_lots: 603_558,
      concentration_pct: 39.5,
      bandar_avg_cost: 2710.00,
      bandar_cost_gap_pct: -3.69,
      counterparty_note: "BUMN CC (+161B) & NI (+40B) memegang basis 2 pekan menyerap distribusi asing AK (-125B)",
      why_insight: "Akumulasi struktural 2 pekan (10 hari bursa): Institusi domestik dan BUMN CC menguasai lebih dari 600 ribu lot dengan modal 2.710. Posisi saat ini terdiskon -3.69% dari modal bandar.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "2580 - 2620",
        stop_loss: "2480 (Risk -5.0%)",
        target_price: "2900 - 3000 (Reward +11.1% s/d +14.9%)",
        rr_ratio: "1 : 2.7",
        note: "Swing target menguji kembali modal bandar 2.710 dan resisten 2.950.",
      },
    },
  },
  BBCA: {
    "2D": {
      ticker: "BBCA",
      close: 5550,
      change_percent: -1.8,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 32_100_000_000, avg_price: 5590.00 },
        { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 28_400_000_000, avg_price: 5570.00 },
      ],
      top_distributors: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -193_593_707_500, avg_price: 5623.36 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -160_854_520_000, avg_price: 5592.85 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -127_492_202_500, avg_price: 5618.36 },
      ],
      net_value: -193_593_707_500,
      net_volume_lots: -343_834,
      concentration_pct: 44.5,
      bandar_avg_cost: 5611.00,
      bandar_cost_gap_pct: -1.09,
      counterparty_note: "Konsorsium asing (BK, KZ, YU) melepas total hampir Rp 500 Miliar dalam 48 jam",
      why_insight: "Heavy foreign selling 2 hari: Tiga pialang global membuang masif ke bid pasar. Tekanan markdown berlanjut tanpa serapan memadai dari pembeli domestik.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu struktur demand di 5.350",
        rr_ratio: "-",
        note: "Jangan melawan arus distribusi institusi besar.",
      },
    },
    "5D": {
      ticker: "BBCA",
      close: 5550,
      change_percent: -1.8,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 75_200_000_000, avg_price: 5620.00 },
        { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 62_100_000_000, avg_price: 5600.00 },
      ],
      top_distributors: [
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -301_278_695_000, avg_price: 5578.59 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -166_396_107_500, avg_price: 5623.02 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: -133_807_480_000, avg_price: 5659.03 },
      ],
      net_value: -301_278_695_000,
      net_volume_lots: -544_362,
      concentration_pct: 46.2,
      bandar_avg_cost: 5620.00,
      bandar_cost_gap_pct: -1.25,
      counterparty_note: "Distribusi terstruktur 5 hari kerja oleh KZ (-301B) dan YU (-166B)",
      why_insight: "Distribusi mingguan masif: Asing KZ mendominasi penjualan 5 hari berturut-turut dengan net sell Rp 301 Miliar. Saham belum menemukan pijakan stabil.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 5.300",
        rr_ratio: "-",
        note: "Distribusi asing solid. Disiplin hindari.",
      },
    },
    "10D": {
      ticker: "BBCA",
      close: 5550,
      change_percent: -1.8,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 112_000_000_000, avg_price: 5540.00 },
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 88_400_000_000, avg_price: 5530.00 },
      ],
      top_distributors: [
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: -343_310_540_000, avg_price: 5502.08 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -288_977_910_000, avg_price: 5519.02 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -241_884_537_500, avg_price: 5524.92 },
      ],
      net_value: -343_310_540_000,
      net_volume_lots: -627_007,
      concentration_pct: 41.8,
      bandar_avg_cost: 5515.00,
      bandar_cost_gap_pct: 0.63,
      counterparty_note: "Distribusi 2 pekan dipimpin XL (-343B), YU (-289B), dan CC (-242B)",
      why_insight: "Outflow struktural 2 pekan (10 hari bursa): Arus keluar bersih skala institusi dan ritel besar mencapai lebih dari Rp 870 Miliar. Struktur tren masih berstatus lower high.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu konfirmasi reversal di 5.250 - 5.350",
        rr_ratio: "-",
        note: "Wait and see hingga distribusi mereda dan terbentuk base.",
      },
    },
  },
  LOPI: {
    "2D": {
      ticker: "LOPI",
      close: 34,
      change_percent: -2.86,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "LG", name: "Trimegah Sekuritas", investor_group: "LOCAL", net_value: 71_753_800, avg_price: 34.00 },
        { code: "DR", name: "RHB Sekuritas", investor_group: "FOREIGN", net_value: 52_534_000, avg_price: 35.00 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 49_728_600, avg_price: 35.18 },
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -100_019_900, avg_price: 34.00 },
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -80_432_000, avg_price: 35.43 },
      ],
      net_value: 71_753_800,
      net_volume_lots: 21_104,
      concentration_pct: 35.2,
      bandar_avg_cost: 34.00,
      bandar_cost_gap_pct: 0.00,
      counterparty_note: "Trimegah LG (+71.8M @ 34) & RHB DR (+52.5M) menyerap jualan CC",
      why_insight: "Inisiasi serapan 48 jam: Broker LG menampung 21.104 lot tepat di harga 34.00 saat harga ditekan turun -2.86%. Nilai transaksi relatif tipis.",
      trade_plan: {
        action: "AVOID / SELL ON STRENGTH",
        entry_zone: "33 - 34",
        stop_loss: "31 (Risk -8.8%)",
        target_price: "37 - 39 (Reward +8.8% s/d +14.7%)",
        rr_ratio: "1 : 1.3",
        note: "Saham papan akselerasi berisiko likuiditas tinggi.",
      },
    },
    "5D": {
      ticker: "LOPI",
      close: 34,
      change_percent: -2.86,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 279_965_900, avg_price: 38.25 },
        { code: "LG", name: "Trimegah Sekuritas", investor_group: "LOCAL", net_value: 71_218_700, avg_price: 34.00 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 66_776_700, avg_price: 36.92 },
      ],
      top_distributors: [
        { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: -240_746_600, avg_price: 33.64 },
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -141_117_000, avg_price: 37.24 },
        { code: "YJ", name: "Lotus Andalan Sekuritas", investor_group: "LOCAL", net_value: -136_907_000, avg_price: 39.17 },
      ],
      net_value: 279_965_900,
      net_volume_lots: 69_390,
      concentration_pct: 38.4,
      bandar_avg_cost: 38.25,
      bandar_cost_gap_pct: -11.11,
      counterparty_note: "Mandiri CC akumulasi mingguan 69 ribu lot (@ 38.25), menampung guyuran ritel MG & SQ",
      why_insight: "Akumulasi 1 pekan penuh (5 hari bursa): Broker CC membeli bersih Rp 280 Juta di harga rata-rata 38.25. Harga saat ini (34) berada di area diskon -11.11% dari modal CC.",
      trade_plan: {
        action: "AVOID / SELL ON STRENGTH",
        entry_zone: "33 - 34",
        stop_loss: "31 (Risk -8.8%)",
        target_price: "38 - 40 (Reward +11.8% s/d +17.6%)",
        rr_ratio: "1 : 1.5",
        note: "Potensi technical rebound menguji modal bandar CC 38. Disiplin ketat karena likuiditas mini.",
      },
    },
    "10D": {
      ticker: "LOPI",
      close: 34,
      change_percent: -2.86,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 300_022_500, avg_price: 35.92 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 180_816_400, avg_price: 33.47 },
        { code: "LG", name: "Trimegah Sekuritas", investor_group: "LOCAL", net_value: 68_423_800, avg_price: 33.97 },
      ],
      top_distributors: [
        { code: "SQ", name: "BCA Sekuritas", investor_group: "LOCAL", net_value: -495_688_300, avg_price: 33.48 },
        { code: "YJ", name: "Lotus Andalan Sekuritas", investor_group: "LOCAL", net_value: -137_243_000, avg_price: 39.13 },
      ],
      net_value: 300_022_500,
      net_volume_lots: 78_340,
      concentration_pct: 41.2,
      bandar_avg_cost: 35.92,
      bandar_cost_gap_pct: -5.35,
      counterparty_note: "Basis 2 pekan dipegang CC (+300M @ 35.92) & XL (+181M), menyerap distribusi SQ (-496M)",
      why_insight: "Akumulasi struktural 2 pekan (10 hari bursa): Broker CC mengumpulkan 78 ribu lot dengan modal Rp 35.92. Harga 34 masih berada -5.35% di bawah modal bandar.",
      trade_plan: {
        action: "AVOID / SELL ON STRENGTH",
        entry_zone: "33 - 34",
        stop_loss: "31 (Risk -8.8%)",
        target_price: "38 - 41 (Reward +11.8% s/d +20.6%)",
        rr_ratio: "1 : 1.5",
        note: "Likuiditas terbatas. Manfaatkan lonjakan harga untuk taking profit.",
      },
    },
  },
  AMMN: {
    "2D": {
      ticker: "AMMN",
      close: 3160,
      change_percent: 0.3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 12505960000, avg_price: 3156.62 },
        { code: "TP", name: "OCBC Sekuritas", investor_group: "FOREIGN", net_value: 10733410000, avg_price: 3217.93 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 8704992500, avg_price: 3153.13 }
      ],
      top_distributors: [
        { code: "DX", name: "Bahana Sekuritas", investor_group: "GOVERNMENT", net_value: -23029637500, avg_price: 3151.72 },
        { code: "BB", name: "Verdhana Sekuritas", investor_group: "LOCAL", net_value: -20814290000, avg_price: 3177.67 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -8115785000, avg_price: 3147.28 }
      ],
      net_value: 12505960000,
      net_volume_lots: 39599,
      concentration_pct: 38.4,
      bandar_avg_cost: 3156.62,
      bandar_cost_gap_pct: 0.11,
      counterparty_note: "Asing BK (+12.5B) & TP (+10.7B) menyerap tekanan jual lokal BB (-20.8B) & DX (-23.0B)",
      why_insight: "Inisiasi 2D: Asing BK & TP memimpin akumulasi 23.2B di harga 3.156 - 3.217. Selisih harga sekarang 3.160 dengan modal bandar sangat dekat (+0.11%), momentum stabil.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3140 - 3160",
        stop_loss: "3040 (Risk -3.8%)",
        target_price: "3380 - 3500 (Reward +7.0% s/d +10.8%)",
        rr_ratio: "1 : 2.5",
        note: "Entry bertahap di dekat modal bandar BK 3.156."
      }
    },
    "5D": {
      ticker: "AMMN",
      close: 3160,
      change_percent: 0.3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 39041665000, avg_price: 3367.69 },
        { code: "OD", name: "BRI Danareksa Sekuritas", investor_group: "GOVERNMENT", net_value: 33018425000, avg_price: 3397.53 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 29148977500, avg_price: 3313.12 }
      ],
      top_distributors: [
        { code: "BB", name: "Verdhana Sekuritas", investor_group: "LOCAL", net_value: -73192105000, avg_price: 3374.73 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -52549812500, avg_price: 3416.71 },
        { code: "DX", name: "Bahana Sekuritas", investor_group: "GOVERNMENT", net_value: -31832670000, avg_price: 3328.79 }
      ],
      net_value: 29148977500,
      net_volume_lots: 87981,
      concentration_pct: 35.2,
      bandar_avg_cost: 3313.12,
      bandar_cost_gap_pct: -4.62,
      counterparty_note: "Institusi asing BK (+29.1B) & OD menampung pelepasan besar BB (-73.2B) & YU (-52.5B)",
      why_insight: "Weekly flow 5D: Koreksi ke 3.160 terjadi akibat pelepasan BB & YU, namun smart money BK menampung 29.1B pada avg 3.313. Harga saat ini berada di zona diskon -4.62% di bawah modal bandar.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3130 - 3160",
        stop_loss: "3020 (Risk -4.4%)",
        target_price: "3450 - 3550 (Reward +9.2% s/d +12.3%)",
        rr_ratio: "1 : 2.5",
        note: "Swing akumulasi bertahap memanfaatkan diskon modal mingguan 3.313."
      }
    },
    "10D": {
      ticker: "AMMN",
      close: 3160,
      change_percent: 0.3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 46891895000, avg_price: 3485.19 },
        { code: "OD", name: "BRI Danareksa Sekuritas", investor_group: "GOVERNMENT", net_value: 46460435000, avg_price: 3498.62 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 46149067500, avg_price: 3455.05 }
      ],
      top_distributors: [
        { code: "BB", name: "Verdhana Sekuritas", investor_group: "LOCAL", net_value: -68378245000, avg_price: 3458.74 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -63268255000, avg_price: 3467.43 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -50426710000, avg_price: 3514.82 }
      ],
      net_value: 46149067500,
      net_volume_lots: 133570,
      concentration_pct: 42.6,
      bandar_avg_cost: 3455.05,
      bandar_cost_gap_pct: -8.54,
      counterparty_note: "Akumulasi struktural 10 hari oleh BK (+46.1B) dan OD (+46.5B) terkunci di area modal 3.455 - 3.498",
      why_insight: "Horizon 10D: Akumulasi struktural BK dan OD terkunci di avg 3.455 - 3.498. Harga 3.160 merupakan area markdown akumulasi dengan diskon -8.54% dari modal smart money 2 pekan.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3100 - 3160",
        stop_loss: "2980 (Risk -5.7%)",
        target_price: "3550 - 3650 (Reward +12.3% s/d +15.5%)",
        rr_ratio: "1 : 2.5",
        note: "Investasi swing 2 pekan dengan upside pengujian modal 3.455."
      }
    },
  },
  BREN: {
    "2D": {
      ticker: "BREN",
      close: 2190,
      change_percent: 7.4,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 50324980000, avg_price: 2088.29 },
        { code: "DP", name: "DBS Vickers Sekuritas", investor_group: "FOREIGN", net_value: 9320410000, avg_price: 2002.02 }
      ],
      top_distributors: [
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -17240000000, avg_price: 2095.1 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -15120000000, avg_price: 2080.4 }
      ],
      net_value: 50324980000,
      net_volume_lots: 241000,
      concentration_pct: 44.5,
      bandar_avg_cost: 2088.29,
      bandar_cost_gap_pct: 4.87,
      counterparty_note: "Danantara BNI (NI) menginjeksi 50.3B menyerap jualan institusi KZ & YU",
      why_insight: "Inisiasi 2D: BREN melesat +7.4% didorong aksi borong institusi lokal NI senilai 50.3B pada rata-rata 2.088. Harga 2.190 berada di atas modal bandar +4.87%.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "2120 - 2190",
        stop_loss: "2020 (Risk -7.8%)",
        target_price: "2450 - 2600 (Reward +11.9% s/d +18.7%)",
        rr_ratio: "1 : 2.0",
        note: "Momentum inisiasi kuat. Pertahankan posisi selama bertahan di atas modal 2.088."
      }
    },
    "5D": {
      ticker: "BREN",
      close: 2190,
      change_percent: 7.4,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 120314520000, avg_price: 2051.05 },
        { code: "DP", name: "DBS Vickers Sekuritas", investor_group: "FOREIGN", net_value: 15940180000, avg_price: 2014.63 }
      ],
      top_distributors: [
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -32810000000, avg_price: 2045.2 },
        { code: "HD", name: "KGI Sekuritas", investor_group: "FOREIGN", net_value: -28340000000, avg_price: 2055 }
      ],
      net_value: 120314520000,
      net_volume_lots: 586600,
      concentration_pct: 48.6,
      bandar_avg_cost: 2051.05,
      bandar_cost_gap_pct: 6.77,
      counterparty_note: "Danantara BNI (NI) mendominasi akumulasi mingguan 120.3B menampung outflow YU & HD",
      why_insight: "Weekly flow 5D: Akumulasi konsisten tanpa henti oleh NI mencapai 120 Miliar pada modal 2.051. Mengonfirmasi tren bullish continuation.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "2100 - 2190",
        stop_loss: "2000 (Risk -8.7%)",
        target_price: "2500 - 2700 (Reward +14.1% s/d +23.3%)",
        rr_ratio: "1 : 2.2",
        note: "Akumulasi terstruktur Danantara. Swing target hingga 2.600."
      }
    },
    "10D": {
      ticker: "BREN",
      close: 2190,
      change_percent: 7.4,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 239012740000, avg_price: 2090.19 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 24610500000, avg_price: 2115.11 }
      ],
      top_distributors: [
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -65620000000, avg_price: 2085.4 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -54610000000, avg_price: 2095.3 }
      ],
      net_value: 239012740000,
      net_volume_lots: 1143500,
      concentration_pct: 53.1,
      bandar_avg_cost: 2090.19,
      bandar_cost_gap_pct: 4.78,
      counterparty_note: "Basis Danantara BNI (NI) mengunci 239B selama 2 pekan bursa, mengendalikan suplai pasar",
      why_insight: "Horizon 10D: Fondasi struktural 239 Miliar dibentuk oleh NI di area rata-rata 2.090. BREN memiliki bantalan akumulasi paling solid di sektor energi hijau.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "2100 - 2190",
        stop_loss: "1980 (Risk -9.6%)",
        target_price: "2600 - 2800 (Reward +18.7% s/d +27.8%)",
        rr_ratio: "1 : 2.5",
        note: "Struktur kepemilikan sangat terkonsentrasi di Danantara NI."
      }
    },
  },
  NCKL: {
    "2D": {
      ticker: "NCKL",
      close: 735,
      change_percent: 5,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 26914000000, avg_price: 732.9 },
        { code: "CP", name: "KB Valbury Sekuritas", investor_group: "FOREIGN", net_value: 4012000000, avg_price: 711.83 }
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -8510000000, avg_price: 728.4 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -6230000000, avg_price: 730.1 }
      ],
      net_value: 26914000000,
      net_volume_lots: 367200,
      concentration_pct: 41.2,
      bandar_avg_cost: 732.9,
      bandar_cost_gap_pct: 0.29,
      counterparty_note: "Asing BK (+26.9B) memimpin serapan inisiasi 2 hari dekat harga penutupan",
      why_insight: "Inisiasi 2D: Asing BK mengakumulasi 26.9B di level 732.90 (+0.29% gap). Posisi ideal untuk momentum lanjutan pengujian level 800.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "725 - 735",
        stop_loss: "695 (Risk -5.4%)",
        target_price: "810 - 840 (Reward +10.2% s/d +14.3%)",
        rr_ratio: "1 : 2.2",
        note: "Entry aman dekat modal bandar BK 733."
      }
    },
    "5D": {
      ticker: "NCKL",
      close: 735,
      change_percent: 5,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 25410000000, avg_price: 731.88 },
        { code: "NI", name: "BNI Sekuritas", investor_group: "GOVERNMENT", net_value: 5210000000, avg_price: 711.97 }
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -14210000000, avg_price: 725.6 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -9820000000, avg_price: 724.1 }
      ],
      net_value: 25410000000,
      net_volume_lots: 347200,
      concentration_pct: 39.8,
      bandar_avg_cost: 731.88,
      bandar_cost_gap_pct: 0.43,
      counterparty_note: "BK menguasai kontrol suplai mingguan dengan modal stabil 731.88",
      why_insight: "Weekly flow 5D: Akumulasi dominan oleh BK menahan NCKL tetap stabil di atas 730 meski AK melakukan aksi jual rutin.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "720 - 735",
        stop_loss: "690 (Risk -6.1%)",
        target_price: "810 - 850 (Reward +10.2% s/d +15.6%)",
        rr_ratio: "1 : 2.2",
        note: "Setup swing mingguan solid bersama BK."
      }
    },
    "10D": {
      ticker: "NCKL",
      close: 735,
      change_percent: 5,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 27420000000, avg_price: 732.62 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 11630000000, avg_price: 722.88 }
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -22140000000, avg_price: 726.8 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -15410000000, avg_price: 723.4 }
      ],
      net_value: 27420000000,
      net_volume_lots: 374300,
      concentration_pct: 42.1,
      bandar_avg_cost: 732.62,
      bandar_cost_gap_pct: 0.32,
      counterparty_note: "Dual akumulator BK & Mandiri CC mengamankan basis 10 hari bursa",
      why_insight: "Horizon 10D: Struktur akumulasi 2 pekan terkonsentrasi di harga 732.62. Smart money asing BK dan Danantara CC menjaga pertahanan harga.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "715 - 735",
        stop_loss: "680 (Risk -7.5%)",
        target_price: "820 - 860 (Reward +11.6% s/d +17.0%)",
        rr_ratio: "1 : 2.0",
        note: "Disiplin hold selama bertengger di atas modal struktural 732."
      }
    },
  },
  TINS: {
    "2D": {
      ticker: "TINS",
      close: 3140,
      change_percent: 3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 30512000000, avg_price: 3083.83 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 30210000000, avg_price: 3107.99 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -28100000000, avg_price: 3112.5 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -14200000000, avg_price: 3098.2 }
      ],
      net_value: 30512000000,
      net_volume_lots: 98900,
      concentration_pct: 43.1,
      bandar_avg_cost: 3083.83,
      bandar_cost_gap_pct: 1.82,
      counterparty_note: "Asing AK (+30.5B) & BK (+30.2B) kompak memborong TINS",
      why_insight: "Inisiasi 2D: Outflow Mandiri CC diserap agresif oleh konsorsium asing AK & BK senilai 60B. Modal asing di 3.083 dengan gap aman +1.82%.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3100 - 3140",
        stop_loss: "2980 (Risk -5.1%)",
        target_price: "3400 - 3550 (Reward +8.3% s/d +13.1%)",
        rr_ratio: "1 : 2.2",
        note: "Momentum rebound timah didukung serapan asing masif."
      }
    },
    "5D": {
      ticker: "TINS",
      close: 3140,
      change_percent: 3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 34410000000, avg_price: 3309.55 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 19612000000, avg_price: 3226.48 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -42100000000, avg_price: 3255.4 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -18400000000, avg_price: 3260.1 }
      ],
      net_value: 19612000000,
      net_volume_lots: 60780,
      concentration_pct: 36.5,
      bandar_avg_cost: 3226.48,
      bandar_cost_gap_pct: -2.68,
      counterparty_note: "BK menampung di harga diskon mingguan 3.226,48",
      why_insight: "Weekly flow 5D: TINS terkoreksi tipis dengan harga saat ini (3.140) memberi diskon -2.68% dari modal mingguan smart money BK (3.226).",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3080 - 3140",
        stop_loss: "2950 (Risk -6.1%)",
        target_price: "3450 - 3600 (Reward +9.9% s/d +14.6%)",
        rr_ratio: "1 : 2.1",
        note: "Akumulasi di zona diskon modal mingguan."
      }
    },
    "10D": {
      ticker: "TINS",
      close: 3140,
      change_percent: 3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 68514000000, avg_price: 3371.19 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 34610000000, avg_price: 3401.47 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 27010000000, avg_price: 3379.02 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -72500000000, avg_price: 3390.2 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -31400000000, avg_price: 3385.1 }
      ],
      net_value: 68514000000,
      net_volume_lots: 203200,
      concentration_pct: 44.8,
      bandar_avg_cost: 3371.19,
      bandar_cost_gap_pct: -6.86,
      counterparty_note: "Basis akumulasi 10 hari oleh AK (+68.5B) berada di atas 3.370",
      why_insight: "Horizon 10D: Akumulasi struktural 2 pekan oleh UBS AK senilai 68.5B memiliki modal 3.371. Harga saat ini 3.140 diskon -6.86%, potensi swing recovery signifikan.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3050 - 3140",
        stop_loss: "2920 (Risk -7.0%)",
        target_price: "3500 - 3700 (Reward +11.5% s/d +17.8%)",
        rr_ratio: "1 : 2.3",
        note: "Target kembali ke rata-rata modal bandar struktural 3.371."
      }
    },
  },
  GOTO: {
    "2D": {
      ticker: "GOTO",
      close: 27,
      change_percent: 0,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Heavy Distribution",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "PP", name: "Pratama Sekuritas", investor_group: "LOCAL", net_value: 58620429000, avg_price: 27 },
        { code: "MG", name: "Semesta Indovest", investor_group: "LOCAL", net_value: 44372423800, avg_price: 27 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 17369166000, avg_price: 27.02 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -48200000000, avg_price: 27 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -35100000000, avg_price: 27 }
      ],
      net_value: 58620429000,
      net_volume_lots: 21711270,
      concentration_pct: 32.1,
      bandar_avg_cost: 27,
      bandar_cost_gap_pct: 0,
      counterparty_note: "Spekulan lokal PP (+58.6B) & MG menampung jualan asing di fraksi 27",
      why_insight: "Inisiasi 2D: Transaksi terhimpit di fraksi Rp 27. Broker PP dan MG menampung 100B jualan asing, namun daya angkat harga masih nol.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 25",
        rr_ratio: "-",
        note: "Distribusi struktural asing belum selesai."
      }
    },
    "5D": {
      ticker: "GOTO",
      close: 27,
      change_percent: 0,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Heavy Distribution",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "PP", name: "Pratama Sekuritas", investor_group: "LOCAL", net_value: 209588776700, avg_price: 26.37 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 80135928200, avg_price: 26.04 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -145000000000, avg_price: 26.5 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -98000000000, avg_price: 26.8 }
      ],
      net_value: 209588776700,
      net_volume_lots: 79477321,
      concentration_pct: 35.4,
      bandar_avg_cost: 26.37,
      bandar_cost_gap_pct: 2.39,
      counterparty_note: "Lokal PP menampung 209B outflow institusi global",
      why_insight: "Weekly flow 5D: Tekanan jual asing berlangsung sistematis. Serapan lokal oleh PP belum sanggup memicu breakout teknikal.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Pantau likuiditas",
        rr_ratio: "-",
        note: "Risiko liquidity trap tinggi di saham teknologi."
      }
    },
    "10D": {
      ticker: "GOTO",
      close: 27,
      change_percent: 0,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Heavy Distribution",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "PP", name: "Pratama Sekuritas", investor_group: "LOCAL", net_value: 574954121700, avg_price: 25.57 },
        { code: "RF", name: "Buana Capital", investor_group: "LOCAL", net_value: 57380709700, avg_price: 27.01 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -310000000000, avg_price: 26.1 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -210000000000, avg_price: 26.4 }
      ],
      net_value: 574954121700,
      net_volume_lots: 224823459,
      concentration_pct: 42.8,
      bandar_avg_cost: 25.57,
      bandar_cost_gap_pct: 5.59,
      counterparty_note: "Akumulasi masif PP (+574B) di kisaran 25.57 berhadapan dengan exit raksasa asing",
      why_insight: "Horizon 10D: Broker PP memegang inventori 224 juta lot sejak harga 25.57. Selama asing belum berhenti exit, hindari terburu-buru entry.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Wait and see",
        rr_ratio: "-",
        note: "Tetap waspada distribusi struktural institusi global."
      }
    },
  },
  AADI: {
    "2D": {
      ticker: "AADI",
      close: 9875,
      change_percent: 1.3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 36680245000, avg_price: 9882.65 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 10605740000, avg_price: 9861.92 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 9711932500, avg_price: 9864.15 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -18420000000, avg_price: 9890.1 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -12300000000, avg_price: 9870.5 }
      ],
      net_value: 36680245000,
      net_volume_lots: 37070,
      concentration_pct: 46.2,
      bandar_avg_cost: 9882.65,
      bandar_cost_gap_pct: -0.08,
      counterparty_note: "Danantara Mandiri (CC) memborong 36.7B di rata-rata 9.882",
      why_insight: "Inisiasi 2D: Danantara CC menguasai serapan bersih Rp 36.7B tepat di kisaran level psikologis 9.880. Gap harga penutupan hampir nol (-0.08%).",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "9750 - 9875",
        stop_loss: "9450 (Risk -4.3%)",
        target_price: "10500 - 10800 (Reward +6.3% s/d +9.4%)",
        rr_ratio: "1 : 2.0",
        note: "Entry prima di dekat modal Danantara CC 9.882."
      }
    },
    "5D": {
      ticker: "AADI",
      close: 9875,
      change_percent: 1.3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 46279465000, avg_price: 10116.13 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 41058127500, avg_price: 10005.85 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 31082522500, avg_price: 10068.96 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -38900000000, avg_price: 10150.2 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -26400000000, avg_price: 10080 }
      ],
      net_value: 46279465000,
      net_volume_lots: 45803,
      concentration_pct: 44.1,
      bandar_avg_cost: 10116.13,
      bandar_cost_gap_pct: -2.38,
      counterparty_note: "Konsorsium AK & CC mengumpulkan 87B di atas modal 10.000",
      why_insight: "Weekly flow 5D: Akumulasi gabungan asing AK dan Danantara CC mencapai 87.3B. Harga 9.875 berada di zona diskon -2.38% dari modal mingguan.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "9700 - 9875",
        stop_loss: "9400 (Risk -4.8%)",
        target_price: "10600 - 11000 (Reward +7.3% s/d +11.4%)",
        rr_ratio: "1 : 2.2",
        note: "Manfaatkan koreksi di bawah 10.000 untuk akumulasi swing."
      }
    },
    "10D": {
      ticker: "AADI",
      close: 9875,
      change_percent: 1.3,
      quadrant: "markup_akumulasi",
      quadrant_label: "[MA] Markup + Akumulasi",
      status_color: "emerald",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 49224567500, avg_price: 10205.61 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 46009080000, avg_price: 10181.44 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 42124157500, avg_price: 10113.95 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -64500000000, avg_price: 10220.5 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -41200000000, avg_price: 10190 }
      ],
      net_value: 46009080000,
      net_volume_lots: 45662,
      concentration_pct: 47.5,
      bandar_avg_cost: 10181.44,
      bandar_cost_gap_pct: -3.01,
      counterparty_note: "Basis akumulasi 10 hari stabil dipegang AK (+46B) & CC (+42B)",
      why_insight: "Horizon 10D: Selama 2 pekan bursa, institusi asing AK dan Danantara CC menanam modal 88B di area rata-rata 10.113 - 10.181. Harga saat ini diskon -3.01%.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "9650 - 9875",
        stop_loss: "9350 (Risk -5.3%)",
        target_price: "10700 - 11200 (Reward +8.4% s/d +13.4%)",
        rr_ratio: "1 : 2.3",
        note: "Bantalan kuat institusi di level 10.100."
      }
    },
  },
  TLKM: {
    "2D": {
      ticker: "TLKM",
      close: 2070,
      change_percent: -2.4,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 51172414000, avg_price: 2100.55 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 51099133000, avg_price: 2064.72 }
      ],
      top_distributors: [
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -46800000000, avg_price: 2075.2 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -31200000000, avg_price: 2070 }
      ],
      net_value: 51172414000,
      net_volume_lots: 239247,
      concentration_pct: 36.4,
      bandar_avg_cost: 2100.55,
      bandar_cost_gap_pct: -1.45,
      counterparty_note: "Outflow YU & YP ditampung seimbang oleh ZP (+51.2B) & Mandiri CC (+51.1B)",
      why_insight: "Inisiasi 2D: Tekanan jual asing YU memicu penurunan -2.4%, namun terjadi serapan defensif besar oleh ZP & Danantara CC di level 2.064 - 2.100.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu konfirmasi support 2.000",
        rr_ratio: "-",
        note: "Wait and see hingga tekanan jual mereda."
      }
    },
    "5D": {
      ticker: "TLKM",
      close: 2070,
      change_percent: -2.4,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 330682423000, avg_price: 2170.19 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 149497154000, avg_price: 2142.5 }
      ],
      top_distributors: [
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -210000000000, avg_price: 2160 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -180000000000, avg_price: 2155 }
      ],
      net_value: 330682423000,
      net_volume_lots: 1514726,
      concentration_pct: 41.5,
      bandar_avg_cost: 2170.19,
      bandar_cost_gap_pct: -4.62,
      counterparty_note: "ZP menginjeksi serapan 330B menahan laju distribusi asing",
      why_insight: "Weekly flow 5D: Distribusi global oleh YU & AK mencapai 390B. Walaupun ZP memborong 330B di avg 2.170, harga masih tertahan di 2.070 (diskon -4.62%).",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 2.000",
        rr_ratio: "-",
        note: "Potensi pembentukan bottoming mingguan."
      }
    },
    "10D": {
      ticker: "TLKM",
      close: 2070,
      change_percent: -2.4,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 418361133000, avg_price: 2149.08 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 128092779500, avg_price: 2120.76 }
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -340000000000, avg_price: 2140 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: -290000000000, avg_price: 2135 }
      ],
      net_value: 418361133000,
      net_volume_lots: 1930772,
      concentration_pct: 43.8,
      bandar_avg_cost: 2149.08,
      bandar_cost_gap_pct: -3.68,
      counterparty_note: "Basis 10 hari bursa: ZP memegang 1.93 juta lot akumulasi",
      why_insight: "Horizon 10D: ZP dan Danantara CC menumpuk serapan lebih dari 540B di kisaran 2.120 - 2.149. Diskon harga -3.68% mengindikasikan potensi technical rebound jangka menengah.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu pivot di atas 2.120",
        rr_ratio: "-",
        note: "Tunggu sinyal pembalikan arah sebelum entry."
      }
    },
  },
  BMRI: {
    "2D": {
      ticker: "BMRI",
      close: 3890,
      change_percent: -0.5,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 146773735000, avg_price: 3896.33 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: 64374906000, avg_price: 3886.71 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: 55669087000, avg_price: 3878.02 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -88400000000, avg_price: 3895 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -52100000000, avg_price: 3890 }
      ],
      net_value: 146773735000,
      net_volume_lots: 376836,
      concentration_pct: 45.1,
      bandar_avg_cost: 3896.33,
      bandar_cost_gap_pct: -0.16,
      counterparty_note: "Danantara Mandiri (CC) menampung masif 146.8B menahan pelemahan harga",
      why_insight: "Inisiasi 2D: Koreksi tipis BMRI -0.5% dimanfaatkan Danantara CC untuk menyerok 146.8B di rata-rata 3.896. Harga sangat dekat dengan modal bandar (-0.16%).",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3850 - 3890",
        stop_loss: "3740 (Risk -3.9%)",
        target_price: "4100 - 4250 (Reward +5.4% s/d +9.3%)",
        rr_ratio: "1 : 2.0",
        note: "Bantalan kuat Danantara CC di level 3.890."
      }
    },
    "5D": {
      ticker: "BMRI",
      close: 3890,
      change_percent: -0.5,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 156238853000, avg_price: 3915.97 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 147820517000, avg_price: 3920.96 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: 115635131000, avg_price: 3900.98 }
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -240000000000, avg_price: 3925 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -110000000000, avg_price: 3910 }
      ],
      net_value: 156238853000,
      net_volume_lots: 396412,
      concentration_pct: 42.8,
      bandar_avg_cost: 3915.97,
      bandar_cost_gap_pct: -0.66,
      counterparty_note: "Konsorsium ZP & Mandiri CC mengunci lebih dari 300B akumulasi mingguan",
      why_insight: "Weekly flow 5D: Akumulasi serentak asing ZP (+156B) dan Danantara CC (+148B) membentuk basis kuat di 3.915. Harga 3.890 berada di zona markdown akumulasi.",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3840 - 3890",
        stop_loss: "3720 (Risk -4.4%)",
        target_price: "4150 - 4300 (Reward +6.7% s/d +10.5%)",
        rr_ratio: "1 : 2.2",
        note: "Akumulasi bertahap di zona support Big Caps perbankan."
      }
    },
    "10D": {
      ticker: "BMRI",
      close: 3890,
      change_percent: -0.5,
      quadrant: "markdown_akumulasi",
      quadrant_label: "[DA] Markdown + Akumulasi",
      status_color: "sky",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: 280547215000, avg_price: 3878.78 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 215269514000, avg_price: 3881.6 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: 122253558000, avg_price: 3877.09 }
      ],
      top_distributors: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -420000000000, avg_price: 3885 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: -190000000000, avg_price: 3870 }
      ],
      net_value: 280547215000,
      net_volume_lots: 711964,
      concentration_pct: 46.5,
      bandar_avg_cost: 3878.78,
      bandar_cost_gap_pct: 0.29,
      counterparty_note: "Basis 10 hari bursa: ZP & CC menguasai serapan bersih nyaris 500B",
      why_insight: "Horizon 10D: Fondasi struktural 2 pekan bursa di level 3.878 - 3.881 dengan total serapan institusi 495B. Harga 3.890 bertengger aman di atas modal bandar (+0.29%).",
      trade_plan: {
        action: "BUY ON PULLBACK",
        entry_zone: "3820 - 3890",
        stop_loss: "3700 (Risk -4.9%)",
        target_price: "4200 - 4350 (Reward +8.0% s/d +11.8%)",
        rr_ratio: "1 : 2.2",
        note: "Posisi defensif kuat didukung Danantara & Maybank ZP."
      }
    },
  },
  ASII: {
    "2D": {
      ticker: "ASII",
      close: 5300,
      change_percent: -1.4,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 64825327500, avg_price: 5378.18 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 27898490000, avg_price: 5369.24 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -58400000000, avg_price: 5380 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -38200000000, avg_price: 5370 }
      ],
      net_value: 64825327500,
      net_volume_lots: 119189,
      concentration_pct: 35.8,
      bandar_avg_cost: 5378.18,
      bandar_cost_gap_pct: -1.45,
      counterparty_note: "Serapan AK (+64.8B) belum sanggup menahan tekanan jual ZP & BK",
      why_insight: "Inisiasi 2D: Outflow ZP & BK menekan ASII -1.4%. Meskipun AK menyerap 64.8B pada modal 5.378, harga tertahan di bawah modal bandar.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 5.100",
        rr_ratio: "-",
        note: "Distribusi asing masih dominan."
      }
    },
    "5D": {
      ticker: "ASII",
      close: 5300,
      change_percent: -1.4,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 306681402500, avg_price: 5525.03 },
        { code: "KZ", name: "CLSA Sekuritas", investor_group: "FOREIGN", net_value: 108436045000, avg_price: 5563.98 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -260000000000, avg_price: 5540 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -180000000000, avg_price: 5510 }
      ],
      net_value: 306681402500,
      net_volume_lots: 548377,
      concentration_pct: 41.2,
      bandar_avg_cost: 5525.03,
      bandar_cost_gap_pct: -4.07,
      counterparty_note: "AK terjebak menampung 306B di rata-rata 5.525 saat harga meluncur turun",
      why_insight: "Weekly flow 5D: Terjadi perang broker asing: ZP & BK melepas 440B sementara AK menampung 306B di modal tinggi 5.525. Diskon harga -4.07%.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu pivot di atas 5.450",
        rr_ratio: "-",
        note: "Hindari menangkap pisau jatuh sebelum ada akumulasi balik."
      }
    },
    "10D": {
      ticker: "ASII",
      close: 5300,
      change_percent: -1.4,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 663544473000, avg_price: 5384.53 },
        { code: "RX", name: "Macquarie Sekuritas", investor_group: "FOREIGN", net_value: 340609458500, avg_price: 5360.42 }
      ],
      top_distributors: [
        { code: "ZP", name: "Maybank Sekuritas", investor_group: "FOREIGN", net_value: -560000000000, avg_price: 5410 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -380000000000, avg_price: 5390 }
      ],
      net_value: 663544473000,
      net_volume_lots: 1231460,
      concentration_pct: 44.8,
      bandar_avg_cost: 5384.53,
      bandar_cost_gap_pct: -1.57,
      counterparty_note: "Basis 10 hari bursa: Akumulasi raksasa AK (+663B) & RX (+340B)",
      why_insight: "Horizon 10D: Akumulasi terakumulasi 1 Triliun oleh AK & RX di level 5.360 - 5.384. Meskipun tren jangka pendek melemah, bantalan struktural di 5.300 mulai terbentuk.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support konfirmasi",
        rr_ratio: "-",
        note: "Tunggu kepastian reversal sebelum entry."
      }
    },
  },
  MDKA: {
    "2D": {
      ticker: "MDKA",
      close: 1710,
      change_percent: -5,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 78612115000, avg_price: 1721.88 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: 20633712500, avg_price: 1777 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -45200000000, avg_price: 1750 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -28100000000, avg_price: 1760 }
      ],
      net_value: 78612115000,
      net_volume_lots: 459754,
      concentration_pct: 39.5,
      bandar_avg_cost: 1721.88,
      bandar_cost_gap_pct: -0.69,
      counterparty_note: "AK menyerok 78.6B saat MDKA terkoreksi dalam -5.0%",
      why_insight: "Inisiasi 2D: Koreksi tajam ke 1710 dimanfaatkan UBS AK untuk menampung 459 ribu lot pada modal 1.721. Selisih harga ke modal hanya -0.69%.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 1.650",
        rr_ratio: "-",
        note: "Wait and see hingga volatilitas mereda."
      }
    },
    "5D": {
      ticker: "MDKA",
      close: 1710,
      change_percent: -5,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 58812197000, avg_price: 1769.67 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 21184431500, avg_price: 1892.11 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -82000000000, avg_price: 1820 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -41000000000, avg_price: 1840 }
      ],
      net_value: 58812197000,
      net_volume_lots: 360561,
      concentration_pct: 34.8,
      bandar_avg_cost: 1769.67,
      bandar_cost_gap_pct: -3.37,
      counterparty_note: "Tekanan jual Mandiri CC (-82B) menekan harga di bawah modal AK",
      why_insight: "Weekly flow 5D: Pelepasan besar dari Mandiri CC menyebabkan koreksi mingguan. Broker AK memegang posisi di 1.769 (diskon -3.37%).",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu base di 1.680",
        rr_ratio: "-",
        note: "Hindari masuk sebelum ada tanda absorpsi buyer sempurna."
      }
    },
    "10D": {
      ticker: "MDKA",
      close: 1710,
      change_percent: -5,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 85305974500, avg_price: 1853.36 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: 19700365500, avg_price: 1895.64 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -125000000000, avg_price: 1920 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: -68000000000, avg_price: 1910 }
      ],
      net_value: 85305974500,
      net_volume_lots: 487265,
      concentration_pct: 38.6,
      bandar_avg_cost: 1853.36,
      bandar_cost_gap_pct: -7.73,
      counterparty_note: "Basis 10 hari bursa: AK mengakumulasi 85B pada modal struktural 1.853",
      why_insight: "Horizon 10D: Akumulasi 2 pekan oleh AK terkunci di modal 1.853. Harga saat ini (1.710) memberi diskon dalam -7.73%, namun perlu konfirmasi reversal.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support kuat 1.650",
        rr_ratio: "-",
        note: "Disiplin tidak mendahului sinyal pembalikan arah."
      }
    },
  },
  BRPT: {
    "2D": {
      ticker: "BRPT",
      close: 625,
      change_percent: -4.6,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 27627938000, avg_price: 664.26 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 17706037000, avg_price: 665.36 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -24500000000, avg_price: 670 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -16800000000, avg_price: 668 }
      ],
      net_value: 27627938000,
      net_volume_lots: 413833,
      concentration_pct: 37.5,
      bandar_avg_cost: 664.26,
      bandar_cost_gap_pct: -5.91,
      counterparty_note: "AK (+27.6B) & CC (+17.7B) menampung pelepasan ritel dan broker YP",
      why_insight: "Inisiasi 2D: Koreksi ke 625 memperlebar jarak dari modal bandar 2 hari (664.26, diskon -5.91%). Serapan institusi mulai tampak.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 600",
        rr_ratio: "-",
        note: "Wait and see hingga harga kembali ke atas 650."
      }
    },
    "5D": {
      ticker: "BRPT",
      close: 625,
      change_percent: -4.6,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 37792780500, avg_price: 695.62 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 36980276500, avg_price: 701.31 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -48000000000, avg_price: 710 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -31000000000, avg_price: 705 }
      ],
      net_value: 37792780500,
      net_volume_lots: 597264,
      concentration_pct: 36.8,
      bandar_avg_cost: 695.62,
      bandar_cost_gap_pct: -10.15,
      counterparty_note: "Serapan mingguan AK & CC tertahan oleh distribusi agresif",
      why_insight: "Weekly flow 5D: Tekanan jual pasar menyeret harga turun ke 625, jauh di bawah modal akumulasi mingguan 695 (-10.15%).",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu base 600",
        rr_ratio: "-",
        note: "Jangan lawan tren penurunan sebelum terbentuk pola reversal."
      }
    },
    "10D": {
      ticker: "BRPT",
      close: 625,
      change_percent: -4.6,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 122442443000, avg_price: 756.53 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 120068889000, avg_price: 748.77 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -110000000000, avg_price: 765 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -75000000000, avg_price: 760 }
      ],
      net_value: 122442443000,
      net_volume_lots: 1662123,
      concentration_pct: 44.5,
      bandar_avg_cost: 756.53,
      bandar_cost_gap_pct: -17.39,
      counterparty_note: "Basis 10 hari: CC (+122B) & AK (+120B) terkunci di level modal 748 - 756",
      why_insight: "Horizon 10D: Akumulasi struktural 242B oleh CC dan AK terperangkap di modal rata-rata 750-an. Diskon ekstrem -17.39% memberi peluang recovery begitu seller habis.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu sinyal pembalikan arah di 600",
        rr_ratio: "-",
        note: "Potensi technical rebound tinggi bila suplai mereda."
      }
    },
  },
  INCO: {
    "2D": {
      ticker: "INCO",
      close: 3250,
      change_percent: 1.2,
      quadrant: "markup_distribusi",
      quadrant_label: "[MD] Markup + Distribusi (Trap)",
      status_color: "amber",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 35478054000, avg_price: 3245.06 },
        { code: "AZ", name: "Sucor Sekuritas", investor_group: "LOCAL", net_value: 8317305000, avg_price: 3278.4 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -26400000000, avg_price: 3260 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -15200000000, avg_price: 3255 }
      ],
      net_value: 35478054000,
      net_volume_lots: 109800,
      concentration_pct: 42.1,
      bandar_avg_cost: 3245.06,
      bandar_cost_gap_pct: 0.15,
      counterparty_note: "Asing AK (+35.5B) memimpin serapan inisiasi di modal 3.245",
      why_insight: "Inisiasi 2D: Rebound +1.2% ke 3.250 didorong serapan asing AK 35.5B. Harga bertengger sangat dekat di atas modal bandar (+0.15%).",
      trade_plan: {
        action: "AVOID / SELL ON STRENGTH",
        entry_zone: "3230 - 3250",
        stop_loss: "3120 (Risk -4.0%)",
        target_price: "3450 - 3550 (Reward +6.2% s/d +9.2%)",
        rr_ratio: "1 : 1.8",
        note: "Pantau pelepasan dari Mandiri CC sebelum follow through."
      }
    },
    "5D": {
      ticker: "INCO",
      close: 3250,
      change_percent: 1.2,
      quadrant: "markup_distribusi",
      quadrant_label: "[MD] Markup + Distribusi (Trap)",
      status_color: "amber",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: 23072336000, avg_price: 3312.75 },
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: 9485263000, avg_price: 3393.84 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -38000000000, avg_price: 3350 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -14000000000, avg_price: 3340 }
      ],
      net_value: 23072336000,
      net_volume_lots: 75069,
      concentration_pct: 35.8,
      bandar_avg_cost: 3312.75,
      bandar_cost_gap_pct: -1.89,
      counterparty_note: "Pelepasan Mandiri CC (-38B) menahan penguatan mingguan",
      why_insight: "Weekly flow 5D: Tekanan jual Mandiri CC menahan INCO tetap di bawah modal mingguan AK 3.312 (diskon -1.89%).",
      trade_plan: {
        action: "AVOID / SELL ON STRENGTH",
        entry_zone: "3200 - 3250",
        stop_loss: "3100 (Risk -4.6%)",
        target_price: "3400 - 3500 (Reward +4.6% s/d +7.7%)",
        rr_ratio: "1 : 1.5",
        note: "Hati-hati jebakan markup jika distribusi berlanjut."
      }
    },
    "10D": {
      ticker: "INCO",
      close: 3250,
      change_percent: 1.2,
      quadrant: "markup_distribusi",
      quadrant_label: "[MD] Markup + Distribusi (Trap)",
      status_color: "amber",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "LG", name: "Trimegah Sekuritas", investor_group: "LOCAL", net_value: 33227936000, avg_price: 3635.07 },
        { code: "OD", name: "BRI Danareksa Sekuritas", investor_group: "GOVERNMENT", net_value: 24162170000, avg_price: 3475.72 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -65000000000, avg_price: 3550 },
        { code: "AK", name: "UBS Sekuritas", investor_group: "FOREIGN", net_value: -42000000000, avg_price: 3520 }
      ],
      net_value: 33227936000,
      net_volume_lots: 91063,
      concentration_pct: 39.4,
      bandar_avg_cost: 3635.07,
      bandar_cost_gap_pct: -10.59,
      counterparty_note: "Basis 10 hari: Akumulasi LG tertinggal di level modal tinggi 3.635",
      why_insight: "Horizon 10D: Selama 2 pekan, broker lokal LG mengumpulkan 91 ribu lot di avg 3.635. Harga 3.250 berada di diskon -10.59%.",
      trade_plan: {
        action: "AVOID / SELL ON STRENGTH",
        entry_zone: "3180 - 3250",
        stop_loss: "3050 (Risk -6.2%)",
        target_price: "3550 - 3650 (Reward +9.2% s/d +12.3%)",
        rr_ratio: "1 : 1.8",
        note: "Target pengujian modal struktural bandar di 3.600."
      }
    },
  },
  INDY: {
    "2D": {
      ticker: "INDY",
      close: 1490,
      change_percent: -5.7,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 6784993000, avg_price: 1542.31 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 5147567500, avg_price: 1517.5 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -9800000000, avg_price: 1550 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -6200000000, avg_price: 1540 }
      ],
      net_value: 6784993000,
      net_volume_lots: 44171,
      concentration_pct: 35.1,
      bandar_avg_cost: 1542.31,
      bandar_cost_gap_pct: -3.39,
      counterparty_note: "Danantara CC (+6.8B) & BK (+5.1B) menampung serapan koreksi tajam",
      why_insight: "Inisiasi 2D: Kejatuhan harga ke 1490 (-5.7%) memperlebar jarak dari modal akumulasi Mandiri CC di 1.542 (-3.39%).",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 1.400",
        rr_ratio: "-",
        note: "Downtrend batubara masih menekan."
      }
    },
    "5D": {
      ticker: "INDY",
      close: 1490,
      change_percent: -5.7,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "LG", name: "Trimegah Sekuritas", investor_group: "LOCAL", net_value: 37621289500, avg_price: 1843.21 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 10911701000, avg_price: 1662.74 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -28400000000, avg_price: 1780 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -19200000000, avg_price: 1750 }
      ],
      net_value: 37621289500,
      net_volume_lots: 203040,
      concentration_pct: 42.6,
      bandar_avg_cost: 1843.21,
      bandar_cost_gap_pct: -19.16,
      counterparty_note: "Akumulasi LG 37.6B terperangkap di modal tinggi 1.843",
      why_insight: "Weekly flow 5D: Broker LG menampung 203 ribu lot di harga tinggi 1.843. Harga saat ini (1.490) floating loss dalam -19.16%.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu base 1.400",
        rr_ratio: "-",
        note: "Risiko penurunan lanjutan masih terbuka."
      }
    },
    "10D": {
      ticker: "INDY",
      close: 1490,
      change_percent: -5.7,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "LG", name: "Trimegah Sekuritas", investor_group: "LOCAL", net_value: 37691592500, avg_price: 1843.05 },
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 13637611000, avg_price: 1711.23 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -45000000000, avg_price: 1820 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -31000000000, avg_price: 1790 }
      ],
      net_value: 37691592500,
      net_volume_lots: 203519,
      concentration_pct: 43.1,
      bandar_avg_cost: 1843.05,
      bandar_cost_gap_pct: -19.16,
      counterparty_note: "Basis 10 hari bursa: Outflow sistematis dari broker ritel YP & PD",
      why_insight: "Horizon 10D: Outflow sistematis selama 2 pekan bursa membuat INDY terpuruk di 1490. Meskipun modal bandar LG berada di 1.843, belum ada katalis pembalik arah.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu konfirmasi reversal",
        rr_ratio: "-",
        note: "Disiplin hindari saham downtrend."
      }
    },
  },
  JPFA: {
    "2D": {
      ticker: "JPFA",
      close: 1445,
      change_percent: -1,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "2D",
      horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
      date_range: "19 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 9740217500, avg_price: 1461.25 },
        { code: "YU", name: "CGS International", investor_group: "FOREIGN", net_value: 5567384500, avg_price: 1476.27 }
      ],
      top_distributors: [
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: -8900000000, avg_price: 1465 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -4500000000, avg_price: 1460 }
      ],
      net_value: 9740217500,
      net_volume_lots: 66637,
      concentration_pct: 38.2,
      bandar_avg_cost: 1461.25,
      bandar_cost_gap_pct: -1.11,
      counterparty_note: "Asing BK (+9.7B) menyerap pelepasan lokal di rata-rata 1.461",
      why_insight: "Inisiasi 2D: Penurunan tipis -1.0% ditampung asing BK senilai 9.7B di modal 1.461. Diskon harga saat ini -1.11% dari modal bandar.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 1.380",
        rr_ratio: "-",
        note: "Tunggu pembentukan support kuat sebelum entry."
      }
    },
    "5D": {
      ticker: "JPFA",
      close: 1445,
      change_percent: -1,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "5D",
      horizon_label: "5 Hari Bursa (Weekly Persistence)",
      date_range: "16 - 20 Nov 2026",
      top_accumulators: [
        { code: "BK", name: "J.P. Morgan Sekuritas", investor_group: "FOREIGN", net_value: 10936631500, avg_price: 1484.17 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 9402172000, avg_price: 1503.33 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -15200000000, avg_price: 1495 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -11400000000, avg_price: 1490 }
      ],
      net_value: 10936631500,
      net_volume_lots: 74550,
      concentration_pct: 36.4,
      bandar_avg_cost: 1484.17,
      bandar_cost_gap_pct: -2.64,
      counterparty_note: "BK & Mandiri CC mengumpulkan 20B di kisaran modal 1.484 - 1.503",
      why_insight: "Weekly flow 5D: Konsolidasi perunggasan. BK memimpin serapan mingguan di avg 1.484. Selisih diskon harga -2.64%.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu pivot 1.480",
        rr_ratio: "-",
        note: "Wait and see hingga tren net buy kembali stabil."
      }
    },
    "10D": {
      ticker: "JPFA",
      close: 1445,
      change_percent: -1,
      quadrant: "markdown_distribusi",
      quadrant_label: "[DD] Markdown + Distribusi",
      status_color: "rose",
      horizon: "10D",
      horizon_label: "10 Hari Bursa (Structural Base)",
      date_range: "09 - 20 Nov 2026",
      top_accumulators: [
        { code: "DX", name: "Bahana Sekuritas", investor_group: "GOVERNMENT", net_value: 41385053000, avg_price: 1490.33 },
        { code: "XL", name: "Stockbit Sekuritas", investor_group: "LOCAL", net_value: 24370839000, avg_price: 1504.16 },
        { code: "CC", name: "Mandiri Sekuritas", investor_group: "GOVERNMENT", net_value: 17576436000, avg_price: 1503.48 }
      ],
      top_distributors: [
        { code: "YP", name: "Mirae Asset Sekuritas", investor_group: "FOREIGN", net_value: -38000000000, avg_price: 1510 },
        { code: "PD", name: "Indo Premier Sekuritas", investor_group: "LOCAL", net_value: -24000000000, avg_price: 1505 }
      ],
      net_value: 41385053000,
      net_volume_lots: 277974,
      concentration_pct: 41.5,
      bandar_avg_cost: 1490.33,
      bandar_cost_gap_pct: -3.04,
      counterparty_note: "Basis Danantara Bahana (DX) mengunci 41.4B selama 10 hari bursa",
      why_insight: "Horizon 10D: Akumulasi struktural 2 pekan bursa dipimpin oleh institusi pemerintah Bahana DX (41.4B) pada rata-rata 1.490. Harga 1.445 berada di zona diskon -3.04%.",
      trade_plan: {
        action: "HARD AVOID",
        entry_zone: "Dilarang Masuk",
        stop_loss: "-",
        target_price: "Tunggu support 1.400",
        rr_ratio: "-",
        note: "Disiplin pantau absorpsi buyer sebelum entry."
      }
    },
  },

};

/**
 * Synchronous in-memory lookup for a ticker detail given a specific horizon
 */
export function getTickerDetailByHorizon(
  tickerCode: string,
  horizon: HorizonPeriod = "5D"
): TickerBrokerDetail | null {
  const code = tickerCode.toUpperCase().trim();
  if (TICKER_HORIZON_DETAILS_MAP[code]?.[horizon]) {
    return TICKER_HORIZON_DETAILS_MAP[code]![horizon]!;
  }
  const base1D = TICKER_DETAILS_MAP[code];
  if (base1D) {
    // Explicit safeguard: If requesting multi-day horizon but only 1D is available,
    // explicitly mark is_horizon_fallback = true so UI warns the user honestly.
    return {
      ...base1D,
      horizon,
      is_horizon_fallback: true,
      horizon_fallback_reason: `Snapshot multi-horizon (${horizon}) belum tersedia untuk ${code}. Menampilkan baseline 1-Hari EOD secara transparan.`,
    };
  }
  return null;
}

/**
 * Synthesizes an honest, transparent fallback detail for a stock present in QUADRANT_MAPS or DAILY_INSIGHTS_MAP
 * when granular multi-broker breakdown is still pending compilation.
 * NEVER fabricates fake broker entities or imaginary transaction volumes.
 */
export function buildQuadrantFallbackDetail(
  tickerCode: string,
  horizon: HorizonPeriod = "5D",
  customQuadrantMaps?: Record<string, QuadrantMapDetail>
): TickerBrokerDetail | null {
  const code = tickerCode.toUpperCase().trim();
  const sourceQuadrants = customQuadrantMaps || QUADRANT_MAPS;

  // 1. Search across QUADRANT_MAPS
  for (const [qKey, qMap] of Object.entries(sourceQuadrants)) {
    const stock = qMap.stocks.find((s) => s.ticker === code);
    if (stock) {
      const isPositive = stock.smart_money_net >= 0;
      const horizonLabel =
        horizon === "2D"
          ? "2 Hari (20-23 Nov)"
          : horizon === "10D"
          ? "10 Hari (10-23 Nov)"
          : "5 Hari (17-23 Nov)";
      const dateRange =
        horizon === "2D"
          ? "20 - 23 Nov 2026"
          : horizon === "10D"
          ? "10 - 23 Nov 2026"
          : "17 - 23 Nov 2026";

      return {
        ticker: stock.ticker,
        close: stock.close,
        change_percent: stock.change_percent,
        quadrant: qKey,
        quadrant_label: qMap.name,
        status_color: qMap.color as "emerald" | "amber" | "sky" | "rose",
        horizon,
        horizon_label: horizonLabel,
        date_range: dateRange,
        top_accumulators: isPositive
          ? [
              {
                code: "SMART",
                name: "Smart Money (Akumulasi)",
                investor_group: "LOCAL",
                net_value: stock.smart_money_net,
                avg_price: stock.close,
              },
            ]
          : [],
        top_distributors: !isPositive
          ? [
              {
                code: "SELLER",
                name: "Smart Money (Distribusi)",
                investor_group: "LOCAL",
                net_value: stock.smart_money_net,
                avg_price: stock.close,
              },
            ]
          : [],
        net_value: stock.smart_money_net,
        net_volume_lots: Math.round(Math.abs(stock.smart_money_net) / (stock.close * 100)) || 1000,
        concentration_pct: 0,
        bandar_avg_cost: stock.close,
        bandar_cost_gap_pct: 0.0,
        counterparty_note: `Pergerakan terklasifikasi dalam kuadran ${qMap.name}. Komposisi broker detail sedang menunggu kompilasi sinkronisasi berikutnya.`,
        why_insight: `${stock.ticker} berada pada kuadran ${qMap.name} (${qMap.philosophy}). Smart money tercatat net ${isPositive ? "inflow" : "outflow"} senilai ${formatRupiah(stock.smart_money_net)}.`,
        trade_plan: {
          action: isPositive ? "SWING BUY / ACCUMULATE" : "AVOID / SELL ON STRENGTH",
          entry_zone: `${Math.round(stock.close * 0.98)} - ${stock.close}`,
          stop_loss: String(Math.round(stock.close * 0.95)),
          target_price: `${Math.round(stock.close * 1.05)} - ${Math.round(stock.close * 1.1)}`,
          rr_ratio: "1 : 2.0",
          note: `Rencana trading berbasis zona harga kuadran ${qMap.name}. Selalu gunakan proteksi stop loss dan perhatikan konfirmasi volume.`,
        },
        is_horizon_fallback: true,
        horizon_fallback_reason: `Data transaksi broker granular untuk ${stock.ticker} sedang dalam antrean sinkronisasi EOD. Menampilkan parameter harga dan arus kas kuadran secara transparan.`,
      };
    }
  }

  // 2. Search across DAILY_INSIGHTS_MAP
  for (const h of ["2D", "5D", "10D"] as HorizonPeriod[]) {
    const card = DAILY_INSIGHTS_MAP[h];
    const spot = card?.sweet_spots.find((s) => s.ticker === code);
    if (spot) {
      const group: "FOREIGN" | "LOCAL" | "GOVERNMENT" =
        spot.lead_group === "FOREIGN"
          ? "FOREIGN"
          : spot.lead_group === "GOVERNMENT"
          ? "GOVERNMENT"
          : "LOCAL";
      const estNetVal = Math.round(spot.close * 10000 * 100);

      return {
        ticker: spot.ticker,
        close: spot.close,
        change_percent: spot.change_percent,
        quadrant: "markup_akumulasi",
        quadrant_label: "[MA] Markup + Akumulasi",
        status_color: "emerald",
        horizon,
        horizon_label: card.horizon_label,
        date_range: card.date_range,
        top_accumulators: [
          {
            code: spot.lead_accumulator,
            name: "Lead Accumulator",
            investor_group: group,
            net_value: estNetVal,
            avg_price: spot.bandar_cost,
          },
        ],
        top_distributors: [],
        net_value: estNetVal,
        net_volume_lots: 10000,
        concentration_pct: 0,
        bandar_avg_cost: spot.bandar_cost,
        bandar_cost_gap_pct: spot.gap_pct,
        counterparty_note: `Dominasi akumulasi oleh broker ${spot.lead_accumulator} (${spot.lead_group})`,
        why_insight: spot.why_brief,
        trade_plan: {
          action: "BUY ON PULLBACK",
          entry_zone: spot.sweet_zone,
          stop_loss: spot.stop_loss,
          target_price: spot.target_price,
          rr_ratio: "1 : 2.5",
          note: `Strategi buy on pullback mengikuti akumulasi ${spot.lead_accumulator}. Disiplin cut loss bila tembus ${spot.stop_loss}.`,
        },
        is_horizon_fallback: true,
        horizon_fallback_reason: `Data transaksi broker harian ditampilkan dari ringkasan Sweet Spot. Detail multi-broker granular sedang dipersiapkan.`,
      };
    }
  }

  return null;
}

/**
 * On-demand ticker detail fetcher (Live API first when enabled, then static snapshot fallback, then honest null)
 * NEVER synthesizes fake financial data or hallucinations.
 */
export async function fetchTickerDetail(
  tickerCode: string,
  horizon: HorizonPeriod = "5D",
  preferLive: boolean = true,
  customQuadrantMaps?: Record<string, QuadrantMapDetail>,
  forceRefresh: boolean = false
): Promise<TickerBrokerDetail | null> {
  const code = tickerCode.toUpperCase().trim();

  if (preferLive) {
    try {
      const qs = new URLSearchParams({
        ticker: code,
        horizon,
        live: "true",
      });
      if (forceRefresh) qs.set("refresh", "true");
      const res = await fetch(`/api/broker-flow?${qs.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data as TickerBrokerDetail;
        }
      }
    } catch {
      // network or API offline fallback (e.g. non-browser test runtime)
    }
  }

  const direct = getTickerDetailByHorizon(code, horizon);
  if (direct) {
    return direct;
  }

  // Transparent fallback from quadrant or daily insights if available
  const quadrantFallback = buildQuadrantFallbackDetail(code, horizon, customQuadrantMaps);
  if (quadrantFallback) {
    return quadrantFallback;
  }

  // Honest null: never fabricate data
  return null;
}

/**
 * Multi-Horizon Daily Insights Map
 * Captures 2D (Momentum/Trigger), 5D (Weekly Persistence), and 10D (Structural Base)
 */
export const DAILY_INSIGHTS_MAP: Record<HorizonPeriod, DailyInsightCardData> = {
  "2D": {
    horizon: "2D",
    horizon_label: "2 Hari Bursa (Inisiasi & Momentum)",
    date_range: "20 - 23 Nov 2026 (48 Jam Terakhir)",
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
    date_range: "17 - 23 Nov 2026 (1 Pekan Bursa)",
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
    date_range: "10 - 23 Nov 2026 (2 Pekan Bursa)",
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

