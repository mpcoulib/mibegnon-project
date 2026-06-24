import * as cheerio from "cheerio";

const SOFT_404_PATTERNS = [
  /\b404\b/,
  /not found/i,
  /page (?:doesn't|does not) exist/i,
  /no longer available/i,
  /page introuvable/i,
  / cette page n'existe plus/i,
];

const CLOSED_PATTERNS = [
  /applications?\s+(?:are\s+)?closed/i,
  /application\s+period\s+(?:has\s+)?ended/i,
  /no longer accepting/i,
  /programme?\s+(?:est\s+)?(?:fermé|clôturé)/i,
  /candidatures?\s+fermées/i,
];

const EXPIRED_PATTERNS = [
  /deadline\s+(?:has\s+)?passed/i,
  /expired/i,
  /date\s+limite\s+dépassée/i,
];

const JS_SHELL_PATTERNS = [
  /<div id="root"><\/div>/i,
  /<div id="__next"><\/div>/i,
  /enable javascript/i,
  /please enable js/i,
];

export function extractPageText(html: string, maxChars = 8000): {
  title: string;
  text: string;
} {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside, noscript").remove();
  const title = $("title").text().trim();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return {
    title,
    text: text.length > maxChars ? text.slice(0, maxChars) + "…" : text,
  };
}

export function detectSoft404(title: string, text: string): boolean {
  const blob = `${title} ${text}`.slice(0, 2000);
  return SOFT_404_PATTERNS.some((p) => p.test(blob));
}

export function detectClosedSignals(title: string, text: string): boolean {
  const blob = `${title} ${text}`.slice(0, 4000);
  return CLOSED_PATTERNS.some((p) => p.test(blob));
}

export function detectExpiredSignals(title: string, text: string): boolean {
  const blob = `${title} ${text}`.slice(0, 4000);
  return EXPIRED_PATTERNS.some((p) => p.test(blob));
}

export function looksJsOnly(html: string, text: string): boolean {
  if (text.length > 400) return false;
  return JS_SHELL_PATTERNS.some((p) => p.test(html));
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function sameHost(a: string, b: string): boolean {
  return hostOf(a) !== "" && hostOf(a) === hostOf(b);
}
