import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";
import { runCoachingPurge } from "@/lib/coaching/purge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const JOB = "purge-coaching";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const result = await runCoachingPurge(startedAt);

    const warnings: string[] = [];
    if (result.storageSkipped) warnings.push("SUPABASE_SERVICE_ROLE_KEY absente : objets Storage non supprimés");
    if (result.objectsFailed > 0) warnings.push(`${result.objectsFailed} objet(s) Storage non supprimé(s)`);

    await prisma.cronRun.create({
      data: {
        job: JOB,
        purged: result.leadsDeleted,
        deactivated: result.receiptsDeleted, // reçus purgés
        skipped: result.objectsFailed,
        errors: warnings.length ? warnings.join(" · ") : null,
      },
    });

    return NextResponse.json({ ok: true, job: JOB, ranAt: startedAt.toISOString(), ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[cron/${JOB}]`, err);

    await prisma.cronRun
      .create({ data: { job: JOB, errors: message } })
      .catch((logErr) => console.error(`[cron/${JOB}] failed to log run`, logErr));

    return NextResponse.json({ error: "Job failed", job: JOB }, { status: 500 });
  }
}
