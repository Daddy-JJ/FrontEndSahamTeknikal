"use server";

import { redirect } from "next/navigation";
import { createClient, publicSupabaseConfig } from "@/lib/supabase/server";
import {
  DEV_FIXTURE_NAMESPACE,
  DEV_OWNER_ACTION_REQUEST_ID,
  DEV_PROJECT_URL,
} from "@/lib/supabase/dev-probe";

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/auth/error?reason=logout");
  redirect("/login");
}

export async function verifyDevOwnerAction() {
  if (publicSupabaseConfig()?.url !== DEV_PROJECT_URL) redirect("/auth/check?probe=unavailable");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: member, error: memberError } = await supabase
    .from("app_members")
    .select("role,enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberError || member?.role !== "owner" || member.enabled !== true) {
    redirect("/auth/check?probe=denied");
  }

  const { data: settings, error: settingsError } = await supabase
    .from("deployment_settings")
    .select("data_mode")
    .eq("singleton", true)
    .single();
  if (settingsError || settings?.data_mode !== "fixture") {
    redirect("/auth/check?probe=unavailable");
  }

  const { data: signal, error: signalError } = await supabase
    .from("signals")
    .select("id")
    .eq("namespace", DEV_FIXTURE_NAMESPACE)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (signalError || !signal) redirect("/auth/check?probe=unavailable");

  const request = {
    p_signal_id: signal.id,
    p_action: "watchlist",
    p_expected_revision: 0,
    p_request_id: DEV_OWNER_ACTION_REQUEST_ID,
  };
  const first = await supabase.rpc("set_signal_action", request);
  if (first.error) redirect("/auth/check?probe=failed");
  const replay = await supabase.rpc("set_signal_action", request);
  if (replay.error || JSON.stringify(replay.data) !== JSON.stringify(first.data)) {
    redirect("/auth/check?probe=failed");
  }

  const { data: action, error: actionError } = await supabase
    .from("signal_actions")
    .select("action,revision")
    .eq("owner_id", user.id)
    .eq("signal_id", signal.id)
    .maybeSingle();
  if (actionError || action?.action !== "watchlist" || action.revision !== 1) {
    redirect("/auth/check?probe=failed");
  }
  redirect("/auth/check?probe=ok");
}
