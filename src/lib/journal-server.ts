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
  win_rate: number | null;
  expectancy_r: number | null;
  profit_factor: number | null;
  profit_factor_status: "defined" | "no_losses" | "no_closed";
  payoff_ratio: number | null;
  payoff_status: "defined" | "no_wins" | "no_losses" | "no_closed";
  fee_quality?: "actual" | "includes_estimates" | "no_closed";
};
