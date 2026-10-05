import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  let result = "invalid";
  const code = params.get("code");
  // Fixed destination: never echo provider errors, codes, or a caller's `next` URL.
  if (!params.has("error") && code && code.length <= 4096 && params.getAll("code").length === 1) {
    try {
      const client = await createClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      result = !error && data.session && data.user ? "confirmed"
        : error && (!error.status || error.status >= 500) ? "unavailable" : "invalid";
    } catch {
      result = "unavailable";
    }
  }
  const destination = result === "confirmed" && params.get("flow") === "recovery"
    ? "/auth/reset-password" : `/auth/confirmed?result=${result}`;
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
