import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { buildContentSecurityPolicy } from "./lib/security/csp";

const isProd = process.env.NODE_ENV === "production";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: !isProd,
});

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(isProd),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

// Serwist is disabled outside prod (`disable: !isProd`) and injects a webpack
// config. Only wrap in prod so `next dev` (Turbopack) stays clean — no warning.
export default isProd ? withSerwist(nextConfig) : nextConfig;
