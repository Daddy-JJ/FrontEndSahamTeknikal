export type TickerTabKey =
  | "rekomendasi"
  | "bandar"
  | "broker"
  | "teknikal"
  | "pro"
  | "ownership"
  | "aksi"
  | "news";

export const TICKER_TABS: { key: TickerTabKey; label: string }[] = [
  { key: "rekomendasi", label: "REKOMENDASI" },
  { key: "bandar", label: "BANDAR" },
  { key: "broker", label: "BROKER" },
  { key: "teknikal", label: "ANALISIS TEKNIKAL" },
  { key: "pro", label: "PRO INTEL" },
  { key: "ownership", label: "OWNERSHIP" },
  { key: "aksi", label: "AKSI KORPORASI" },
  { key: "news", label: "NEWS" },
];

export function resolveTickerTabKey(raw: string | null | undefined): TickerTabKey {
  const norm = String(raw || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (norm === "bandar") return "bandar";
  if (norm === "broker") return "broker";
  if (norm === "analisisteknikal" || norm === "teknikal" || norm === "analysis") return "teknikal";
  if (norm === "prointel" || norm === "pro") return "pro";
  if (norm === "ownership") return "ownership";
  if (norm === "aksikorporasi" || norm === "aksi" || norm === "calendar") return "aksi";
  if (norm === "news" || norm === "berita") return "news";
  return "rekomendasi";
}
