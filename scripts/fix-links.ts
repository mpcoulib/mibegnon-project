/**
 * scripts/fix-links.ts
 *
 * Visits each scholarshipregion.com link, extracts the real official application
 * URL from the page, and updates the DB. If no valid link is found, sets link to "".
 * Also clears out placeholder/broken links (example.com, gmail.com, etc.).
 *
 *   npx tsx scripts/fix-links.ts
 *   npx tsx scripts/fix-links.ts --limit 20
 *   npx tsx scripts/fix-links.ts --dry-run
 */

import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(args[limitArg + 1]) : null;
const DELAY_MS = 800;

// Domains that are aggregators or clearly not official apply links
const EXCLUDED_DOMAINS = [
  "scholarshipregion.com", "scholarsregion.com", "scholarshipregion.org",
  "scholars.region", "scholarshipportal.com", "scholarshipupdate.com",
  "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
  "youtube.com", "pinterest.com", "whatsapp.com", "t.me", "telegram.org",
  "google.com", "google.co", "googleapis.com", "goo.gl",
  "amazon.com", "wordpress.com", "blogspot.com",
  "addtoany.com", "sharethis.com",
];

// Links that are clearly broken/placeholder — just clear them
const BROKEN_DOMAINS = [
  "example.com", "gmail.com", "unknown.com", "apply-link.com",
  "click-here-to-apply-link.com", "scholar.com",
];

function isExcluded(hostname: string): boolean {
  if (EXCLUDED_DOMAINS.some((d) => hostname.includes(d))) return true;
  // Exclude job-board subdomains — they're never scholarship apply links
  if (hostname.startsWith("jobs.")) return true;
  return false;
}

function isBroken(url: string): boolean {
  if (!url.startsWith("http")) return true; // not a URL at all
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return BROKEN_DOMAINS.some((d) => hostname.includes(d));
  } catch {
    return true;
  }
}

function extractOfficialLink(html: string): string | null {
  const $ = cheerio.load(html);

  // Strip sidebars, nav, footer, related posts — they cause false positives
  $("nav, header, footer, aside, .sidebar, .widget, .related, .related-posts, " +
    ".navigation, .post-navigation, .wp-block-query, .jp-relatedposts, " +
    "#comments, .comments, .comment-respond").remove();

  // Collect apply-keyword links first (highest confidence — anywhere on page)
  const applyKeywords = [
    "apply now", "apply here", "apply online",
    "official website", "official link", "official page",
    "click here to apply", "submit application", "application portal",
  ];

  const collectLinks = (selector: string) => {
    const results: { url: string; text: string }[] = [];
    $(selector).each((_, el) => {
      const url = $(el).attr("href") ?? "";
      const text = $(el).text().trim().toLowerCase();
      if (!url.startsWith("http")) return;
      try {
        const hostname = new URL(url).hostname.replace("www.", "");
        if (!isExcluded(hostname) && !isBroken(url)) {
          results.push({ url, text });
        }
      } catch { /* invalid URL */ }
    });
    return results;
  };

  // Pass 1: links with apply/official text — check full page
  const allLinks = collectLinks("a");
  const byText = allLinks.find((a) =>
    applyKeywords.some((k) => a.text.includes(k))
  );
  if (byText) return byText.url;

  // Pass 2: only look inside main article body from here on
  const articleLinks = collectLinks(
    "article a, .entry-content a, .post-content a, .post-body a, .article-content a"
  );
  if (articleLinks.length === 0) return null;

  // Pass 3: URL contains apply/scholarship/admission keywords
  const byUrl = articleLinks.find((a) =>
    /apply|admission|scholarship|fellowship|register|enroll/i.test(a.url)
  );
  if (byUrl) return byUrl.url;

  // Pass 4: first institutional domain (.edu, .ac.*, .gov, .org)
  const institutional = articleLinks.find((a) => {
    try {
      const hostname = new URL(a.url).hostname;
      return /\.(edu|gov|ac\.[a-z]{2,3})$/.test(hostname) ||
             hostname.includes(".edu.") ||
             hostname.includes(".ac.");
    } catch { return false; }
  });
  if (institutional) return institutional.url;

  // No confident match found — better to show "no link" than a wrong one
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Mibegnon-LinkFixer/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Mibegnon Link Fixer ===");
  if (DRY_RUN) console.log("DRY RUN — nothing will be written.\n");

  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    const scholarships = await prisma.scholarship.findMany({
      where: {
        OR: [
          { link: { contains: "scholarshipregion.com" } },
          { link: { contains: "scholarsregion.com" } },
          { link: { contains: "scholarshipportal.com" } },
          { link: { contains: "scholarshipupdate.com" } },
          { link: { contains: "example.com" } },
          { link: { contains: "gmail.com" } },
          { link: { contains: "unknown.com" } },
          { link: { contains: "click-here" } },
          { link: { contains: "lnkd.in" } },
          { link: { contains: "bit.ly" } },
          { link: { contains: "tinyurl.com" } },
          { link: { contains: "shorturl.at" } },
        ],
      },
      select: { id: true, name: true, link: true },
      take: LIMIT ?? undefined,
      orderBy: { createdAt: "asc" },
    });

    console.log(`\n${scholarships.length} scholarship(s) with redirect/broken links...\n`);

    let fixed = 0;
    let cleared = 0;
    let failed = 0;

    for (const s of scholarships) {
      // Broken/placeholder → clear immediately, no fetch needed
      if (isBroken(s.link)) {
        if (DRY_RUN) {
          console.log(`  [DRY/clear] ${s.name.slice(0, 65)}`);
        } else {
          await prisma.scholarship.update({ where: { id: s.id }, data: { link: "" } });
          cleared++;
          console.log(`  🗑  ${s.name.slice(0, 65)} — cleared (broken)`);
        }
        continue;
      }

      // Aggregator link → fetch and extract real link
      const html = await fetchPage(s.link);
      if (!html) {
        failed++;
        console.log(`  ✗ Fetch failed: ${s.name.slice(0, 60)}`);
        await sleep(DELAY_MS);
        continue;
      }

      const officialLink = extractOfficialLink(html);

      if (DRY_RUN) {
        console.log(`\n[DRY] ${s.name.slice(0, 65)}`);
        console.log(`  Found: ${officialLink ?? "— none found"}`);
      } else {
        await prisma.scholarship.update({
          where: { id: s.id },
          data: { link: officialLink ?? "" },
        });
        if (officialLink) {
          fixed++;
          console.log(`  ✓ ${s.name.slice(0, 60)}`);
          console.log(`    → ${officialLink}`);
        } else {
          cleared++;
          console.log(`  ⚡ ${s.name.slice(0, 60)} — no link found, cleared`);
        }
      }

      await sleep(DELAY_MS);
    }

    console.log(`\n${"─".repeat(45)}`);
    console.log(`  Fixed with real link:    ${fixed}`);
    console.log(`  Cleared (no link found): ${cleared}`);
    if (failed) console.log(`  Fetch failed:            ${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
