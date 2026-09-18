import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
const require = createRequire(import.meta.url);
const updates = [];
const db = {
  from(table) {
    assert.equal(table, "strava_connections");
    return {
      update(values) {
        updates.push(values);
        return { eq: async () => ({ error: null }) };
      },
    };
  },
};
const compiledModule = { exports: {} };
new Function(
  "require",
  "module",
  "exports",
  ts.transpileModule(readFileSync("src/lib/health/strava.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
)(
  (name) =>
    name === "@supabase/supabase-js"
      ? { createClient: () => db }
      : require(name),
  compiledModule,
  compiledModule.exports,
);
const s = compiledModule.exports;
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
  updates.length = 0;
});
function configure() {
  Object.assign(process.env, {
    STRAVA_MCP_CLIENT_ID: "test-client",
    STRAVA_MCP_OWNER_ID: "owner",
    STRAVA_MCP_READ_TOOLS: "list_activities, get_activity",
    STRAVA_TOKEN_ENCRYPTION_KEY: "20".repeat(32),
    NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon",
    SUPABASE_SERVICE_ROLE_KEY: "test-service",
    APP_URL: "https://wolverine.example",
  });
}
test("requires owner, encryption, auth and nonempty explicit tool allowlist", () => {
  configure();
  assert.equal(s.stravaConfigured(), true);
  assert.equal(s.ownerAllowed("owner"), true);
  assert.equal(s.ownerAllowed("other"), false);
  assert.deepEqual(s.readTools(), ["list_activities", "get_activity"]);
  process.env.STRAVA_MCP_READ_TOOLS = "*, https://untrusted.test";
  assert.equal(s.stravaConfigured(), false);
  configure();
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(s.stravaConfigured(), false);
});
test("OAuth PKCE uses only official MCP endpoints and binds owner, state and callback", () => {
  configure();
  const flow = s.authorization("owner"),
    payload = s.unseal(flow.cookie),
    url = new URL(flow.url);
  assert.equal(url.origin, "https://www.strava.com");
  assert.equal(url.pathname, "/oauth/mcp/authorize");
  assert.equal(
    url.searchParams.get("redirect_uri"),
    "https://wolverine.example/api/strava/callback",
  );
  assert.equal(url.searchParams.get("resource"), "https://mcp.strava.com/mcp");
  assert.equal(url.searchParams.get("state"), payload.state);
  assert.equal(payload.userId, "owner");
  assert.equal(
    url.searchParams.get("code_challenge"),
    createHash("sha256").update(payload.verifier).digest("base64url"),
  );
  assert.ok(
    payload.expires > Date.now() && payload.expires <= Date.now() + 600000,
  );
  assert.notEqual(s.authorization("owner").cookie, flow.cookie);
});
test("provider-specific encryption rejects wrong keys and tampering", () => {
  configure();
  const value = s.seal({ access_token: "synthetic-private-token" });
  assert.ok(!value.includes("synthetic"));
  const bytes = Buffer.from(value, "base64url");
  bytes[30] ^= 1;
  assert.throws(() => s.unseal(bytes.toString("base64url")));
  process.env.STRAVA_TOKEN_ENCRYPTION_KEY = "30".repeat(32);
  assert.throws(() => s.unseal(value));
});
test("token exchange is restricted to official MCP and strips extraneous personal data", async () => {
  configure();
  global.fetch = async (url, options) => {
    assert.equal(url, "https://www.strava.com/oauth/mcp/token");
    assert.equal(options.redirect, "error");
    assert.equal(options.body.get("client_id"), "test-client");
    assert.equal(options.body.get("resource"), s.STRAVA_MCP);
    return Response.json({
      access_token: "synthetic-access",
      refresh_token: "synthetic-refresh",
      expires_in: 3600,
      athlete: { name: "Do not retain" },
    });
  };
  const token = await s.exchange({
    grant_type: "authorization_code",
    code: "synthetic-code",
  });
  assert.equal(token.athlete, undefined);
  assert.equal(token.access_token, "synthetic-access");
});
test("invalid tokens and upstream errors are sanitized", async () => {
  configure();
  global.fetch = async () =>
    Response.json({ access_token: "private", expires_in: -1 });
  await assert.rejects(s.exchange({}), /invalid token/);
  global.fetch = async () =>
    new Response("SECRET PROVIDER ERROR", { status: 401 });
  await assert.rejects(
    s.exchange({}),
    (e) =>
      !e.message.includes("SECRET") &&
      e.message.includes("authorization failed"),
  );
});
test("refresh rotates tokens and retains refresh token when server omits a replacement", async () => {
  configure();
  const saved = s.seal({
    access_token: "old",
    refresh_token: "old-refresh",
    expires_in: 3600,
  });
  for (const replacement of ["new-refresh", undefined]) {
    global.fetch = async () =>
      Response.json({
        access_token: "new",
        refresh_token: replacement,
        expires_in: 3600,
      });
    assert.equal(
      await s.accessToken({
        user_id: "owner",
        tokens: saved,
        expires_at: new Date(0).toISOString(),
      }),
      "new",
    );
    assert.equal(
      s.unseal(updates.at(-1).tokens).refresh_token,
      replacement || "old-refresh",
    );
  }
});
test("unexpired token does not request refresh; expired non-refreshable token fails", async () => {
  configure();
  global.fetch = () => {
    throw new Error("Unexpected network");
  };
  const tokens = s.seal({ access_token: "current", expires_in: 3600 });
  assert.equal(
    await s.accessToken({
      user_id: "owner",
      tokens,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    }),
    "current",
  );
  await assert.rejects(
    s.accessToken({
      user_id: "owner",
      tokens,
      expires_at: new Date(0).toISOString(),
    }),
    /Reconnect/,
  );
});
test("revocation uses official endpoint and does not require a still-valid access token", async () => {
  configure();
  global.fetch = async (url, options) => {
    assert.equal(url, "https://www.strava.com/oauth/mcp/revoke");
    assert.equal(options.body.get("token"), "refresh");
    return new Response(null, { status: 200 });
  };
  await s.revoke({
    user_id: "owner",
    tokens: s.seal({ access_token: "expired", refresh_token: "refresh" }),
    expires_at: new Date(0).toISOString(),
  });
});

function chatHarness({
  identity = { id: "owner", local: false },
  output = [{ type: "mcp_call", output: "synthetic activity", error: null }],
  throwProvider = false,
} = {}) {
  const captured = [];
  let released = 0;
  class FakeOpenAI {
    responses = {
      create: async (request) => {
        captured.push(request);
        if (throwProvider) throw new Error("PRIVATE-TOKEN");
        return { output, output_text: "Your latest run was 30 minutes." };
      },
    };
  }
  const routeModule = { exports: {} };
  const imports = {
    openai: { default: FakeOpenAI },
    "next/server": { NextResponse: Response },
    "@/lib/supabase-server": {
      createClient: async () => ({
        rpc: async () => ({ data: true, error: null }),
      }),
    },
    "@/lib/health/server": {
      sameOrigin: () => true,
      healthIdentity: async () => identity,
      boundedJson: async (r) => r.json(),
      noStore: { "Cache-Control": "no-store" },
      apiError: (error, status = 400) => Response.json({ error }, { status }),
    },
    "@/lib/health/strava": {
      ...s,
      admin: () => db,
      stravaConfigured: () => true,
      accessToken: async () => "synthetic-oauth",
      ownerAllowed: (id) => id === "owner",
      readTools: () => ["list_activities"],
      lockConnection: async () => ({
        row: {},
        release: async () => {
          released++;
        },
      }),
    },
  };
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(
      readFileSync("src/app/api/strava/ask/route.ts", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  )((name) => imports[name] || require(name), routeModule, routeModule.exports);
  return {
    captured,
    get released() {
      return released;
    },
    ask: (body) =>
      routeModule.exports.POST(
        new Request("https://wolverine.example/api/strava/ask", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
  };
}
test("live question requires explicit consent and the configured cloud owner", async () => {
  process.env.OPENAI_API_KEY = "synthetic-key";
  for (const identity of [
    { id: "other", local: false },
    { id: "owner", local: true },
    null,
  ]) {
    const h = chatHarness({ identity });
    assert.equal((await h.ask({ question: "hi", consent: true })).status, 401);
    assert.equal(h.captured.length, 0);
  }
  const h = chatHarness();
  assert.equal((await h.ask({ question: "hi", consent: false })).status, 400);
  assert.equal(h.captured.length, 0);
});
test("live question passes dedicated OAuth, explicit tools and no memory or prior history", async () => {
  process.env.OPENAI_API_KEY = "synthetic-key";
  const h = chatHarness();
  const response = await h.ask({
    question: "My recent run?",
    consent: true,
    memory: "private fact",
    state: "private health",
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).persisted, false);
  const request = h.captured[0];
  assert.equal(request.store, false);
  assert.equal(request.input, "My recent run?");
  assert.deepEqual(request.tools[0].allowed_tools, ["list_activities"]);
  assert.equal(request.tools[0].authorization, "synthetic-oauth");
  assert.equal(request.tools[0].headers, undefined);
  assert.ok(!JSON.stringify(request).includes("private fact"));
  assert.ok(!JSON.stringify(request).includes("private health"));
  assert.equal(h.released, 1);
  assert.deepEqual(Object.keys(updates[0]), ["last_query_at"]);
});
test("an ungrounded model answer is rejected and provider failure cannot reveal tokens", async () => {
  process.env.OPENAI_API_KEY = "synthetic-key";
  for (const options of [
    { output: [] },
    { output: [{ type: "mcp_call", error: "denied", output: null }] },
    { throwProvider: true },
  ]) {
    const h = chatHarness(options);
    const response = await h.ask({ question: "Recent run?", consent: true });
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes("PRIVATE-TOKEN"));
    assert.equal(h.released, 1);
  }
});
