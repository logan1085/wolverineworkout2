import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { createClient as supabaseAdmin } from "@supabase/supabase-js";
export const STRAVA_MCP = "https://mcp.strava.com/mcp";
const TOKEN = "https://www.strava.com/oauth/mcp/token";
export function stravaConfigured() {
  return (
    [
      "STRAVA_MCP_CLIENT_ID",
      "STRAVA_MCP_OWNER_ID",
      "STRAVA_MCP_READ_TOOLS",
      "STRAVA_TOKEN_ENCRYPTION_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "APP_URL",
    ].every((k) => !!process.env[k]) &&
    readTools().length > 0 &&
    /^[a-f0-9]{64}$/i.test(process.env.STRAVA_TOKEN_ENCRYPTION_KEY || "")
  );
}
export function admin() {
  if (!stravaConfigured()) throw new Error("Strava is not configured.");
  return supabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
export function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.STRAVA_TOKEN_ENCRYPTION_KEY!, "hex"),
    iv,
  );
  const body = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
export function unseal<T>(value: string): T {
  const bytes = Buffer.from(value, "base64url");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.STRAVA_TOKEN_ENCRYPTION_KEY!, "hex"),
    bytes.subarray(0, 12),
  );
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  );
}
export function readTools() {
  return (process.env.STRAVA_MCP_READ_TOOLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-zA-Z0-9_.-]{1,100}$/.test(s))
    .slice(0, 30);
}
export function ownerAllowed(id: string) {
  return (
    !!process.env.STRAVA_MCP_OWNER_ID && id === process.env.STRAVA_MCP_OWNER_ID
  );
}
export function authorization(userId: string) {
  const verifier = randomBytes(48).toString("base64url");
  const state = randomBytes(32).toString("base64url");
  const url = new URL("https://www.strava.com/oauth/mcp/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.STRAVA_MCP_CLIENT_ID!,
    redirect_uri: new URL("/api/strava/callback", process.env.APP_URL!).href,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    state,
    scope: "read activity:read",
    resource: STRAVA_MCP,
  }).toString();
  return {
    url: url.href,
    cookie: seal({ verifier, state, userId, expires: Date.now() + 600000 }),
  };
}
export type Tokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};
export async function exchange(
  values: Record<string, string>,
): Promise<Tokens> {
  const response = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...values,
      client_id: process.env.STRAVA_MCP_CLIENT_ID!,
      ...(process.env.STRAVA_MCP_CLIENT_SECRET
        ? { client_secret: process.env.STRAVA_MCP_CLIENT_SECRET }
        : {}),
      resource: STRAVA_MCP,
    }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      "Strava authorization failed. Check MCP access and reconnect.",
    );
  const data = await response.json();
  if (
    typeof data.access_token !== "string" ||
    !data.access_token ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0 ||
    data.expires_in > 31536000 ||
    (data.refresh_token !== undefined && typeof data.refresh_token !== "string")
  )
    throw new Error("Strava returned an invalid token response.");
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}
export type ConnectionRow = {
  user_id: string;
  tokens: string;
  expires_at: string;
};
// Caller must hold the connection lock across refresh and use.
export async function accessToken(row: ConnectionRow) {
  const saved = unseal<Tokens>(row.tokens);
  if (Date.parse(row.expires_at) > Date.now() + 300000)
    return saved.access_token;
  if (!saved.refresh_token)
    throw new Error("Strava access expired. Reconnect your account.");
  const refreshed = await exchange({
    grant_type: "refresh_token",
    refresh_token: saved.refresh_token,
  });
  const { error } = await admin()
    .from("strava_connections")
    .update({
      tokens: seal({
        ...refreshed,
        refresh_token: refreshed.refresh_token || saved.refresh_token,
      }),
      expires_at: new Date(
        Date.now() + refreshed.expires_in * 1000,
      ).toISOString(),
    })
    .eq("user_id", row.user_id);
  if (error) throw new Error("Could not save refreshed Strava access.");
  return refreshed.access_token;
}
export async function revoke(row: ConnectionRow) {
  const saved = unseal<Tokens>(row.tokens);
  const response = await fetch("https://www.strava.com/oauth/mcp/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: saved.refresh_token || saved.access_token,
      client_id: process.env.STRAVA_MCP_CLIENT_ID!,
      ...(process.env.STRAVA_MCP_CLIENT_SECRET
        ? { client_secret: process.env.STRAVA_MCP_CLIENT_SECRET }
        : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      "Strava could not revoke access. Retry or revoke it in Strava settings.",
    );
}
export async function lockConnection(userId: string) {
  const db = admin();
  const lock = new Date(Date.now() + 240000).toISOString();
  const { data, error } = await db
    .from("strava_connections")
    .update({ lock_until: lock })
    .eq("user_id", userId)
    .or(`lock_until.is.null,lock_until.lt.${new Date().toISOString()}`)
    .select("*")
    .maybeSingle();
  if (error) throw new Error("Strava connection storage is unavailable.");
  if (!data)
    throw new Error(
      "Connect Strava first, or wait for the current request to finish.",
    );
  return {
    row: data as ConnectionRow,
    release: async () => {
      await db
        .from("strava_connections")
        .update({ lock_until: null })
        .eq("user_id", userId)
        .eq("lock_until", lock);
    },
  };
}
