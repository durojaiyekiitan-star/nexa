import { createClient } from "@/lib/supabase/server";

/**
 * The Open Payments outgoing-payment grant is interactive: the sponsor gets
 * redirected to their wallet to approve, then redirected back. We need to
 * remember what we were doing (which quote, which continuation token)
 * across that round trip. This now lives in a real database table rather
 * than an in-memory Map — the Map worked in local dev (one long-running
 * process) but silently fails on Vercel, where the initiate and complete
 * requests can land on entirely different serverless instances that don't
 * share memory.
 */

export interface PendingIlpSession {
  quoteId: string;
  amount: number;
  goalId: string;
  continueUri: string;
  continueAccessToken: string;
  sponsorResourceServer: string;
}

export async function savePendingSession(sessionId: string, sponsorId: string, data: PendingIlpSession) {
  const supabase = await createClient();
  const { error } = await supabase.from("ilp_pending_sessions").insert({
    id: sessionId,
    sponsor_id: sponsorId,
    quote_id: data.quoteId,
    amount: data.amount,
    goal_id: data.goalId,
    continue_uri: data.continueUri,
    continue_access_token: data.continueAccessToken,
    sponsor_resource_server: data.sponsorResourceServer,
  });
  if (error) throw new Error("Failed to persist ILP session: " + error.message);
}

export async function getPendingSession(sessionId: string): Promise<PendingIlpSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("ilp_pending_sessions").select("*").eq("id", sessionId).single();
  if (!data) return null;
  return {
    quoteId: data.quote_id,
    amount: Number(data.amount),
    goalId: data.goal_id,
    continueUri: data.continue_uri,
    continueAccessToken: data.continue_access_token,
    sponsorResourceServer: data.sponsor_resource_server,
  };
}

export async function deletePendingSession(sessionId: string) {
  const supabase = await createClient();
  await supabase.from("ilp_pending_sessions").delete().eq("id", sessionId);
}
