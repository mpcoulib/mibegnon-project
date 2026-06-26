import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/actions/user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ids: [] });
  }

  const saved = await prisma.savedScholarship.findMany({
    where: { userId: user.id },
    select: { scholarshipId: true },
  });

  return NextResponse.json(
    { ids: saved.map((s) => s.scholarshipId) },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
