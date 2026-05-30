import { NextResponse } from "next/server";
import { verifyAndProcessWebhook } from "@/lib/donate/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const result = await verifyAndProcessWebhook(rawBody, signature);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ received: true });
}
