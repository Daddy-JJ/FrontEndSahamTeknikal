"use client";
import { useCallback } from "react";
import { ChartPanel } from "./chart-panel";
import { workspaceChartFixture } from "@/lib/workspace-chart-fixture";
import { chartIndicators } from "@/lib/chart-navigation";
import type { ChartRequest } from "@/lib/chart-contract";
import type { Signal, Snapshot } from "@/lib/types";

/** Explicit fixture adapter, with no HTTP or live-data fallback. */
export function WorkspaceChart({ snapshot, ticker, signal }: { snapshot: Snapshot; ticker: string; signal?: Signal }) {
  const request: ChartRequest = { ticker, context: signal ? "signal" : "latest", context_id: signal?.id,
    view: signal ? "snapshot" : "followup", timeframe: "1d", limit: 250 };
  const load = useCallback(async (next: ChartRequest, _cursor: string | undefined, abort: AbortSignal) => {
    if (abort.aborted) throw new DOMException("Aborted", "AbortError");
    return workspaceChartFixture(snapshot, next);
  }, [snapshot]);
  return <ChartPanel key={ticker + ":" + (signal?.id ?? "latest")} request={request} mode="fixture" fixture load={load}
    initialIndicators={chartIndicators(signal?.candidate.strategy)} />;
}
