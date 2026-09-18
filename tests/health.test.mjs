import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";
import path from "node:path";
function load(relative) {
  const filename = path.resolve(relative);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", source)(
    require,
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}
const { emptyHealth, validateHealth, dailyBriefing } = load(
  "src/lib/health/model.ts",
);
const { normalizeGarmin, seal, unseal, authorization } = load(
  "src/lib/health/garmin.ts",
);
const base = () => structuredClone(emptyHealth);
test("missing measurements remain unknown and never create recovery claims", () => {
  const guide = dailyBriefing(base(), "2026-09-18");
  assert.equal(guide.label, "Your first step");
  assert.deepEqual(guide.reasons, []);
});
test("low energy selects lighter movement rather than pushing intensity", () => {
  const s = base();
  s.checkIns = [
    {
      id: "a",
      date: "2026-09-18",
      energy: 1,
      stress: 2,
      soreness: 1,
      sleepHours: 8,
      note: "",
    },
  ];
  assert.equal(dailyBriefing(s, "2026-09-18").label, "Keep it easy");
  assert.equal(dailyBriefing(s, "2026-09-19").label, "Your first step");
});
test("rejects corrupted backups and impossible values", () => {
  for (const v of [
    null,
    {},
    { ...base(), profile: { name: "", goal: "x", minutes: NaN } },
    {
      ...base(),
      checkIns: [
        {
          id: "a",
          date: "2026-02-31",
          energy: 3,
          stress: 3,
          soreness: 3,
          sleepHours: 7,
          note: "",
        },
      ],
    },
    {
      ...base(),
      metrics: [
        { date: "2026-09-18", restingHeartRate: 900, source: "garmin" },
      ],
    },
  ])
    assert.throws(() => validateHealth(v));
});
test("strips unsupported fields and retains explicit zero measurements", () => {
  const s = {
    ...base(),
    injected: "ignore me",
    metrics: [
      { date: "2026-09-18", steps: 0, source: "garmin", token: "never save" },
    ],
  };
  const clean = validateHealth(s);
  assert.equal(clean.metrics[0].steps, 0);
  assert.equal(clean.injected, undefined);
  assert.equal(clean.metrics[0].token, undefined);
});
test("Garmin normalization merges sleep and daily records and handles offsets", () => {
  const data = normalizeGarmin(
    [
      {
        calendarDate: "2026-09-18",
        steps: 0,
        restingHeartRateInBeatsPerMinute: 52,
      },
    ],
    [{ calendarDate: "2026-09-18", durationInSeconds: 27000 }],
    [
      {
        summaryId: "run1",
        startTimeInSeconds: Date.parse("2026-09-18T01:00:00Z") / 1000,
        startTimeOffsetInSeconds: -14400,
        durationInSeconds: 2400,
        distanceInMeters: 5000,
        activityType: "RUNNING",
      },
    ],
  );
  assert.equal(data.metrics.length, 1);
  assert.equal(data.metrics[0].sleepHours, 7.5);
  assert.equal(data.metrics[0].steps, 0);
  assert.equal(data.activities[0].date, "2026-09-17");
  assert.equal(data.activities[0].distanceKm, 5);
});
test("invalid Garmin payloads do not become apparently valid zero data", () => {
  assert.throws(() => normalizeGarmin({}, [], []));
  const d = normalizeGarmin(
    [{ calendarDate: "2026-09-18", steps: -2 }],
    [],
    [{ summaryId: "bad", durationInSeconds: -1 }],
  );
  assert.equal(d.metrics[0].steps, undefined);
  assert.deepEqual(d.activities, []);
});
test("encrypted tokens round-trip and tampering is rejected", () => {
  process.env.GARMIN_TOKEN_ENCRYPTION_KEY = "10".repeat(32);
  const value = seal({ access_token: "synthetic-test-token" });
  assert.ok(!value.includes("synthetic"));
  assert.deepEqual(unseal(value), { access_token: "synthetic-test-token" });
  const damaged = Buffer.from(value, "base64url");
  damaged[29] ^= 1;
  assert.throws(() => unseal(damaged.toString("base64url")));
});
test("PKCE state binds the OAuth flow to the signed-in user and callback", () => {
  process.env.APP_URL = "https://example.test";
  process.env.GARMIN_CLIENT_ID = "test";
  const flow = authorization("user-1");
  const url = new URL(flow.url);
  const cookie = unseal(flow.cookie);
  assert.equal(url.origin, "https://connect.garmin.com");
  assert.equal(
    url.searchParams.get("redirect_uri"),
    "https://example.test/api/garmin/callback",
  );
  assert.equal(url.searchParams.get("state"), cookie.state);
  assert.equal(cookie.userId, "user-1");
  assert.ok(cookie.expires > Date.now());
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
});
