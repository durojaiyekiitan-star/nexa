/**
 * Shared funding-math helpers. A free course (amount_needed = 0) needs no
 * funding at all, so it's treated as 100% funded rather than causing a
 * divide-by-zero (which would otherwise show "NaN%" in the UI).
 */
export function getPercentFunded(amountRaised: number, amountNeeded: number): number {
  if (amountNeeded <= 0) return 100;
  return Math.min(100, Math.round((amountRaised / amountNeeded) * 100));
}
