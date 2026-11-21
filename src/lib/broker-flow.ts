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
  { broker: "BB", name: "Verdhana Sekuritas", buy_value: 66_500_000_000, sell_value: -120_500_000_000, net_value: -53_900_000_000, stocks_count: "8B / 20S" },
  { broker: "RX", name: "Macquarie Sekuritas", buy_value: 52_100_000_000, sell_value: -126_900_000_000, net_value: -74_900_000_000, stocks_count: "5B / 18S" },
  { broker: "AZ", name: "Sucor Sekuritas", buy_value: 98_200_000_000, sell_value: -62_700_000_000, net_value: 35_500_000_000, stocks_count: "23B / 34S" },
  { broker: "XL", name: "Stockbit Sekuritas", buy_value: 115_600_000_000, sell_value: -40_400_000_000, net_value: 75_200_000_000, stocks_count: "95B / 55S" },
  { broker: "NI", name: "BNI Sekuritas", buy_value: 77_800_000_000, sell_value: -50_400_000_000, net_value: 27_400_000_000, stocks_count: "45B / 21S" },
  { broker: "YP", name: "Mirae Asset Sekuritas", buy_value: 81_000_000_000, sell_value: -41_500_000_000, net_value: 39_400_000_000, stocks_count: "51B / 47S" },
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
};
