import { NextRequest, NextResponse } from "next/server";
import { healthIdentity, equal } from "@/lib/health/server";
import {
  admin,
  exchange,
  garminFetch,
  garminConfigured,
  seal,
  unseal,
} from "@/lib/health/garmin";
export async function GET(request: NextRequest) {
  const back = new URL("/", process.env.APP_URL || request.nextUrl.origin);
  back.searchParams.set("tab", "Connections");
  try {
    if (!garminConfigured()) throw new Error("Not configured");
    const identity = await healthIdentity(request);
    if (!identity || identity.local) throw new Error("Sign in required");
    const cookie = request.cookies.get("garmin_oauth")?.value;
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
    const token = await exchange({
      grant_type: "authorization_code",
      code,
      code_verifier: flow.verifier,
      redirect_uri: new URL("/api/garmin/callback", process.env.APP_URL!).href,
    });
    const garminUser = await garminFetch("/user/id", token.access_token);
    if (typeof garminUser?.userId !== "string")
      throw new Error("Invalid identity");
    const permissions = await garminFetch(
      "/user/permissions",
      token.access_token,
    );
    const { error } = await admin()
      .from("garmin_connections")
      .upsert({
        user_id: identity.id,
        garmin_user_id: garminUser.userId,
        tokens: seal(token),
        permissions,
        expires_at: new Date(
          Date.now() + token.expires_in * 1000,
        ).toISOString(),
        connected_at: new Date().toISOString(),
        last_sync_at: null,
        lock_until: null,
      });
    if (error) throw new Error("Connection save failed");
    back.searchParams.set("garmin", "connected");
  } catch {
    back.searchParams.set("garmin", "failed");
  }
  const response = NextResponse.redirect(back);
  response.cookies.delete({ name: "garmin_oauth", path: "/api/garmin" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
