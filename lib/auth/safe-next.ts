/** Chemins internes autorisés après login. Empêche les open redirects. */
export function safeAuthNext(raw: unknown): string {
  if (typeof raw !== "string") return "/dashboard";
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return "/dashboard";
  }
  if (next.startsWith("/admin") || next.startsWith("/dashboard")) return next;
  return "/dashboard";
}
