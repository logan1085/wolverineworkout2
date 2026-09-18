import { NextRequest, NextResponse } from "next/server";
import {
  healthIdentity,
  apiError,
  sameOrigin,
  noStore,
} from "@/lib/health/server";
import {
  authorization,
  stravaConfigured,
  ownerAllowed,
} from "@/lib/health/strava";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  if (!stravaConfigured())
    return apiError(
      "Strava needs a registered MCP client, owner account, and read-only tool configuration.",
      503,
    );
  const user = await healthIdentity(request);
  if (!user || user.local || !ownerAllowed(user.id))
    return apiError("Sign in to connect Strava securely.", 401);
  const flow = authorization(user.id);
  const response = NextResponse.json({ url: flow.url }, { headers: noStore });
  response.cookies.set("strava_oauth", flow.cookie, {
    httpOnly: true,
    secure: new URL(process.env.APP_URL!).protocol === "https:",
    sameSite: "lax",
    path: "/api/strava",
    maxAge: 600,
  });
  return response;
}
