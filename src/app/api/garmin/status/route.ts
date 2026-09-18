import { NextRequest, NextResponse } from "next/server";
import { healthIdentity, noStore } from "@/lib/health/server";
import { admin, garminConfigured } from "@/lib/health/garmin";
export async function GET(request: NextRequest) {
  const configured = garminConfigured();
  const user = await healthIdentity(request);
  if (!configured || !user || user.local)
    return NextResponse.json(
      { configured, connected: false, lastSync: null },
      { headers: noStore },
    );
  const { data, error } = await admin()
    .from("garmin_connections")
    .select("connected_at,last_sync_at,permissions")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json(
    {
      configured,
      connected: !!data,
      lastSync: data?.last_sync_at ?? null,
      permissions: data?.permissions ?? [],
      ...(error ? { error: "Connection status is unavailable." } : {}),
    },
    { headers: noStore, status: error ? 503 : 200 },
  );
}
