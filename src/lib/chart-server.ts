import "server-only";
import { journalOwner } from "@/lib/journal-server";
import { chartFailure, readChartResult } from "@/lib/chart-reader";
import type { ChartRequest, ChartEnvelope } from "@/lib/chart-contract";
export async function readChart(
  request: ChartRequest,
  requestId: string,
): Promise<ChartEnvelope> {
  try {
    const owner = await journalOwner();
    if (owner.kind !== "ready")
      return chartFailure(
        owner.kind === "unauthenticated"
          ? "UNAUTHENTICATED"
          : owner.kind === "forbidden"
            ? "FORBIDDEN"
            : "BACKEND_NOT_READY",
        requestId,
      );
    return readChartResult(
      request,
      owner.mode,
      (name, args) => owner.supabase.rpc(name, args),
      requestId,
    );
  } catch {
    return chartFailure("INTERNAL_ERROR", requestId);
  }
}
