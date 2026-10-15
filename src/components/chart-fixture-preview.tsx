"use client";
import { useCallback, useState } from "react";
import { ChartPanel } from "./chart-panel";
import { previewChart } from "@/lib/chart-preview-scenarios";
import { chartFailure } from "@/lib/chart-reader";
import {
  chartErrorCodes,
  type ChartRequest,
  type ChartErrorCode,
} from "@/lib/chart-contract";
export function ChartFixturePreview({ scenario }: { scenario: string }) {
  const [ticker, setTicker] = useState("ADRO");
  const load = useCallback(
    async (
      request: ChartRequest,
      cursor: string | undefined,
      signal: AbortSignal,
    ) => {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          scenario === "slow" ||
            (scenario === "race" && request.ticker === "ADRO")
            ? 1000
            : 50,
        ),
      );
      if (signal.aborted) throw Error("aborted");
      if (chartErrorCodes.includes(scenario as ChartErrorCode))
        return chartFailure(scenario as ChartErrorCode, "fixture");
      const raw = previewChart(scenario, cursor);
      if (
        scenario === "race" &&
        raw &&
        typeof raw === "object" &&
        "data" in raw
      ) {
        const e = raw as { data: Record<string, unknown> };
        return { ...raw, data: { ...e.data, ticker: request.ticker } };
      }
      return raw;
    },
    [scenario],
  );
  const request: ChartRequest = {
    ticker,
    context: "latest",
    view: "followup",
    timeframe: "1d",
    limit: scenario === 'perf500' ? 500 : 250,
  };
  return (
    <>
      {scenario === "race" && (
        <div>
          <button type="button" onClick={() => setTicker("ADRO")}>
            Pilih ADRO
          </button>
          <button type="button" onClick={() => setTicker("INDY")}>
            Pilih INDY
          </button>
        </div>
      )}
      <ChartPanel
        request={request}
        mode="fixture"
        load={scenario === "http" ? undefined : load}
        fixture
      />
    </>
  );
}
