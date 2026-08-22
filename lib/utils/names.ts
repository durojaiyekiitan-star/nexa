/**
 * Shared name-formatting helpers. Everywhere in the app that needs a
 * display name or initials should import from here rather than writing
 * its own local version — that's what let the same dropped-column bug
 * slip into multiple files during the Phase 2 migration.
 */

export function getFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}
