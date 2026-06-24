import { hostOf } from "./html";

/** Per-domain politeness: min gap between requests to the same host. */
export class DomainRateLimiter {
  private lastByHost = new Map<string, number>();
  private minGapMs: number;

  constructor(minGapMs = 300) {
    this.minGapMs = minGapMs;
  }

  async waitFor(url: string): Promise<void> {
    const host = hostOf(url);
    if (!host) return;

    const now = Date.now();
    const last = this.lastByHost.get(host) ?? 0;
    const wait = this.minGapMs - (now - last);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait + Math.random() * 100));
    }
    this.lastByHost.set(host, Date.now());
  }
}

/** Group scholarships by domain for logging / politeness hints. */
export function groupByDomain<T extends { link: string }>(
  rows: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const host = hostOf(row.link) || "(invalid)";
    const list = map.get(host) ?? [];
    list.push(row);
    map.set(host, list);
  }
  return map;
}
