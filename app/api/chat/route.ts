import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ANON_IP_HOURLY_LIMIT,
  ANON_MESSAGE_LIMIT,
  CHAO_MODEL,
  LOGGED_IN_HOURLY_LIMIT,
  MAX_OUTPUT_TOKENS,
} from "@/lib/chao/constants";
import {
  bumpIpRate,
  getAnonMessageCount,
  getIpRateState,
  setAnonMessageCount,
} from "@/lib/chao/cookies";
import { CHAO_SYSTEM_PROMPT } from "@/lib/chao/persona";
import { buildScholarshipsContext } from "@/lib/chao/scholarships-context";
import { sseLine } from "@/lib/chao/sse";
import { parseMessages } from "@/lib/chao/validate";
import { getClientIpFromRequest } from "@/lib/request-ip";
import { rateLimitChaoAnonIp } from "@/lib/rate-limit";

const HOUR_MS = 60 * 60 * 1000;

function gateResponse(remaining: number, reason?: string, status = 403) {
  return NextResponse.json(
    { gated: true, remaining, reason: reason ?? "signup" },
    { status }
  );
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Service temporairement indisponible." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json({ error: "Messages invalides." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const ipState = await getIpRateState();
  const ipExpired = Date.now() - ipState.windowStart > HOUR_MS;
  const ipCount = ipExpired ? 0 : ipState.count;
  const ipLimit = isLoggedIn ? LOGGED_IN_HOURLY_LIMIT : ANON_IP_HOURLY_LIMIT;

  if (!ipExpired && ipCount >= ipLimit) {
    return gateResponse(0, "rate");
  }

  let anonCount = 0;
  if (!isLoggedIn) {
    const ip = getClientIpFromRequest(request);
    const ipDaily = await rateLimitChaoAnonIp(ip);
    if (!ipDaily.success) {
      return gateResponse(0, "rate", 429);
    }

    anonCount = await getAnonMessageCount();
    if (anonCount >= ANON_MESSAGE_LIMIT) {
      return gateResponse(0, "signup");
    }
  }

  const scholarshipsBlock = await buildScholarshipsContext();

  if (!isLoggedIn) {
    await setAnonMessageCount(anonCount + 1);
  }
  await bumpIpRate();

  const remaining = isLoggedIn
    ? null
    : Math.max(0, ANON_MESSAGE_LIMIT - (anonCount + 1));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = anthropic.messages.stream({
    model: CHAO_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text",
        text: CHAO_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: scholarshipsBlock,
      },
    ],
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            sseLine({
              type: "meta",
              remaining,
              isLoggedIn,
            })
          )
        );

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                sseLine({ type: "delta", text: event.delta.text })
              )
            );
          }
        }

        controller.enqueue(encoder.encode(sseLine({ type: "done" })));
      } catch (err) {
        console.error("[chao/chat]", err);
        controller.enqueue(
          encoder.encode(
            sseLine({
              type: "error",
              message: "Chao a un petit souci technique. Réessaie dans un instant.",
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
