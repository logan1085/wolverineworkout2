import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  apiError,
  boundedJson,
  healthIdentity,
  noStore,
  sameOrigin,
} from "@/lib/health/server";
import { emptyHealth, validateHealth } from "@/lib/health/model";
export async function GET(request: NextRequest) {
  const identity = await healthIdentity(request);
  if (!identity || identity.local)
    return apiError("Sign in to load cloud health history.", 401);
  const db = await createClient();
  const { data, error } = await db
    .from("health_profiles")
    .select("state")
    .eq("user_id", identity.id)
    .maybeSingle();
  if (error) return apiError("Health storage is not available yet.", 503);
  return NextResponse.json(
    { state: data?.state ?? emptyHealth },
    { headers: noStore },
  );
}
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  const identity = await healthIdentity(request);
  if (!identity || identity.local)
    return apiError("Sign in to save cloud health history.", 401);
  try {
    const state = validateHealth(await boundedJson(request));
    const db = await createClient();
    // Merge under the same row lock used by Garmin imports.
    const { data: saved, error } = await db.rpc("save_manual_health", {
      new_state: state,
    });
    if (error) return apiError("Your changes could not be saved.", 503);
    return NextResponse.json({ state: saved }, { headers: noStore });
  } catch {
    return apiError("Health data is invalid or too large.");
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  const identity = await healthIdentity(request);
  if (!identity || identity.local)
    return apiError("Sign in to delete cloud history.", 401);
  const db = await createClient();
  const { error } = await db
    .from("health_profiles")
    .delete()
    .eq("user_id", identity.id);
  if (error) return apiError("History could not be deleted.", 503);
  return NextResponse.json({ deleted: true }, { headers: noStore });
}
