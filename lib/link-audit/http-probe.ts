import {
  detectClosedSignals,
  detectExpiredSignals,
  detectSoft404,
  extractPageText,
  looksJsOnly,
  sameHost,
} from "./html";
import type { HttpProbeResult, LinkVerdict } from "./types";

const USER_AGENT = "Mozilla/5.0 (compatible; MibegnonLinkAudit/1.0)";
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_RETRIES = 2;
const MAX_BODY_BYTES = 120_000;

export async function httpProbe(url: string): Promise<HttpProbeResult> {
  const base: HttpProbeResult = {
    originalUrl: url,
    finalUrl: url,
    httpStatus: null,
    redirectChain: [],
    sameHost: true,
    bodyText: null,
    title: null,
    error: null,
    earlyVerdict: null,
    earlyConfidence: 0,
    needsEscalation: false,
    escalationReason: null,
  };

  if (!url?.startsWith("http")) {
    return {
      ...base,
      error: "invalid_url",
      earlyVerdict: "NEEDS_REVIEW",
      earlyConfidence: 0.9,
      needsEscalation: false,
    };
  }

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fetchWithRedirects(url);
      return interpretProbe(url, result);
    } catch (err) {
      lastError = (err as Error).message;
      if (attempt < MAX_RETRIES) await sleep(500 * (attempt + 1));
    }
  }

  return {
    ...base,
    error: lastError ?? "timeout",
    earlyVerdict: "NEEDS_REVIEW",
    earlyConfidence: 0.5,
    needsEscalation: true,
    escalationReason: "probe_failed_needs_judge",
  };
}

interface FetchOutcome {
  finalUrl: string;
  status: number;
  redirectChain: string[];
  html: string | null;
}

async function fetchWithRedirects(startUrl: string): Promise<FetchOutcome> {
  const redirectChain: string[] = [startUrl];
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetchOnce(current);
    if (res.status >= 300 && res.status < 400 && res.location) {
      const next = new URL(res.location, current).href;
      redirectChain.push(next);
      current = next;
      continue;
    }

    let html: string | null = null;
    if (res.status >= 200 && res.status < 300) {
      html = res.body;
    } else if (res.status >= 400) {
      // Try GET if HEAD failed with 405
      const getRes = await fetchOnce(current, "GET");
      html = getRes.body;
      return {
        finalUrl: current,
        status: getRes.status,
        redirectChain,
        html,
      };
    }

    return {
      finalUrl: current,
      status: res.status,
      redirectChain,
      html,
    };
  }

  throw new Error("too_many_redirects");
}

async function fetchOnce(
  url: string,
  method: "HEAD" | "GET" = "GET",
): Promise<{ status: number; location: string | null; body: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    };
    if (method === "GET") {
      headers.Range = `bytes=0-${MAX_BODY_BYTES}`;
    }

    const res = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers,
    });

    let body: string | null = null;
    if (method === "GET" && res.body) {
      body = await res.text();
      if (body.length > MAX_BODY_BYTES) {
        body = body.slice(0, MAX_BODY_BYTES);
      }
    }

    return {
      status: res.status,
      location: res.headers.get("location"),
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

function interpretProbe(
  originalUrl: string,
  outcome: FetchOutcome,
): HttpProbeResult {
  const { finalUrl, status, redirectChain, html } = outcome;
  const hostSame = sameHost(originalUrl, finalUrl);

  const base: HttpProbeResult = {
    originalUrl,
    finalUrl,
    httpStatus: status,
    redirectChain,
    sameHost: hostSame,
    bodyText: null,
    title: null,
    error: null,
    earlyVerdict: null,
    earlyConfidence: 0,
    needsEscalation: false,
    escalationReason: null,
  };

  if (status === 404 || status === 410) {
    return {
      ...base,
      earlyVerdict: "DEAD",
      earlyConfidence: 0.85,
      needsEscalation: true,
      escalationReason: `http_${status}`,
    };
  }

  if (status === 403 || status === 401 || status === 429) {
    return {
      ...base,
      needsEscalation: true,
      escalationReason: `http_${status}`,
    };
  }

  if (status >= 500) {
    return {
      ...base,
      needsEscalation: true,
      escalationReason: `http_${status}`,
    };
  }

  if (!html) {
    if (status >= 200 && status < 300 && hostSame) {
      return {
        ...base,
        earlyVerdict: "ALIVE",
        earlyConfidence: 0.75,
      };
    }
    return {
      ...base,
      needsEscalation: true,
      escalationReason: "no_body",
    };
  }

  const { title, text } = extractPageText(html);
  base.title = title;
  base.bodyText = text;

  if (detectSoft404(title, text)) {
    return {
      ...base,
      earlyVerdict: "DEAD",
      earlyConfidence: 0.8,
      needsEscalation: true,
      escalationReason: "soft_404",
    };
  }

  if (!hostSame) {
    return {
      ...base,
      needsEscalation: true,
      escalationReason: "cross_host_redirect",
    };
  }

  if (looksJsOnly(html, text)) {
    return {
      ...base,
      needsEscalation: true,
      escalationReason: "js_render_needed",
    };
  }

  if (detectClosedSignals(title, text)) {
    return {
      ...base,
      earlyVerdict: "CLOSED",
      earlyConfidence: 0.7,
      needsEscalation: true,
      escalationReason: "closed_heuristic",
    };
  }

  if (detectExpiredSignals(title, text)) {
    return {
      ...base,
      earlyVerdict: "EXPIRED",
      earlyConfidence: 0.7,
      needsEscalation: true,
      escalationReason: "expired_heuristic",
    };
  }

  if (status >= 200 && status < 300 && text.length > 200) {
    return {
      ...base,
      earlyVerdict: "ALIVE",
      earlyConfidence: 0.88,
    };
  }

  return {
    ...base,
    needsEscalation: true,
    escalationReason: "ambiguous_content",
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function pageClassToVerdict(
  pageClass: string,
): LinkVerdict | "UNSURE" {
  switch (pageClass) {
    case "OPEN":
      return "ALIVE";
    case "DEAD":
      return "DEAD";
    case "CLOSED":
      return "CLOSED";
    case "EXPIRED":
      return "EXPIRED";
    case "MOVED":
      return "MOVED";
    default:
      return "UNSURE";
  }
}

export function suggestedActionFor(
  verdict: LinkVerdict,
  judgeConfirmed: boolean,
): import("./types").SuggestedAction {
  switch (verdict) {
    case "ALIVE":
      return "keep";
    case "MOVED":
      return judgeConfirmed ? "update_link" : "flag_needs_review";
    case "CLOSED":
    case "EXPIRED":
      return judgeConfirmed ? "propose_deactivate" : "flag_needs_review";
    case "DEAD":
      return judgeConfirmed ? "propose_deactivate" : "flag_needs_review";
    case "NEEDS_REVIEW":
      return "flag_needs_review";
  }
}
