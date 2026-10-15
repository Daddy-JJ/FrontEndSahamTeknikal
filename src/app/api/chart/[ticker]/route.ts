import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { parseChartRequest } from "@/lib/chart-contract";
import { chartFailure, chartHttpStatus } from "@/lib/chart-reader";
import { readChart } from "@/lib/chart-server";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const requestId = randomUUID();
  const start = Date.now();
  const { ticker } = await params;
  const query = parseChartRequest(ticker, request.nextUrl.searchParams);
  const result = query
    ? await readChart(query, requestId)
    : chartFailure("INVALID_REQUEST", requestId);
  const status = chartHttpStatus(result);
  console.info(
    JSON.stringify({
      event: "chart_read",
      request_id: requestId,
      status,
      duration_ms: Date.now() - start,
      code: result.success ? "OK" : result.error.code,
    }),
  );
  return NextResponse.json(result, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}
