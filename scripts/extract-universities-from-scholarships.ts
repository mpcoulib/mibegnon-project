/**
 * U1 — Extract university candidates from active scholarships (Anthropic).
 * Writes data/universities-to-research.json (NEW universities only).
 *
 * Usage:
 *   npx tsx scripts/extract-universities-from-scholarships.ts
 *   npx tsx scripts/extract-universities-from-scholarships.ts --dry-run --limit 20
 */
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { parseCliArgs, sleep } from "../lib/universities/cli";
import { namesMatch, normalizeUniversityName } from "../lib/universities/normalize";
import { PATHS } from "../lib/universities/paths";
import type {
  UniversitiesToResearchFile,
  UniversityCandidate,
} from "../lib/universities/types";

dotenv.config();

const AI_MODEL = "claude-haiku-4-5-20251001";
const DELAY_MS = 200;

const EXTRACT_INSTRUCTIONS = `Tu analyses des bourses d'études pour une plateforme ivoirienne (Mibegnon).
Extrais UNIQUEMENT les universités ou établissements d'enseignement supérieur concrets où l'étudiant peut étudier.

Règles:
- Inclus plusieurs universités si la bourse couvre plusieurs partenaires (ex. Mastercard Scholars).
- IGNORE les bourses génériques sans établissement nommé (ex. "bourse du gouvernement canadien", "toute université au UK", pays seul).
- IGNORE les organisations (DAAD, Campus France, Banque mondiale) sauf si c'est clairement l'université hôte.
- country = pays de l'établissement (pas le pays du demandeur).
- universityName = nom officiel en anglais ou français tel qu'affiché sur le site de l'université.`;

interface ExtractedRow {
  universityName: string;
  country: string;
}

interface ExtractResult {
  universities: ExtractedRow[];
  skippedReason: string | null;
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_universities",
  description:
    "List concrete host universities for this scholarship, or skip if none are named.",
  input_schema: {
    type: "object" as const,
    required: ["universities"],
    properties: {
      universities: {
        type: "array",
        description: "Named host universities. Empty if none identified.",
        items: {
          type: "object",
          required: ["universityName", "country"],
          properties: {
            universityName: { type: "string" },
            country: { type: "string" },
          },
        },
      },
      skippedReason: {
        type: "string",
        description:
          "If universities is empty, brief reason: generic, country-only, provider-only, etc.",
      },
    },
  },
};

async function extractFromScholarship(
  client: Anthropic,
  scholarship: {
    name: string;
    provider: string;
    country: string;
    description: string;
  },
): Promise<ExtractResult> {
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "extract_universities" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: EXTRACT_INSTRUCTIONS,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: [
              `NAME: ${scholarship.name}`,
              `PROVIDER: ${scholarship.provider}`,
              `COUNTRY (scholarship): ${scholarship.country}`,
              `DESCRIPTION:\n${scholarship.description.slice(0, 4000)}`,
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { universities: [], skippedReason: "no_tool_output" };
  }

  const raw = toolUse.input as ExtractResult;
  return {
    universities: raw.universities ?? [],
    skippedReason: raw.skippedReason ?? null,
  };
}

function mergeCandidates(
  map: Map<string, UniversityCandidate>,
  rows: ExtractedRow[],
  scholarshipName: string,
) {
  for (const row of rows) {
    const name = row.universityName?.trim();
    const country = row.country?.trim();
    if (!name || !country) continue;

    const key = normalizeUniversityName(name);
    if (!key) continue;

    const existing = [...map.values()].find((c) => namesMatch(c.universityName, name));
    if (existing) {
      if (!existing.sourceScholarships.includes(scholarshipName)) {
        existing.sourceScholarships.push(scholarshipName);
      }
      continue;
    }

    map.set(key, {
      universityName: name,
      country,
      sourceScholarships: [scholarshipName],
    });
  }
}

async function main() {
  const { dryRun, limit } = parseCliArgs(process.argv);

  console.log("=== U1: Extract universities from scholarships ===\n");
  if (dryRun) console.log("DRY RUN — no file written.\n");

  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  const client = new Anthropic();

  try {
    const scholarships = await prisma.scholarship.findMany({
      where: { isActive: true },
      select: { name: true, provider: true, country: true, description: true },
      orderBy: { name: "asc" },
      ...(limit != null ? { take: limit } : {}),
    });

    const existingUnis = await prisma.university.findMany({
      select: { name: true },
    });

    const candidateMap = new Map<string, UniversityCandidate>();
    let rawExtractions = 0;
    let skipped = 0;

    for (const s of scholarships) {
      try {
        const result = await extractFromScholarship(client, s);
        if (result.universities.length === 0) {
          skipped++;
          process.stdout.write(`  — ${s.name.slice(0, 55)} (${result.skippedReason ?? "empty"})\n`);
        } else {
          rawExtractions += result.universities.length;
          mergeCandidates(candidateMap, result.universities, s.name);
          process.stdout.write(
            `  ✓ ${s.name.slice(0, 45)} → ${result.universities.length} uni(s)\n`,
          );
        }
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`  ✗ ${s.name}: ${(err as Error).message}`);
      }
    }

    const allCandidates = [...candidateMap.values()];
    const newCandidates = allCandidates.filter(
      (c) => !existingUnis.some((u) => namesMatch(u.name, c.universityName)),
    );
    const alreadyInDb = allCandidates.length - newCandidates.length;

    const payload: UniversitiesToResearchFile = {
      generatedAt: new Date().toISOString(),
      stats: {
        scholarshipsScanned: scholarships.length,
        rawExtractions,
        uniqueCandidates: allCandidates.length,
        alreadyInDb,
        newToResearch: newCandidates.length,
      },
      universities: newCandidates,
    };

    console.log("\n" + "─".repeat(40));
    console.log(`  Scholarships scanned:  ${payload.stats.scholarshipsScanned}`);
    console.log(`  Raw extractions:       ${payload.stats.rawExtractions}`);
    console.log(`  Unique candidates:     ${payload.stats.uniqueCandidates}`);
    console.log(`  Already in DB:         ${payload.stats.alreadyInDb}`);
    console.log(`  NEW to research:       ${payload.stats.newToResearch}`);
    console.log(`  Skipped scholarships:  ${skipped}`);

    if (!dryRun) {
      fs.mkdirSync(PATHS.toResearch.replace(/\/[^/]+$/, ""), { recursive: true });
      fs.writeFileSync(PATHS.toResearch, JSON.stringify(payload, null, 2));
      console.log(`\nWrote ${PATHS.toResearch}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
