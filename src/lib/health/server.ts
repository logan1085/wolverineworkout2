import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";
export const noStore = { "Cache-Control": "no-store, private" };
export function localEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.HEALTH_LOCAL_PREVIEW === "1" &&
    !!process.env.HEALTH_LOCAL_TOKEN
  );
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = localEnabled()
    ? `http://${process.env.HEALTH_LOCAL_HOST}`
    : process.env.APP_URL || request.nextUrl.origin;
  return (
    (!origin || origin === expected) &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
export function localRequest(request: NextRequest) {
  return (
    localEnabled() &&
    request.headers.get("host") === process.env.HEALTH_LOCAL_HOST &&
    sameOrigin(request)
  );
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function healthIdentity(request: NextRequest) {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const user = await getAuthenticatedUser();
      if (user) return { id: user.id, local: false };
    } catch {
      /* A missing cloud session cannot grant cloud access. */
    }
  }
  if (
    localRequest(request) &&
    equal(
      request.cookies.get("wolverine_local")?.value || "",
      process.env.HEALTH_LOCAL_TOKEN || "",
    )
  )
    return { id: "local", local: true };
  return null;
}
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}
export async function boundedJson(
  request: NextRequest,
  limit = 180000,
): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Request is too large.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
