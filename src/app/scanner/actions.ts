"use server";

import { revalidatePath } from "next/cache";
import { journalOwner } from "@/lib/journal-server";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const signalIdRegex = /^[0-9a-f]{64}$/;
const allowedActions = ["watchlist", "planned", "skipped", "none"] as const;

export type SignalAction = (typeof allowedActions)[number];

export interface SetSignalActionResult {
  success?: boolean;
  error?: string;
  data?: {
    signal_id: string;
    action: string;
    revision: number;
  };
}

export async function setSignalAction(formData: FormData): Promise<SetSignalActionResult> {
  const context = await journalOwner();
  if (context.kind !== "ready") {
    return { error: context.kind };
  }

  const signalId = String(formData.get("signal_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const rawRevision = formData.get("expected_revision");
  const requestId = String(formData.get("request_id") ?? "").trim();

  if (!signalIdRegex.test(signalId)) {
    return { error: "invalid_signal_id" };
  }
  if (!allowedActions.includes(action as SignalAction)) {
    return { error: "invalid_action" };
  }
  const expectedRevision = Number(rawRevision);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    return { error: "invalid_revision" };
  }
  if (!uuidRegex.test(requestId)) {
    return { error: "invalid_request_id" };
  }

  const { data, error } = await context.supabase.rpc("set_signal_action", {
    p_signal_id: signalId,
    p_action: action,
    p_expected_revision: expectedRevision,
    p_request_id: requestId,
  });

  if (error) {
    if (error.code === "PT412") {
      return { error: "revision_conflict" };
    }
    const safeCode = ["40001", "23514", "22023", "42501"].includes(error.code)
      ? error.code
      : "unavailable";
    return { error: safeCode };
  }

  revalidatePath("/scanner");
  return {
    success: true,
    data: data as { signal_id: string; action: string; revision: number },
  };
}
