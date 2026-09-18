import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  apiError,
  boundedJson,
  healthIdentity,
  noStore,
  sameOrigin,
} from "@/lib/health/server";
import { emptyMemory, validateSnapshot } from "@/lib/health/memory-model";
export async function GET(request: NextRequest) {
  const identity = await healthIdentity(request);
  if (!identity || identity.local)
    return apiError("Sign in to load account memory.", 401);
  const db = await createClient();
  const { data, error } = await db
    .from("health_memory")
    .select("state,revision")
    .eq("user_id", identity.id)
    .maybeSingle();
  if (error)
    return apiError(
      "Account memory is not configured yet. Your conversation can continue without saving.",
      503,
    );
  try {
    return NextResponse.json(
      data ? validateSnapshot(data) : { state: emptyMemory(), revision: 0 },
      { headers: noStore },
    );
  } catch {
    return apiError(
      "Saved memory could not be read. It has not been overwritten.",
      503,
    );
  }
}
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return apiError("Request origin is not allowed.", 403);
  const identity = await healthIdentity(request);
  if (!identity || identity.local)
    return apiError("Sign in to save account memory.", 401);
  let snapshot;
  try {
    snapshot = validateSnapshot(await boundedJson(request, 650000));
  } catch {
    return apiError("Memory is invalid or exceeds the storage limit.");
  }
  const db = await createClient();
  const { data, error } = await db.rpc("save_health_memory", {
    new_state: snapshot.state,
    expected_revision: snapshot.revision,
  });
  if (error)
    return apiError("Memory could not be saved. Please try again.", 503);
  if (!data)
    return apiError(
      "Memory changed in another session. Reload it before saving.",
      409,
    );
  return NextResponse.json(
    { state: snapshot.state, revision: data },
    { headers: noStore },
  );
}
