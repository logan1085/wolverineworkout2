# Connecting real accounts

The Connections view offers Garmin imports and a separate personal Strava live-question panel. Neither provider is currently activated in this checkout. No account has been linked, migration applied, or provider credentials provisioned by this task.

## Garmin: health timeline

The existing integration uses official Garmin OAuth with PKCE, encrypted access and refresh tokens, a signed-in Supabase identity, and a per-account lock around refresh/sync/disconnect. It imports daily steps, resting heart rate, sleep duration, and activities when the account grants those permissions. The agent can read this imported health state after the user consents.

1. Configure Supabase authentication and apply the health-agent and memory migrations.
2. Obtain an approved Garmin developer app and enable its Health/Activity permissions.
3. Configure the `GARMIN_*` values, server-only Supabase service role, and canonical `APP_URL` from `.env.example`.
4. Register `<APP_URL>/api/garmin/callback` as the redirect.
5. Sign in → Connections → Connect Garmin → approve requested scopes.
6. Sync the watch to Garmin Connect, then choose **Sync recent data** in Wolverine.

Sync reads uploads from the last 24 hours, with overlap after subsequent imports. It is user-triggered, not a background subscription. Older activity backfill needs Garmin approval and is not implemented. Disconnect revokes future access; imported history is retained until the user clears it.

## Strava: personal live questions

Strava’s API Policy effective June 1, 2026 prohibits ordinary API data from being put into AI context, memory, RAG, or analytics. Its official MCP is the personal-use exception. Consequently this implementation does **not** use the standard activity REST API, store Strava activities, or mix them into dashboard totals or durable agent memory.

The official help center currently documents a Claude-first rollout and subscription eligibility. The official MCP metadata is reachable and advertises OAuth registration; this does **not** establish that this custom client or OpenAI can be authorized for Logan’s account. Treat this integration as implemented but pending account eligibility, client registration, and end-to-end compatibility verification. Do not advertise general customer availability.

### Activation

1. Check eligibility in Strava’s MCP settings, using the official help link below. Obtain permission/registration for this personal client using Strava’s supported workflow. Registration is an external account change; no registration is performed by the app.
2. Configure a dedicated registered MCP client ID, its secret if applicable, and exact redirect `<APP_URL>/api/strava/callback`. Standard Strava REST developer credentials are **not** interchangeable with an MCP client.
3. Set `STRAVA_MCP_OWNER_ID` to the owner’s Supabase user UUID. Every protected endpoint checks this identity. The feature is intentionally unavailable to other users.
4. Configure a separate `STRAVA_TOKEN_ENCRYPTION_KEY` (32 random bytes in hex), and the same Supabase server settings used by Garmin. Do not expose secrets through `NEXT_PUBLIC_*`.
5. With the registered client, inspect the official MCP `tools/list` using an authorized MCP client. Confirm the tools’ semantics are read-only, then configure their exact names in `STRAVA_MCP_READ_TOOLS`. Tool names are not guessed, and an empty list disables connection setup.
6. Apply `supabase/migrations/20260918180000_strava_mcp.sql` after the health and memory migrations. It grants connection-table access only to the server service role.
7. Sign in as the owner and use **Link personal Strava**. The OAuth flow uses a random user-bound state, a ten-minute HttpOnly cookie, PKCE S256, a fixed callback and fixed official endpoints.
8. Ask a question with explicit consent to sharing it and live Strava data with OpenAI. The Responses API receives only the allowlisted official MCP tools, a dedicated OAuth authorization field, and `store:false`. The app requires a successful live tool result before presenting an answer. No dashboard data, agent memory, prior conversation, or Garmin records are sent with this request.
9. Verify a real activity answer, token expiry/refresh, denied access, and disconnect before enabling routine use. If the custom client is not supported by Strava, leave it disabled and use the official supported client; do not substitute REST scraping or an unofficial MCP.

Questions and answers live only in the mounted Connections panel; leaving the view, signing out, clearing the answer, or disconnecting clears them. The app stores encrypted OAuth credentials and connection/query timestamps only. OpenAI handles data under its API retention policies; `store:false` is not a claim of zero provider retention. Consent resets after each successful answer. Queries share the agent’s 60-per-day account quota. The connection lock prevents concurrent token rotation and disconnect; requests time out and provider error details are not returned or logged.

Disconnect first revokes the OAuth grant, then deletes the connection row. A failed revoke leaves credentials available for retry and shows an error; users can also revoke directly in Strava settings. Account deletion in Supabase cascades the local row but is not a substitute for provider revocation.

### Verified public endpoints (September 18, 2026)

- Protected resource metadata: `https://mcp.strava.com/.well-known/oauth-protected-resource`
- Authorization metadata: `https://www.strava.com/.well-known/oauth-authorization-server/mcp-issuer`
- Official MCP: `https://mcp.strava.com/mcp`
- Authorization / token / revoke: `https://www.strava.com/oauth/mcp/{authorize,token,revoke}`
- Registration advertised by metadata: `https://www.strava.com/oauth/mcp/register_client`

No live account data was accessed when inspecting these public metadata endpoints.

## Validation and remaining checks

Run `npm run test:connections`, `npm run test:health`, `npm run test:memory`, `npm run lint`, and `npm run typecheck`. With the local preview running, `node tests/connections-api.mjs` verifies unauthenticated/local-user denial and cross-origin rejection. Unit tests use synthetic credentials and mocked fetches; they do not prove provider account compatibility. Cloud RLS, migrations, real OAuth, refresh, and revocation require a configured Supabase project and eligible real provider account.

## Official references

- [Garmin developer program](https://developer.garmin.com/gc-developer-program/overview/)
- [Strava API Policy](https://www.strava.com/legal/api_policy)
- [Strava official MCP and eligibility](https://support.strava.com/en-us/articles/15401531-what-is-the-strava-mcp-connector)
- [OpenAI remote MCP authorization](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
