import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
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
  normalizeGarmin,
} from "@/lib/health/garmin";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  const user = await healthIdentity(request);
  if (!user || user.local) return apiError("Sign in to sync Garmin.", 401);
  if (!garminConfigured()) return apiError("Garmin is not configured.", 503);
  const db = admin();
  const now = new Date();
  const lock = new Date(Date.now() + 180000).toISOString();
  const { data: row, error } = await db
    .from("garmin_connections")
    .update({ lock_until: lock })
    .eq("user_id", user.id)
    .or(`lock_until.is.null,lock_until.lt.${now.toISOString()}`)
    .select("*")
    .maybeSingle();
  if (error) return apiError("Garmin storage is unavailable.", 503);
  if (!row)
    return apiError(
      "Connect Garmin first, or wait for your current sync to finish.",
      409,
    );
  try {
    if (row.last_sync_at && Date.now() - Date.parse(row.last_sync_at) < 60000)
      return apiError("Your data was just synced. Try again in a minute.", 429);
    const token = await accessToken(row);
    const end = Math.floor(Date.now() / 1000);
    const start = row.last_sync_at
      ? Math.max(
          end - 86400,
          Math.floor(Date.parse(row.last_sync_at) / 1000) - 300,
        )
      : end - 86400;
    const query = `?uploadStartTimeInSeconds=${start}&uploadEndTimeInSeconds=${end}`;
    const permissions = await garminFetch("/user/permissions", token);
    if (!Array.isArray(permissions))
      throw new Error("Garmin returned an unsupported permissions response.");
    const health = permissions.includes("HEALTH_EXPORT");
    const activity = permissions.includes("ACTIVITY_EXPORT");
    if (!health && !activity)
      return apiError(
        "Allow Health or Activity access in Garmin, then reconnect.",
        403,
      );
    const [dailies, sleeps, activities] = await Promise.all([
      health ? garminFetch("/dailies" + query, token) : [],
      health ? garminFetch("/sleeps" + query, token) : [],
      activity ? garminFetch("/activities" + query, token) : [],
    ]);
    const normalized = normalizeGarmin(dailies, sleeps, activities);
    const client = await createClient();
    // Merge at the database under a row lock so check-ins and concurrent imports are not lost.
    const { error: saveError } = await client.rpc("merge_garmin_health", {
      new_metrics: normalized.metrics,
      new_activities: normalized.activities,
    });
    if (saveError) throw new Error("The synced data could not be saved.");
    const { error: updateError } = await db
      .from("garmin_connections")
      .update({ last_sync_at: new Date(end * 1000).toISOString(), permissions })
      .eq("user_id", user.id);
    if (updateError) throw new Error("Could not save sync status.");
    return NextResponse.json(
      {
        metrics: normalized.metrics.length,
        activities: normalized.activities.length,
        lastSync: new Date(end * 1000).toISOString(),
      },
      { headers: noStore },
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Garmin sync failed.",
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
