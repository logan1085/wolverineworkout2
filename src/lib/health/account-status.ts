// Check authentication reachability only. This does not certify migrations,
// permissions, stored records, or the validity of any user's session.
export type AccountStatus = "ready" | "unavailable" | "not_configured";
export async function checkAccountStatus(url?: string, key?: string, fetcher: typeof fetch = fetch): Promise<AccountStatus> {
  if (!url || !key) return "not_configured";
  try {
    const endpoint = new URL("/auth/v1/settings", url);
    const response = await fetcher(endpoint, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) return "unavailable";
    const settings = await response.json();
    return settings && typeof settings === "object" && !Array.isArray(settings) ? "ready" : "unavailable";
  } catch { return "unavailable"; }
}
let cached: { status: AccountStatus; expires: number } | undefined;
let pending: Promise<AccountStatus> | undefined;
export async function accountStatus() {
  if (cached && cached.expires > Date.now()) return cached.status;
  if (!pending) pending = checkAccountStatus(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    .then(status => { cached = {status, expires: Date.now()+15000}; return status; })
    .finally(() => { pending = undefined; });
  return pending;
}
