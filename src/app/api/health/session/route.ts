import { NextRequest, NextResponse } from "next/server";
import { localRequest, noStore } from "@/lib/health/server";
import { accountStatus } from "@/lib/health/account-status";
export async function GET(request: NextRequest) {
  const local =
    localRequest(request) &&
    request.headers.get("sec-fetch-site") === "same-origin";
  const authStatus = await accountStatus();
  const response = NextResponse.json(
    {
      local,
      ai: !!process.env.OPENAI_API_KEY,
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
