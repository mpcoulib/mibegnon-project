import { NextResponse } from "next/server";
import { getDonationStats } from "@/lib/donate/aggregate";

export async function GET() {
  try {
    const stats = await getDonationStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("[donations/stats]", err);
    return NextResponse.json(
      { error: "Statistiques indisponibles" },
      { status: 503 }
    );
  }
}
