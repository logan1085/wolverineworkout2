import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  healthIdentity,
  noStore,
  sameOrigin,
} from "@/lib/health/server";
import {
  admin,
  lockConnection,
  ownerAllowed,
  revoke,
  stravaConfigured,
} from "@/lib/health/strava";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  const user = await healthIdentity(request);
  if (!user || user.local || !ownerAllowed(user.id))
    return apiError("Sign in with the configured personal account.", 401);
  if (!stravaConfigured()) return apiError("Strava is not configured.", 503);
  let connection: Awaited<ReturnType<typeof lockConnection>>;
  try {
    connection = await lockConnection(user.id);
  } catch {
    return apiError("No connection found, or a request is in progress.", 409);
  }
  try {
    await revoke(connection.row);
    const { error } = await admin()
      .from("strava_connections")
      .delete()
      .eq("user_id", user.id);
    if (error)
      return apiError(
        "Access was revoked, but local connection cleanup failed. Retry disconnect.",
        503,
      );
    return NextResponse.json(
      {
        disconnected: true,
        message:
          "Strava access revoked and Wolverine connection data deleted. No Strava activity history or answers were saved by Wolverine.",
      },
      { headers: noStore },
    );
  } catch {
    return apiError(
      "Could not revoke Strava access. Retry or revoke access in Strava settings.",
      502,
    );
  } finally {
    await connection.release();
  }
}
