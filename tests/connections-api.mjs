import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3018";
for (const provider of ["garmin", "strava"]) {
  const r = await fetch(`${origin}/api/${provider}/status`);
  assert.equal(r.status, 200);
  const status = await r.json();
  assert.equal(status.connected, false);
  assert.equal(status.tokens, undefined);
  const actions =
    provider === "garmin"
      ? ["connect", "sync", "disconnect"]
      : ["connect", "ask", "disconnect"];
  for (const action of actions) {
    const blocked = await fetch(`${origin}/api/${provider}/${action}`, {
      method: "POST",
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(blocked.status, 403);
    const anonymous = await fetch(`${origin}/api/${provider}/${action}`, {
      method: "POST",
      headers: { Origin: origin },
    });
    assert.ok(
      [401, 503].includes(anonymous.status),
      `${provider}/${action}: ${anonymous.status}`,
    );
  }
  const callback = await fetch(
    `${origin}/api/${provider}/callback?code=fake&state=fake`,
    { redirect: "manual" },
  );
  assert.equal(callback.status, 307);
  assert.equal(
    new URL(callback.headers.get("location")).searchParams.get(provider),
    "failed",
  );
}
const session = await fetch(`${origin}/api/health/session`, {
  headers: { Origin: origin, "sec-fetch-site": "same-origin" },
});
const cookie = session.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "Run this test against the local-health-preview server");
if (cookie) {
  const r = await fetch(`${origin}/api/strava/ask`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ consent: true, question: "Do not access anything" }),
  });
  assert.equal(r.status, 401);
}
console.log(
  "Connection HTTP guards passed: cross-origin, anonymous, local-only and invalid callback requests denied; status exposes no tokens.",
);
