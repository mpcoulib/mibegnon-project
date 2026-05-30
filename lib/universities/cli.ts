export function parseCliArgs(argv: string[]) {
  const args = argv.slice(2);
  const has = (flag: string) => args.includes(flag);
  const value = (flag: string): string | null => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
  };
  const num = (flag: string, fallback: number): number => {
    const v = value(flag);
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    dryRun: has("--dry-run"),
    limit: value("--limit") ? num("--limit", 0) : null,
    offset: num("--offset", 0),
    concurrency: num("--concurrency", 3),
    input: value("--input"),
    output: value("--output"),
  };
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run async tasks with a concurrency cap. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
