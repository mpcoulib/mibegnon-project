const FETCH_TIMEOUT_MS = 12_000;

const BROKEN_HOST_FRAGMENTS = [
  "example.com",
  "localhost",
  "unknown.com",
  "apply-link.com",
];

/**
 * HEAD request with GET fallback (some servers reject HEAD).
 * Returns true if the URL responds 2xx or 3xx.
 */
export async function verifyWebsite(url: string): Promise<boolean> {
  if (!url.startsWith("http")) return false;

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (BROKEN_HOST_FRAGMENTS.some((f) => hostname.includes(f))) return false;
  } catch {
    return false;
  }

  for (const method of ["HEAD", "GET"] as const) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MibegnonBot/1.0)" },
      });
      clearTimeout(timer);
      if (res.status >= 200 && res.status < 400) return true;
    } catch {
      // try GET after HEAD failure
    }
  }
  return false;
}
