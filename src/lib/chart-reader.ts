import { parseChartEnvelope } from "./chart-contract.ts";
import type {
  ChartRequest,
  ChartEnvelope,
  ChartErrorCode,
} from "./chart-contract.ts";
const messages: Record<ChartErrorCode, string> = {
  INVALID_REQUEST: "Filter atau konteks chart tidak valid.",
  UNAUTHENTICATED: "Masuk untuk membaca chart.",
  FORBIDDEN: "Akun tidak memiliki akses chart.",
  NOT_FOUND: "Emiten atau konteks tidak ditemukan.",
  REVISION_UNAVAILABLE: "Revisi halaman tidak tersedia. Muat ulang chart.",
  SNAPSHOT_UNAVAILABLE: "Snapshot historis belum dapat dibuktikan.",
  RATE_LIMITED: "Batas pembacaan tercapai. Tunggu sebelum mencoba lagi.",
  BACKEND_NOT_READY: "Backend chart belum siap.",
  DATA_UNAVAILABLE: "Data harga yang layak belum tersedia.",
  CONTRACT_ERROR: "Respons chart tidak sesuai kontrak.",
  UPSTREAM_ERROR: "Pembacaan chart gagal.",
  INTERNAL_ERROR: "Chart belum dapat dibaca.",
};
export function chartFailure(
  code: ChartErrorCode,
  requestId: string,
): ChartEnvelope {
  return {
    contract_version: "ticker-chart-v1",
    success: false,
    data: null,
    error: {
      code,
      message: messages[code],
      request_id: requestId,
      retryable: [
        "RATE_LIMITED",
        "UPSTREAM_ERROR",
        "INTERNAL_ERROR",
        "BACKEND_NOT_READY",
      ].includes(code),
    },
  };
}
export function chartHttpStatus(envelope: ChartEnvelope) {
  if (envelope.success) return 200;
  return {
    INVALID_REQUEST: 400,
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REVISION_UNAVAILABLE: 409,
    SNAPSHOT_UNAVAILABLE: 409,
    RATE_LIMITED: 429,
    BACKEND_NOT_READY: 503,
    DATA_UNAVAILABLE: 503,
    CONTRACT_ERROR: 502,
    UPSTREAM_ERROR: 502,
    INTERNAL_ERROR: 500,
  }[envelope.error.code];
}
type Rpc = (
  name: string,
  args: { p_request: ChartRequest },
) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
export async function readChartResult(
  request: ChartRequest,
  mode: "live" | "fixture",
  rpc: Rpc,
  requestId: string,
): Promise<ChartEnvelope> {
  try {
    const { data, error } = await rpc("read_ticker_chart_v1", {
      p_request: request,
    });
    if (error)
      return chartFailure(
        error.code === "PGRST202" ? "BACKEND_NOT_READY" : "UPSTREAM_ERROR",
        requestId,
      );
    const parsed = parseChartEnvelope(data, mode, request.ticker);
    if (!parsed) return chartFailure("CONTRACT_ERROR", requestId);
    if (
      parsed.success &&
      (parsed.data.context.kind !== request.context ||
        parsed.data.context.id !== (request.context_id ?? null) ||
        parsed.data.context.view !== request.view ||
        parsed.data.pagination.limit !== request.limit)
    )
      return chartFailure("CONTRACT_ERROR", requestId);
    return parsed;
  } catch {
    return chartFailure("UPSTREAM_ERROR", requestId);
  }
}
