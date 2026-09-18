import { NextRequest, NextResponse } from "next/server";
import {
  healthIdentity,
  apiError,
  sameOrigin,
  noStore,
} from "@/lib/health/server";
import { authorization, garminConfigured } from "@/lib/health/garmin";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  if (!garminConfigured())
    return apiError(
      "Garmin sync needs an approved developer app before accounts can connect.",
      503,
    );
  const user = await healthIdentity(request);
  if (!user || user.local)
    return apiError("Sign in to connect Garmin securely.", 401);
  const flow = authorization(user.id);
  const response = NextResponse.json({ url: flow.url }, { headers: noStore });
  response.cookies.set("garmin_oauth", flow.cookie, {
    httpOnly: true,
    secure: new URL(process.env.APP_URL!).protocol === "https:",
    sameSite: "lax",
    path: "/api/garmin",
    maxAge: 600,
  });
  return response;
}
