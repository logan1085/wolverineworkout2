import { NextRequest, NextResponse } from "next/server";
import { healthIdentity, equal } from "@/lib/health/server";
import {
  admin,
  exchange,
  ownerAllowed,
  stravaConfigured,
  seal,
  unseal,
} from "@/lib/health/strava";
export async function GET(request: NextRequest) {
  const back = new URL("/", process.env.APP_URL || request.nextUrl.origin);
  back.searchParams.set("tab", "Connections");
  try {
    if (!stravaConfigured()) throw new Error("Not configured");
    const identity = await healthIdentity(request);
    if (!identity || identity.local || !ownerAllowed(identity.id))
      throw new Error("Sign in required");
    const cookie = request.cookies.get("strava_oauth")?.value;
    if (!cookie) throw new Error("Missing state");
    const flow = unseal<{
      state: string;
      verifier: string;
      userId: string;
      expires: number;
    }>(cookie);
    const code = request.nextUrl.searchParams.get("code");
    if (
      !code ||
      flow.expires < Date.now() ||
      flow.userId !== identity.id ||
      !equal(flow.state, request.nextUrl.searchParams.get("state") || "")
    )
      throw new Error("Invalid OAuth state");
    const { data: existing, error: lookupError } = await admin()
      .from("strava_connections")
      .select("user_id")
      .eq("user_id", identity.id)
      .maybeSingle();
    if (lookupError || existing)
      throw new Error("Disconnect before reconnecting");
    const token = await exchange({
      grant_type: "authorization_code",
      code,
      code_verifier: flow.verifier,
      redirect_uri: new URL("/api/strava/callback", process.env.APP_URL!).href,
    });
    const { error } = await admin()
      .from("strava_connections")
      .insert({
        user_id: identity.id,
        tokens: seal(token),
        expires_at: new Date(
          Date.now() + token.expires_in * 1000,
        ).toISOString(),
        connected_at: new Date().toISOString(),
        last_query_at: null,
        lock_until: null,
      });
    if (error) throw new Error("Connection save failed");
    back.searchParams.set("strava", "connected");
  } catch {
    back.searchParams.set("strava", "failed");
  }
  const response = NextResponse.redirect(back);
  response.cookies.delete({ name: "strava_oauth", path: "/api/strava" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
