import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { createClient as supabaseAdmin } from "@supabase/supabase-js";
import { Activity, DailyMetric } from "./model";
const BASE = "https://apis.garmin.com/wellness-api/rest";
const TOKEN = "https://connectapi.garmin.com/di-oauth2-service/oauth/token";
export function garminConfigured() {
  return (
    [
      "GARMIN_CLIENT_ID",
      "GARMIN_CLIENT_SECRET",
      "GARMIN_TOKEN_ENCRYPTION_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "APP_URL",
    ].every((k) => !!process.env[k]) &&
    /^[a-f0-9]{64}$/i.test(process.env.GARMIN_TOKEN_ENCRYPTION_KEY || "")
  );
}
export function admin() {
  if (!garminConfigured()) throw new Error("Garmin is not configured.");
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
    Buffer.from(process.env.GARMIN_TOKEN_ENCRYPTION_KEY!, "hex"),
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
    Buffer.from(process.env.GARMIN_TOKEN_ENCRYPTION_KEY!, "hex"),
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
export function authorization(userId: string) {
  const verifier = randomBytes(48).toString("base64url");
  const state = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirect = new URL("/api/garmin/callback", process.env.APP_URL!).href;
  const url = new URL("https://connect.garmin.com/oauth2Confirm");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GARMIN_CLIENT_ID!,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: redirect,
    state,
  }).toString();
  return {
    url: url.href,
    cookie: seal({ verifier, state, userId, expires: Date.now() + 600000 }),
  };
}
export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in?: number;
};
export async function exchange(
  values: Record<string, string>,
): Promise<Tokens> {
  const response = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...values,
      client_id: process.env.GARMIN_CLIENT_ID!,
      client_secret: process.env.GARMIN_CLIENT_SECRET!,
    }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("Garmin authorization could not be completed.");
  const data = await response.json();
  if (
    typeof data.access_token !== "string" ||
    typeof data.refresh_token !== "string" ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0
  )
    throw new Error("Garmin returned an invalid token.");
  return data;
}
export async function garminFetch(path: string, token: string, method = "GET") {
  const response = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Garmin access expired. Reconnect your account."
        : response.status === 403
          ? "Garmin has not granted access to this data type."
          : "Garmin could not complete the request. Please retry.",
    );
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
export async function accessToken(row: {
  user_id: string;
  tokens: string;
  expires_at: string;
}) {
  const saved = unseal<Tokens>(row.tokens);
  if (Date.parse(row.expires_at) > Date.now() + 600000)
    return saved.access_token;
  const refreshed = await exchange({
    grant_type: "refresh_token",
    refresh_token: saved.refresh_token,
  });
  const { error } = await admin()
    .from("garmin_connections")
    .update({
      tokens: seal(refreshed),
      expires_at: new Date(
        Date.now() + refreshed.expires_in * 1000,
      ).toISOString(),
    })
    .eq("user_id", row.user_id);
  if (error) throw new Error("Could not save refreshed Garmin access.");
  return refreshed.access_token;
}
export function normalizeGarmin(
  dailies: unknown,
  sleeps: unknown,
  activities: unknown,
) {
  if (
    !Array.isArray(dailies) ||
    !Array.isArray(sleeps) ||
    !Array.isArray(activities)
  )
    throw new Error("Garmin returned an unsupported data format.");
  const metrics = new Map<string, DailyMetric>();
  const number = (n: unknown, min: number, max: number) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max
      ? n
      : undefined;
  const date = (row: Record<string, unknown>) =>
    typeof row.calendarDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.calendarDate)
      ? row.calendarDate
      : undefined;
  for (const row of dailies) {
    if (!row || typeof row !== "object") continue;
    const d = date(row);
    if (!d) continue;
    metrics.set(d, {
      ...metrics.get(d),
      date: d,
      steps: number(row.steps, 0, 200000),
      restingHeartRate: number(row.restingHeartRateInBeatsPerMinute, 20, 250),
      source: "garmin",
    });
  }
  for (const row of sleeps) {
    if (!row || typeof row !== "object") continue;
    const d = date(row);
    const secs = number(row.durationInSeconds, 0, 86400);
    if (!d || secs === undefined) continue;
    metrics.set(d, {
      ...metrics.get(d),
      date: d,
      sleepHours: Math.round(secs / 360) / 10,
      source: "garmin",
    });
  }
  const normalized: Activity[] = [];
  for (const row of activities) {
    if (!row || typeof row !== "object") continue;
    const start = number(row.startTimeInSeconds, 0, 4102444800),
      duration = number(row.durationInSeconds, 60, 86400),
      offset = number(row.startTimeOffsetInSeconds, -50400, 50400) ?? 0;
    if (start === undefined || duration === undefined || !row.summaryId)
      continue;
    const distance = number(row.distanceInMeters, 0, 1000000);
    normalized.push({
      id: String(row.summaryId).slice(0, 100),
      date: new Date((start + offset) * 1000).toISOString().slice(0, 10),
      name: String(
        row.activityName || row.activityType || "Garmin activity",
      ).slice(0, 120),
      type: String(row.activityType || "Activity").slice(0, 60),
      minutes: Math.round(duration / 60),
      ...(distance === undefined
        ? {}
        : { distanceKm: Math.round(distance / 100) / 10 }),
      source: "garmin",
    });
  }
  return {
    metrics: [...metrics.values()].sort((a, b) => a.date.localeCompare(b.date)),
    activities: normalized,
  };
}
