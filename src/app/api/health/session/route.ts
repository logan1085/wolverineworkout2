import { aiStatus } from "@/lib/health/ai-status";
import { NextRequest, NextResponse } from "next/server";
import { localRequest, noStore } from "@/lib/health/server";
import { accountStatus } from "@/lib/health/account-status";
export async function GET(request: NextRequest) {
  const local =
    localRequest(request) &&
    request.headers.get("sec-fetch-site") === "same-origin";
  const [authStatus, providerStatus] = await Promise.all([accountStatus(),aiStatus()]);
  const response = NextResponse.json(
    {
      local,
      ai: providerStatus === "reachable" || providerStatus === "unverified",
      aiStatus: providerStatus,
      auth: authStatus === "ready",
      authStatus,
    },
    { headers: noStore },
  );
  if (local)
    response.cookies.set("wolverine_local", process.env.HEALTH_LOCAL_TOKEN!, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
      maxAge: 28800,
    });
  return response;
}
