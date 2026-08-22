/**
 * Interledger wallet addresses ("payment pointers") are conventionally
 * shown to users in $-shorthand form (e.g. $ilp.interledger-test.dev/name),
 * which is equivalent to the https:// form our code actually needs to make
 * API calls. We accept either form from the user and always normalize to
 * https:// before it's stored — so the UI matches what people see on the
 * wallet site, while the database always holds a form the Open Payments
 * SDK can use directly.
 */

const WALLET_INPUT_PATTERN = /^(\$|https:\/\/)\S+\/\S+$/;

export function isValidWalletInput(input: string): boolean {
  return WALLET_INPUT_PATTERN.test(input.trim());
}

export function normalizeWalletAddress(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("$")) return "https://" + trimmed.slice(1);
  return trimmed;
}
