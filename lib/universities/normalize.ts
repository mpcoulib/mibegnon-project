/** Normalize a university name for dedup / DB matching. */
export function normalizeUniversityName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(
      /\b(university|universite|université|college|institute|institut|school|of|de|du|des|la|le|les|the)\b/gi,
      " ",
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesMatch(a: string, b: string): boolean {
  const na = normalizeUniversityName(a);
  const nb = normalizeUniversityName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 8 && nb.length >= 8 && (na.includes(nb) || nb.includes(na))) {
    return true;
  }
  return false;
}

export function domainFromUrl(url: string): string | null {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function logoUrlFromWebsite(website: string): string | null {
  const domain = domainFromUrl(website);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}
