import { prisma } from "@/lib/prisma";
import { MONTHLY_GOAL_CENTS } from "@/lib/donate/constants";

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export interface DonationStats {
  monthlyGoalCents: number;
  monthlyRaisedCents: number;
  monthlySupporterCount: number;
  totalSupporterCount: number;
  recentSupporters: {
    displayName: string;
    amountCents: number;
    kind: string;
    publicMessage: string | null;
    succeededAt: string;
  }[];
}

export async function getDonationStats(): Promise<DonationStats> {
  const monthStart = startOfMonth();

  const [monthlyAgg, totalCount, recent] = await Promise.all([
    prisma.donation.aggregate({
      where: {
        status: "SUCCEEDED",
        succeededAt: { gte: monthStart },
      },
      _sum: { amountCents: true },
      _count: { id: true },
    }),
    prisma.donation.count({
      where: { status: "SUCCEEDED" },
    }),
    prisma.donation.findMany({
      where: { status: "SUCCEEDED" },
      orderBy: { succeededAt: "desc" },
      take: 12,
      select: {
        displayName: true,
        amountCents: true,
        kind: true,
        publicMessage: true,
        succeededAt: true,
        isAnonymous: true,
      },
    }),
  ]);

  return {
    monthlyGoalCents: MONTHLY_GOAL_CENTS,
    monthlyRaisedCents: monthlyAgg._sum.amountCents ?? 0,
    monthlySupporterCount: monthlyAgg._count.id,
    totalSupporterCount: totalCount,
    recentSupporters: recent.map((d) => ({
      displayName: d.displayName ?? "Un ami de Mibegnon",
      amountCents: d.amountCents,
      kind: d.kind,
      publicMessage: d.isAnonymous ? null : d.publicMessage,
      succeededAt: (d.succeededAt ?? new Date()).toISOString(),
    })),
  };
}
