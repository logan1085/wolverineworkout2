import { NextRequest, NextResponse } from "next/server";
import { healthIdentity, noStore } from "@/lib/health/server";
import { admin, stravaConfigured, ownerAllowed } from "@/lib/health/strava";
export async function GET(request: NextRequest) {
  const configured = stravaConfigured();
  const user = await healthIdentity(request);
  if (!configured || !user || user.local || !ownerAllowed(user.id))
    return NextResponse.json(
      {
        configured,
        eligible: !!user && !user.local && ownerAllowed(user.id),
        connected: false,
        lastQuery: null,
      },
      { headers: noStore },
    );
  const { data, error } = await admin()
    .from("strava_connections")
    .select("connected_at,last_query_at")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json(
    {
      configured,
      eligible: true,
      connected: !!data,
      lastQuery: data?.last_query_at ?? null,

      ...(error ? { error: "Connection status is unavailable." } : {}),
    },
    { headers: noStore, status: error ? 503 : 200 },
  );
}
