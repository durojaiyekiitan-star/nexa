import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getIlpClient } from "@/lib/ilp/client";
import { savePendingSession } from "@/lib/ilp/sessions";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/ilp/initiate
 * Body: { amount: number, goalId: string }
 *
 * Multi-user: the sponsor's wallet is looked up from the logged-in
 * sponsor's own profile, and the student's wallet from the goal's owner's
 * profile — not from fixed env vars. Every real payment now genuinely
 * moves between two real, distinct Interledger accounts.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { amount, goalId } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!goalId) {
      return NextResponse.json({ error: "Missing goalId" }, { status: 400 });
    }

    // Look up the sponsor's own linked wallet
    const { data: sponsorProfile } = await supabase
      .from("profiles")
      .select("ilp_wallet_address")
      .eq("id", user.id)
      .single();
    const sponsorWalletAddressUrl = sponsorProfile?.ilp_wallet_address;
    if (!sponsorWalletAddressUrl) {
      return NextResponse.json(
        { error: "You need to link your Interledger wallet in Settings before making a real payment." },
        { status: 400 }
      );
    }

    // Look up the goal, then its student's linked wallet
    const { data: goalRow } = await supabase.from("funding_goals").select("student_id").eq("id", goalId).single();
    if (!goalRow) {
      return NextResponse.json({ error: "Funding goal not found" }, { status: 404 });
    }
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("ilp_wallet_address")
      .eq("id", goalRow.student_id)
      .single();
    const studentWalletAddressUrl = studentProfile?.ilp_wallet_address;
    if (!studentWalletAddressUrl) {
      return NextResponse.json(
        { error: "This student hasn't linked an Interledger wallet yet, so a real transfer can't be made." },
        { status: 400 }
      );
    }

    const client = await getIlpClient();

    const sponsorWalletAddress = await client.walletAddress.get({ url: sponsorWalletAddressUrl });
    const studentWalletAddress = await client.walletAddress.get({ url: studentWalletAddressUrl });

    const incomingPaymentGrant = await client.grant.request(
      { url: studentWalletAddress.authServer },
      {
        access_token: {
          access: [{ type: "incoming-payment", actions: ["list", "read", "read-all", "complete", "create"] }],
        },
      }
    );
    if (!("access_token" in incomingPaymentGrant)) {
      throw new Error("Expected a non-interactive grant for incoming-payment, got an interactive one.");
    }

    const incomingPayment = await client.incomingPayment.create(
      {
        url: studentWalletAddress.resourceServer,
        accessToken: incomingPaymentGrant.access_token!.value,
      },
      {
        walletAddress: studentWalletAddressUrl,
        incomingAmount: {
          value: String(Math.round(amount * 10 ** studentWalletAddress.assetScale)),
          assetCode: studentWalletAddress.assetCode,
          assetScale: studentWalletAddress.assetScale,
        },
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      }
    );

    const quoteGrant = await client.grant.request(
      { url: sponsorWalletAddress.authServer },
      { access_token: { access: [{ type: "quote", actions: ["create", "read", "read-all"] }] } }
    );
    if (!("access_token" in quoteGrant)) {
      throw new Error("Expected a non-interactive grant for quote, got an interactive one.");
    }

    const quote = await client.quote.create(
      { url: sponsorWalletAddress.resourceServer, accessToken: quoteGrant.access_token!.value },
      { method: "ilp", walletAddress: sponsorWalletAddressUrl, receiver: incomingPayment.id }
    );

    const sessionId = randomUUID();
    const nonce = randomUUID();
    const appOrigin = req.nextUrl.origin;

    const outgoingPaymentGrant = await client.grant.request(
      { url: sponsorWalletAddress.authServer },
      {
        access_token: {
          access: [
            {
              type: "outgoing-payment",
              actions: ["list", "list-all", "read", "read-all", "create"],
              identifier: sponsorWalletAddressUrl,
              limits: {
                debitAmount: quote.debitAmount,
              },
            },
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: `${appOrigin}/ilp/callback?session=${sessionId}`,
            nonce,
          },
        },
      }
    );

    if (!("interact" in outgoingPaymentGrant)) {
      throw new Error("Expected an interactive grant for outgoing-payment, but the wallet auto-approved it.");
    }

    await savePendingSession(sessionId, user.id, {
      quoteId: quote.id,
      amount,
      goalId,
      continueUri: outgoingPaymentGrant.continue.uri,
      continueAccessToken: outgoingPaymentGrant.continue.access_token.value,
      sponsorResourceServer: sponsorWalletAddress.resourceServer,
    });

    return NextResponse.json({ redirectUrl: outgoingPaymentGrant.interact.redirect });
  } catch (err) {
    console.error("[/api/ilp/initiate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error initiating ILP payment" },
      { status: 500 }
    );
  }
}
