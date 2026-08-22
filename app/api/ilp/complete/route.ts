import { NextRequest, NextResponse } from "next/server";
import { getIlpClient } from "@/lib/ilp/client";
import { getPendingSession, deletePendingSession } from "@/lib/ilp/sessions";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils/names";

/**
 * POST /api/ilp/complete
 * Body: { sessionId: string, interactRef: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { sessionId, interactRef } = await req.json();

    const session = await getPendingSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found or already used" }, { status: 404 });
    }

    // Whoever's completing this must be logged in — and, since RLS scopes
    // ilp_pending_sessions to the sponsor who created it, this is
    // necessarily that same sponsor.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { data: sponsorProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, ilp_wallet_address")
      .eq("id", user.id)
      .single();
    const sponsorWalletAddressUrl = sponsorProfile?.ilp_wallet_address;
    if (!sponsorWalletAddressUrl) {
      return NextResponse.json({ error: "Your linked wallet address could not be found." }, { status: 400 });
    }

    const client = await getIlpClient();

    const continuedGrant = await client.grant.continue(
      { url: session.continueUri, accessToken: session.continueAccessToken },
      { interact_ref: interactRef }
    );

    if (!("access_token" in continuedGrant)) {
      throw new Error("Grant continuation did not return an access token — approval may have failed.");
    }

    const outgoingPayment = await client.outgoingPayment.create(
      { url: session.sponsorResourceServer, accessToken: continuedGrant.access_token!.value },
      { walletAddress: sponsorWalletAddressUrl, quoteId: session.quoteId }
    );

    await deletePendingSession(sessionId);

    // The real money has now genuinely moved between two real, distinct
    // Interledger wallets. Record it as a real contribution.
    let dbWarning: string | null = null;
    try {
      const sponsorInitials = sponsorProfile ? getInitials(sponsorProfile.first_name, sponsorProfile.last_name) : "ILP";
      const { error: insertError } = await supabase.from("contributions").insert({
        goal_id: session.goalId,
        sponsor_id: user.id,
        sponsor_initials: sponsorInitials,
        amount: session.amount,
        source: "ilp",
      });
      if (insertError) dbWarning = "Payment succeeded, but recording it in Nexa failed: " + insertError.message;
    } catch (dbErr) {
      dbWarning = "Payment succeeded, but recording it in Nexa failed: " + (dbErr instanceof Error ? dbErr.message : "unknown error");
    }

    return NextResponse.json({
      id: outgoingPayment.id,
      amount: session.amount,
      debitAmount: outgoingPayment.debitAmount,
      receiveAmount: outgoingPayment.receiveAmount,
      state: outgoingPayment.failed ? "failed" : "completed",
      warning: dbWarning,
    });
  } catch (err) {
    console.error("[/api/ilp/complete]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error completing ILP payment" },
      { status: 500 }
    );
  }
}
