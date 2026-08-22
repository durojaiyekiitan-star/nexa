import { createAuthenticatedClient, type AuthenticatedClient } from "@interledger/open-payments";
import { readFileSync } from "fs";
import { createPrivateKey, type KeyObject } from "crypto";

/**
 * This file must NEVER be imported from a "use client" component — it reads
 * a private key and signs requests. It only runs inside API routes.
 *
 * IMPORTANT: this is Nexa's OWN wallet identity — the platform's, not any
 * individual sponsor's or student's. It's used to SIGN every Open Payments
 * request, regardless of which real user initiated the action. This is
 * the standard pattern: the signing "client" and the wallet being acted
 * upon (via a grant) are deliberately different parties. Individual users'
 * own wallet addresses (looked up per-request from their profile) are what
 * make payments genuinely peer-to-peer between real accounts.
 *
 * Supports two ways of providing the private key:
 *
 *   Local dev:
 *     NEXA_PRIVATE_KEY_PATH=./keys/nexa-private.key
 *
 *   Vercel / any serverless deploy (no persistent filesystem):
 *     NEXA_PRIVATE_KEY_BASE64=<base64-encoded contents of the key file>
 */

function loadPrivateKey(): KeyObject {
  const base64 = process.env.NEXA_PRIVATE_KEY_BASE64;
  if (base64) {
    const pem = Buffer.from(base64, "base64").toString("utf-8");
    return createPrivateKey(pem);
  }

  const path = process.env.NEXA_PRIVATE_KEY_PATH;
  if (path) {
    const pem = readFileSync(path, "utf-8");
    return createPrivateKey(pem);
  }

  throw new Error(
    "Missing private key. Set either NEXA_PRIVATE_KEY_BASE64 (for deploy) or NEXA_PRIVATE_KEY_PATH (for local dev) in your env."
  );
}

let clientPromise: Promise<AuthenticatedClient> | null = null;

export function getIlpClient(): Promise<AuthenticatedClient> {
  if (!clientPromise) {
    const walletAddressUrl = process.env.NEXA_WALLET_ADDRESS;
    const keyId = process.env.NEXA_KEY_ID;

    if (!walletAddressUrl || !keyId) {
      throw new Error("Missing ILP env vars. Check NEXA_WALLET_ADDRESS and NEXA_KEY_ID are set.");
    }

    clientPromise = createAuthenticatedClient({
      walletAddressUrl,
      keyId,
      privateKey: loadPrivateKey(),
    });
  }
  return clientPromise;
}
