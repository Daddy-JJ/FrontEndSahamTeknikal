export const journalStrategies = ["MACD_EMA200_V1", "FRACTAL_BREAKOUT_V1", "RS_BREAKOUT_V1", "PULLBACK_RECLAIM_V1"];

// These are the immutable exit snapshots created by this frontend. The backend
// compares the complete JSON value; a version alone is not an exact experiment.
export const journalExitSnapshots = {
  fixed2r: { version: "actual-fixed2r-v1", mode: "fixed_rr", target_r: 2 },
  ma10: { version: "actual-ma10-v1", mode: "ma_close", ma_type: "SMA", period: 10 },
  manual: { version: "actual-manual-v1", mode: "manual" },
} as const;
export type JournalExitSnapshotKey = keyof typeof journalExitSnapshots;

export function validSessionDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "0001-01-01") return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Shared cohort validation: invalid filters must never silently widen a cohort. */
export function journalFilters(query: Record<string, string | string[] | undefined>) {
  const keys = ["from", "to", "strategy", "exit_version", "exit_snapshot"] as const;
  if (keys.some(key => Array.isArray(query[key]))) return null;
  const from = (query.from || null) as string | null;
  const to = (query.to || null) as string | null;
  const strategy = (query.strategy || null) as string | null;
  const exitVersion = (query.exit_version || null) as string | null;
  const exitSnapshotKey = (query.exit_snapshot || null) as string | null;
  const exitSnapshot = exitSnapshotKey && Object.hasOwn(journalExitSnapshots, exitSnapshotKey)
    ? journalExitSnapshots[exitSnapshotKey as JournalExitSnapshotKey] : null;
  if ((from && !validSessionDate(from)) || (to && !validSessionDate(to))
    || (from && to && from > to) || (strategy && !journalStrategies.includes(strategy))
    || (exitVersion && !/^[A-Za-z0-9_-]{1,60}$/.test(exitVersion))
    || (exitSnapshotKey && !exitSnapshot)
    || (exitSnapshot && exitVersion && exitVersion !== exitSnapshot.version)) return null;
  return { from, to, strategy, exitVersion, exitSnapshotKey, exitSnapshot };
}

export type JournalFilters = NonNullable<ReturnType<typeof journalFilters>>;

/** Preserve the complete validated cohort across navigation and export. */
export function journalFilterParams(filters: JournalFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.strategy) params.set("strategy", filters.strategy);
  if (filters.exitVersion) params.set("exit_version", filters.exitVersion);
  if (filters.exitSnapshotKey) params.set("exit_snapshot", filters.exitSnapshotKey);
  return params;
}
