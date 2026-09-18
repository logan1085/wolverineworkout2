import { NextRequest, NextResponse } from "next/server";
import {
  healthIdentity,
  apiError,
  noStore,
  sameOrigin,
} from "@/lib/health/server";
import {
  accessToken,
  admin,
  garminConfigured,
  garminFetch,
} from "@/lib/health/garmin";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  const user = await healthIdentity(request);
  if (!user || user.local)
    return apiError("Sign in to disconnect Garmin.", 401);
  if (!garminConfigured()) return apiError("Garmin is not configured.", 503);
  const db = admin();
  const lock = new Date(Date.now() + 180000).toISOString();
  const { data: row, error } = await db
    .from("garmin_connections")
    .update({ lock_until: lock })
    .eq("user_id", user.id)
    .or(`lock_until.is.null,lock_until.lt.${new Date().toISOString()}`)
    .select("*")
    .maybeSingle();
  if (error) return apiError("Could not read your connection.", 503);
  if (!row)
    return apiError("No connection found, or a sync is in progress.", 409);
  try {
    await garminFetch("/user/registration", await accessToken(row), "DELETE");
    const { error: removeError } = await db
      .from("garmin_connections")
      .delete()
      .eq("user_id", user.id);
    if (removeError) throw new Error("Disconnect cleanup failed.");
    return NextResponse.json({ disconnected: true }, { headers: noStore });
  } catch {
    return apiError(
      "Could not revoke Garmin access. Retry, or revoke Wolverine in Garmin Connect account settings.",
      502,
    );
  } finally {
    await db
      .from("garmin_connections")
      .update({ lock_until: null })
      .eq("user_id", user.id)
      .eq("lock_until", lock);
  }
}
