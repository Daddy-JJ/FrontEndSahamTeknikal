import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEV_MARKET_NAMESPACE } from "./dev-probe";

export type RevisionProbe = "verified" | "missing" | "failed";

// Read-only, called only after the page confirms owner + allowlisted dev + fixture.
// The client carries the current user's JWT; no privileged key is used.
export async function readDevRevisionProbe(client: SupabaseClient): Promise<RevisionProbe> {
  try {
    const { data: revisions, error } = await client.from("market_series_revisions")
      .select("id,input_digest,bar_count")
      .eq("namespace", DEV_MARKET_NAMESPACE).eq("data_mode", "fixture")
      .order("id").limit(3);
    if (error) return "failed";
    if (!revisions?.length) return "missing";
    if (revisions.length !== 2
      || revisions.map(row => row.bar_count).sort().join(",") !== "2,3") return "failed";
    for (const row of revisions) {
      const { data, error: rpcError } = await client.rpc("read_market_series", { p_revision_id: row.id });
      if (rpcError || !data || data.revision_id !== row.id
        || data.namespace !== DEV_MARKET_NAMESPACE || data.data_mode !== "fixture"
        || data.input_digest !== row.input_digest || !Array.isArray(data.bar_sources)
        || data.bar_sources.length !== row.bar_count
        || typeof data.metadata_source !== "string") return "failed";
    }
    // This proves authenticated RPC access and receipt agreement. Python, not
    // JavaScript, verifies the canonical numeric digest in the backend smoke.
    return "verified";
  } catch {
    return "failed";
  }
}
