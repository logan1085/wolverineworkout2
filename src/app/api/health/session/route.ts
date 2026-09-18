import { NextRequest, NextResponse } from "next/server";
import { localRequest, noStore } from "@/lib/health/server";
export async function GET(request: NextRequest) {
  const local =
    localRequest(request) &&
    request.headers.get("sec-fetch-site") === "same-origin";
  const response = NextResponse.json(
    {
      local,
      ai: !!process.env.OPENAI_API_KEY,
      auth:
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
