import "server-only";
import { journalOwner } from "@/lib/journal-server";
import { parseScanItem, parseScanRun, parsePublishedSignal, scannerPageSize, type ScannerQuery } from "@/lib/scanner-contract";

// Column projections deliberately exclude the run's entire items/ranking snapshot.
const runColumns = "id,namespace,data_mode,session_date,status,coverage_valid,coverage_total,stored_at,run_digest,ranking_status:snapshot->ranking->>status,publication_deadline:snapshot->>publication_deadline";
const signalColumns = "signals!inner(id,namespace,data_mode,ticker,strategy,session_date,planned_entry_session,cohort,published_at,provider,universe_version,calendar_version,config_hash,input_digest,price_basis,provider_version:snapshot->>provider_version,engine_version:snapshot->>engine_version,source_revision:snapshot->>source_revision,candidate:snapshot->candidate)";

export async function readScanner(query: ScannerQuery) {
  const checkedAt = Date.now();
  const owner = await journalOwner();
  if (owner.kind !== "ready") return owner;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  let selected = owner.supabase.from("scan_runs").select(runColumns)
    .eq("namespace", "forward").eq("data_mode", owner.mode).lte("session_date", today);
  if (query.run) selected = selected.eq("id", query.run);
  if (query.date) selected = selected.eq("session_date", query.date);
  const [latest, successful] = await Promise.all([
    selected.order("session_date", { ascending: false }).order("stored_at", { ascending: false })
      .order("id", { ascending: false }).limit(1).maybeSingle(),
    owner.supabase.from("scan_runs").select("session_date,status,stored_at")
      .eq("namespace", "forward").eq("data_mode", owner.mode).in("status", ["complete", "partial"])
      .lte("session_date", today).order("session_date", { ascending: false })
      .order("stored_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (latest.error || successful.error) return { kind: "read-error" as const, mode: owner.mode };
  if (!latest.data) return { kind: query.run || query.date ? "missing-run" as const : "preparing" as const, mode: owner.mode };
  const run = parseScanRun(latest.data, owner.mode);
  if (!run) return { kind: "contract-error" as const, mode: owner.mode };
  const section = query.section === "auto" ? run.status !== "complete" ? "quality" : "signals" : query.section;
  const start = (query.page - 1) * scannerPageSize;
  // Fetch only the selected section. +1 is the continuation sentinel.
  let selectedSignals = owner.supabase.from("scan_run_signals").select(signalColumns).eq("run_id", run.id);
  if (query.strategy) selectedSignals = selectedSignals.eq("signals.strategy", query.strategy);
  const response = section === "quality"
    ? await owner.supabase.from("scan_run_items").select("ticker,status,snapshot")
      .eq("run_id", run.id).order("ticker").range(start, start + scannerPageSize)
    : await selectedSignals.order("signal_id").range(start, start + scannerPageSize);
  if (response.error) return { kind: "read-error" as const, mode: owner.mode };
  const values = response.data ?? [];
  const items = section === "quality" ? values.map(parseScanItem) : [];
  const signals = section === "signals" ? values.map(value => parsePublishedSignal(value, run)) : [];
  if ([...items, ...signals].some(value => value === null)) return { kind: "contract-error" as const, mode: owner.mode };
  return { kind: "scan" as const, mode: owner.mode, run, checkedAt, section,
    lastSuccessful: successful.data, hasMore: values.length > scannerPageSize,
    items: items.filter(value => value !== null).slice(0, scannerPageSize),
    signals: signals.filter(value => value !== null).slice(0, scannerPageSize) };
}
