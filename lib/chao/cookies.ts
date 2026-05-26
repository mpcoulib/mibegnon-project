import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  ANON_IP_HOURLY_LIMIT,
  COOKIE_ANON,
  COOKIE_IP,
  COOKIE_MAX_AGE,
} from "@/lib/chao/constants";

function getSecret(): string {
  const secret = process.env.CHAO_COOKIE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("CHAO_COOKIE_SECRET is required in production");
  }
  return "mibegnon-chao-dev-secret";
}

function sign(payload: string): string {
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verify(signed: string): string | null {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = signed.slice(0, dot);
  const expected = sign(payload);
  try {
    const a = Buffer.from(signed);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return payload;
}

export async function getAnonMessageCount(): Promise<number> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_ANON)?.value;
  if (!raw) return 0;
  const payload = verify(raw);
  if (!payload) return 0;
  const n = parseInt(payload, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function setAnonMessageCount(count: number): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_ANON, sign(String(count)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export interface IpRateState {
  count: number;
  windowStart: number;
}

export async function getIpRateState(): Promise<IpRateState> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_IP)?.value;
  if (!raw) return { count: 0, windowStart: Date.now() };
  const payload = verify(raw);
  if (!payload) return { count: 0, windowStart: Date.now() };
  const [countStr, startStr] = payload.split(":");
  const count = parseInt(countStr ?? "0", 10);
  const windowStart = parseInt(startStr ?? "0", 10);
  if (!Number.isFinite(count) || !Number.isFinite(windowStart)) {
    return { count: 0, windowStart: Date.now() };
  }
  return { count, windowStart };
}

export async function setIpRateState(state: IpRateState): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_IP, sign(`${state.count}:${state.windowStart}`), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

const HOUR_MS = 60 * 60 * 1000;

export async function bumpIpRate(): Promise<number> {
  const now = Date.now();
  let { count, windowStart } = await getIpRateState();
  if (now - windowStart > HOUR_MS) {
    count = 0;
    windowStart = now;
  }
  count += 1;
  await setIpRateState({ count, windowStart });
  return count;
}

export function isIpRateExceeded(count: number, windowStart: number): boolean {
  if (Date.now() - windowStart > HOUR_MS) return false;
  return count >= ANON_IP_HOURLY_LIMIT;
}
