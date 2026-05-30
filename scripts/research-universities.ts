/**
 * U2 — Web-research each candidate university (Anthropic web_search + structured output).
 * Reads data/universities-to-research.json → data/universities-researched.json
 *
 * Usage:
 *   npx tsx scripts/research-universities.ts
 *   npx tsx scripts/research-universities.ts --limit 5 --concurrency 2
 *   npx tsx scripts/research-universities.ts --offset 10 --limit 5
 */
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { parseCliArgs, mapPool, sleep } from "../lib/universities/cli";
import { logoUrlFromWebsite } from "../lib/universities/normalize";
import { PATHS } from "../lib/universities/paths";
import type {
  ResearchedUniversity,
  UniversitiesResearchedFile,
  UniversityCandidate,
} from "../lib/universities/types";

dotenv.config();

const RESEARCH_MODEL = "claude-haiku-4-5-20251001";
const DELAY_MS = 400;

const RESEARCH_INSTRUCTIONS = `Tu es un chercheur pour Mibegnon, une plateforme de bourses pour élèves ivoiriens.

Utilise la recherche web pour trouver des faits vérifiables sur l'université demandée.
Règles strictes:
- Ne invente aucun fait. Si une info est introuvable, laisse le champ vide ou null.
- website = URL officielle de l'université (domaine .edu, .ac.uk, etc. de préférence).
- ranking = entier QS World uniquement si tu trouves le classement officiel récent; sinon null.
- fields = 3 à 8 filières fortes en français (ex. "Médecine", "Informatique", "Droit") — mêmes libellés que sur Mibegnon.
- description = 3 à 5 phrases en français, ton accessible et factuel (comme une fiche étudiante), pas de marketing creux.
- sources = une entrée par fait important (website, city, ranking, fields) avec l'URL consultée.
- logoUrl = https://logo.clearbit.com/<domaine> si tu connais le site officiel, sinon null.`;

const RESEARCH_TOOL: Anthropic.Tool = {
  name: "university_profile",
  description: "Structured university profile from web research.",
  input_schema: {
    type: "object" as const,
    required: ["name", "country", "city", "website", "fields", "description", "sources"],
    properties: {
      name: { type: "string" },
      country: { type: "string" },
      city: { type: "string" },
      website: { type: "string", description: "Official homepage URL" },
      ranking: {
        type: ["integer", "null"],
        description: "QS World ranking integer, or null",
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Top fields in French",
      },
      description: { type: "string", description: "French profile, 3-5 sentences" },
      logoUrl: { type: ["string", "null"] },
      sources: {
        type: "array",
        items: {
          type: "object",
          required: ["field", "url"],
          properties: {
            field: { type: "string" },
            url: { type: "string" },
          },
        },
      },
    },
  },
};

function readInput(path: string): UniversityCandidate[] {
  const raw = JSON.parse(fs.readFileSync(path, "utf8")) as {
    universities: UniversityCandidate[];
  };
  return raw.universities ?? [];
}

function mergeResearched(
  existing: ResearchedUniversity[],
  incoming: ResearchedUniversity[],
): ResearchedUniversity[] {
  const byKey = new Map(
    existing.map((u) => [u.name.toLowerCase(), u]),
  );
  for (const u of incoming) {
    byKey.set(u.name.toLowerCase(), u);
  }
  return [...byKey.values()];
}

async function researchOne(
  client: Anthropic,
  candidate: UniversityCandidate,
): Promise<ResearchedUniversity | null> {
  const hint = candidate.sourceScholarships.length
    ? `\nMentionné dans: ${candidate.sourceScholarships.slice(0, 3).join("; ")}`
    : "";

  const response = await client.messages.create({
    model: RESEARCH_MODEL,
    max_tokens: 2048,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 5 },
      RESEARCH_TOOL,
    ],
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: RESEARCH_INSTRUCTIONS,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Université: ${candidate.universityName}\nPays (indice bourse): ${candidate.country}${hint}\n\nRenseigne le profil complet.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b) => b.type === "tool_use" && b.name === "university_profile",
  );
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const data = toolUse.input as Omit<ResearchedUniversity, "researchedAt"> & {
    ranking?: number | null;
  };

  const website = data.website?.trim() ?? "";
  const logoUrl =
    data.logoUrl?.trim() ||
    (website ? logoUrlFromWebsite(website) : null);

  return {
    name: data.name?.trim() || candidate.universityName,
    country: data.country?.trim() || candidate.country,
    city: data.city?.trim() ?? "",
    website,
    ranking: typeof data.ranking === "number" ? data.ranking : null,
    fields: (data.fields ?? []).filter(Boolean),
    description: data.description?.trim() ?? "",
    logoUrl: logoUrl || null,
    sources: data.sources ?? [],
    researchedAt: new Date().toISOString(),
  };
}

async function main() {
  const { dryRun, limit, offset, concurrency, input } = parseCliArgs(process.argv);
  const inputPath = input ?? PATHS.toResearch;

  if (!fs.existsSync(inputPath)) {
    console.error(`Missing input: ${inputPath}\nRun U1 first.`);
    process.exit(1);
  }

  let candidates = readInput(inputPath);
  if (offset > 0) candidates = candidates.slice(offset);
  if (limit != null) candidates = candidates.slice(0, limit);

  console.log("=== U2: Research universities ===\n");
  console.log(`Input: ${inputPath}`);
  console.log(`Batch: ${candidates.length} (offset ${offset}, concurrency ${concurrency})`);
  if (dryRun) console.log("DRY RUN — no file written.\n");

  const client = new Anthropic();
  let succeeded = 0;
  let failed = 0;

  const results = await mapPool(candidates, concurrency, async (c, i) => {
    try {
      const profile = await researchOne(client, c);
      if (!profile) {
        failed++;
        console.log(`  ✗ [${i + 1}] ${c.universityName} — no profile`);
        return null;
      }
      succeeded++;
      console.log(`  ✓ [${i + 1}] ${profile.name} — ${profile.city || "?"}, ${profile.country}`);
      await sleep(DELAY_MS);
      return profile;
    } catch (err) {
      failed++;
      console.error(`  ✗ [${i + 1}] ${c.universityName}: ${(err as Error).message}`);
      return null;
    }
  });

  const batch = results.filter((r): r is ResearchedUniversity => r != null);

  let merged = batch;
  if (!dryRun && fs.existsSync(PATHS.researched)) {
    const prev = JSON.parse(
      fs.readFileSync(PATHS.researched, "utf8"),
    ) as UniversitiesResearchedFile;
    merged = mergeResearched(prev.universities ?? [], batch);
  }

  const payload: UniversitiesResearchedFile = {
    generatedAt: new Date().toISOString(),
    stats: {
      requested: candidates.length,
      succeeded,
      failed,
    },
    universities: merged,
  };

  console.log("\n" + "─".repeat(40));
  console.log(`  Requested: ${payload.stats.requested}`);
  console.log(`  Succeeded: ${payload.stats.succeeded}`);
  console.log(`  Failed:    ${payload.stats.failed}`);
  console.log(`  Total in file: ${merged.length}`);

  if (!dryRun) {
    fs.mkdirSync(PATHS.researched.replace(/\/[^/]+$/, ""), { recursive: true });
    fs.writeFileSync(PATHS.researched, JSON.stringify(payload, null, 2));
    console.log(`\nWrote ${PATHS.researched}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
