import "server-only";
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";
import { appDataMode, fixturePreviewAllowed } from "@/lib/data-mode";

export async function journalOwner() {
  if (!publicSupabaseConfig()) return { kind: "unconfigured" as const };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { kind: "unauthenticated" as const };
  const { data: member, error: memberError } = await supabase
    .from("app_members").select("role,enabled").eq("user_id",user.id).maybeSingle();
  if (memberError) return { kind: "unavailable" as const };
  if (member?.role !== "owner" || member.enabled !== true) {
    return { kind: "forbidden" as const };
  }
  const { data: settings, error: settingsError } = await supabase
    .from("deployment_settings").select("data_mode").eq("singleton",true).single();
  if (settingsError || !["fixture","live"].includes(settings?.data_mode ?? "")) {
    return { kind: "unavailable" as const };
  }
  if (settings!.data_mode !== appDataMode()
    || (settings!.data_mode === "fixture" && !fixturePreviewAllowed())) {
    return { kind: "unavailable" as const };
  }
  return { kind: "ready" as const, supabase, ownerId:user.id,
    mode: settings!.data_mode as "fixture" | "live" };
}

export type ActualTrade = {
  id: string;
  ticker: string;
  data_mode: "fixture" | "live";
  primary_strategy: string;
  status: "draft" | "open" | "closed";
  revision: number;
  initial_stop: string | number;
  current_stop: string | number;
  initial_risk_idr: string | number | null;
  provisional_risk_idr: string | number;
  open_quantity: number;
  remaining_cost_idr: string | number;
  realized_pnl_idr: string | number;
  realized_r: string | number | null;
  fee_total_idr: string | number;
  exit_policy_snapshot: { version?: string; mode?: string; target_r?: number; ma_type?: string; period?: number };
  closed_at: string | null;
  created_at: string;
  entry_finalized_at: string | null;
};

export type ActualAnalytics = {
  mode: "actual";
  data_mode: "fixture" | "live";
  basis: "IDR";
  closed: number;
  open: number;
  draft: number;
  wins: number;
  losses: number;
  breakeven: number;
  estimated_fee_trades: number;
  net_pnl_idr: number | string;
  win_rate: number | string | null;
  expectancy_r: number | string | null;
  profit_factor: number | string | null;
  profit_factor_status: "defined" | "no_losses" | "no_closed";
  payoff_ratio: number | string | null;
  payoff_status: "defined" | "no_wins" | "no_losses" | "no_closed";
  fee_quality: "actual" | "includes_estimates" | "no_closed";
};

export type ActualRCurvePoint = {
  sequence: number;
  trade_id: string;
  ticker: string;
  strategy: string;
  exit_session: string;
  closed_at: string;
  realized_r: number | string;
  cumulative_r: number | string;
  drawdown_r: number | string;
  realized_pnl_idr: number | string;
  cumulative_pnl_idr: number | string;
};

export type ActualRCurve = {
  mode: "actual";
  data_mode: "fixture" | "live";
  basis: "IDR";
  cohort_date: "exit_session_Asia_Jakarta";
  from: string | null;
  to: string | null;
  primary_strategy: string | null;
  exit_version: string | null;
  exit_snapshot: Record<string, unknown> | null;
  total_closed: number;
  final_cumulative_r: number | string;
  max_drawdown_r: number | string;
  points: ActualRCurvePoint[];
};

export type StrategyAttribution = {
  strategy: string;
  closed: number;
  wins: number;
  losses: number;
  breakeven: number;
  net_pnl_idr: number | string;
  expectancy_r: number | string | null;
  win_rate: number | string | null;
  profit_factor: number | string | null;
  profit_factor_status: "defined" | "no_losses" | "no_closed";
  payoff_ratio: number | string | null;
  payoff_status: "defined" | "no_wins" | "no_losses" | "no_closed";
};

export type ActualAttribution = {
  mode: "actual";
  data_mode: "fixture" | "live";
  basis: "IDR";
  cohort_date: "exit_session_Asia_Jakarta";
  from: string | null;
  to: string | null;
  exit_version: string | null;
  exit_snapshot: Record<string, unknown> | null;
  strategies: StrategyAttribution[];
};

export type LivePaperTrade = {
  id: string;
  run_id: string | null;
  signal_id: string | null;
  ticker: string;
  strategy: string;
  experiment_id: string;
  exit_mode: string;
  state: "pending_entry" | "open" | "closed" | "data_hold";
  reason: string;
  entry_session: string | null;
  entry_price: number | string | null;
  initial_stop: number | string | null;
  current_stop: number | string | null;
  target_price: number | string | null;
  exit_session: string | null;
  exit_price: number | string | null;
  exit_reason: string | null;
  realized_r: number | string | null;
  alternate_r: number | string | null;
  initial_risk_idr: number | string | null;
  updated_at: string;
};

export type LivePaperJournal = {
  mode: "paper";
  data_mode: "fixture" | "live";
  trades_count: number;
  closed_count: number;
  open_count: number;
  data_hold_count: number;
  ambiguous_count: number;
  wins: number;
  losses: number;
  win_rate: number | string | null;
  expectancy_r: number | string | null;
  cumulative_r: number | string;
  trades: LivePaperTrade[];
};
