import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";
import { runScholarshipMaintenance } from "@/lib/scholarships/expire";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const JOB = "expire-scholarships";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const result = await runScholarshipMaintenance(startedAt);

    revalidateTag("scholarships", "max");

    await prisma.cronRun.create({
      data: {
        job: JOB,
        deactivated: result.deactivated,
        purged: result.purged,
        skipped: result.skipped,
      },
    });

    return NextResponse.json({
      ok: true,
      job: JOB,
      ranAt: startedAt.toISOString(),
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[cron/${JOB}]`, err);

    await prisma.cronRun
      .create({
        data: {
          job: JOB,
          errors: message,
        },
      })
      .catch((logErr) => console.error(`[cron/${JOB}] failed to log run`, logErr));

    return NextResponse.json({ error: "Job failed", job: JOB }, { status: 500 });
  }
}
