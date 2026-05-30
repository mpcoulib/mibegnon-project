/**
 * Content-Security-Policy for Mibegnon (Supabase, Turnstile, Stripe checkout).
 * Anthropic + Upstash are server-only and not listed here.
 */
export function buildContentSecurityPolicy(isProd: boolean): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseHosts = ["https://*.supabase.co", "wss://*.supabase.co"];
  if (supabaseUrl) {
    try {
      const origin = new URL(supabaseUrl).origin;
      supabaseHosts.push(origin, origin.replace("https://", "wss://"));
    } catch {
      /* keep wildcards */
    }
  }

  const connectSrc = [
    "'self'",
    ...supabaseHosts,
    "https://vitals.vercel-insights.com",
    "https://challenges.cloudflare.com",
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connectSrc,
    "frame-src": [
      "'self'",
      "https://challenges.cloudflare.com",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
    ],
  };

  let policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");

  if (isProd) {
    policy += "; upgrade-insecure-requests";
  }

  return policy;
}
