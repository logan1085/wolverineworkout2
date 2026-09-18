# Wolverine personal health agent

Wolverine extends the existing workout app into a daily wellness companion. The home screen combines self-reported sleep and energy with Garmin daily summaries, a transparent rules-based daily guide, an activity log, a journal, and contextual OpenAI conversations. The original trainer and voice workflow remain at `/workout`.

## What works now

- Responsive Today, Your agent, Activity, Journal, and Connections views.
- Daily check-ins, editable goals, activity logging, plan completion, 7/30-day activity charts.
- Device-local persistence without a cloud account; fictional sample data is separate and labeled.
- Export, validated backup restore, history deletion, and explicit AI consent.
- A real OpenAI Responses route with `store: false`, bounded context, auth checks, and graceful errors. The conversation stays in page memory; it is not a long-term memory system.
- Existing Supabase sign-in, account-scoped cloud health data, RLS migration, and server-side context loading.
- Official Garmin OAuth 2.0 + PKCE, user-bound encrypted state, encrypted server-only tokens, refresh, permission checks, incremental manual sync, and remote consent revocation on disconnect.

## Run locally with an already-authorized key

Use Node 22 LTS (some existing dependencies require Node 22). Install with `npm ci`. If the Supabase variables are configured, use the normal `npm run dev` flow.

For a development-only, device-local health preview using a key already stored in another ignored env file:

```sh
node scripts/local-health-preview.mjs /absolute/path/to/existing/.env.local
```

This reads only `OPENAI_API_KEY`, does not print or copy it, binds to `127.0.0.1:3018`, and creates an ephemeral HttpOnly local-session cookie. Cross-origin requests and unexpected hosts are rejected. The development authorization path is disabled when `NODE_ENV=production`; it must never be used to provide public access. Browser-local health history is unencrypted; use a private browser profile and clear it on shared devices.

The production build can be checked without cloud configuration using `SKIP_ENV_CHECK=1 npm run build`. This is a compile check, not evidence of a fully configured deployment. Normal `npm run build` keeps the original environment validation.

## Configure cloud accounts

1. Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the original project.
2. Apply `supabase/migrations/20260918_health_agent.sql` through the project's normal migration process. It has not been applied by this task.
3. Set `OPENAI_API_KEY` as a server secret and optionally `OPENAI_HEALTH_MODEL`. Default: `gpt-4.1-mini`.
4. Set `APP_URL` to the exact canonical HTTPS origin. Configure allowed Supabase redirect origins for that deployment.
5. Test two real users for cross-account isolation before shared release. The migration includes a 60-request-per-user UTC-day AI limit; per-process concurrency suppression is additional, not a distributed lock.

Cloud writes and Garmin imports use locked PostgreSQL merges so imported metrics are preserved when manual entries are saved. Health-profile rows are owned by the authenticated user. No browser policy grants access to encrypted Garmin tokens. The service-role key and encryption key must remain server-only. Cloud and Garmin flows have not been exercised against a live database in this task.

## Enable Garmin

Live sync needs an approved Garmin Connect Developer Program application with Health API and/or Activity API access. It is not enough to have an ordinary Garmin Connect account.

Set `GARMIN_CLIENT_ID`, `GARMIN_CLIENT_SECRET`, `GARMIN_TOKEN_ENCRYPTION_KEY` (32 random bytes encoded as 64 hex characters), `SUPABASE_SERVICE_ROLE_KEY`, and `APP_URL`. Keep the encryption key stable and backed up securely: changing it makes existing connection tokens unreadable.

Register `${APP_URL}/api/garmin/callback` as the redirect URI. A signed-in user selects Connect Garmin, authorizes on Garmin's site, returns to the app, and selects Sync recent data. The API reads granted permissions before requesting daily, sleep, and activity summaries. Upstream data is normalized and saved only after all selected requests succeed. A database lock prevents concurrent sync/refresh/disconnect operations for a user.

This implementation imports summaries uploaded during the most recent 24 hours, with a five-minute overlap on subsequent syncs. It does not backfill a user's entire history, run a scheduled background job, receive Garmin PUSH/PING callbacks, or send workouts to a watch. The UI says this explicitly. A user who has not synced for more than a day may have gaps. Account de-registration or changed permissions on Garmin's side will be detected on the next sync; inbound notification handling is not implemented. Verify response shapes and partner entitlements against the approved application's full Garmin API reference before release. Public docs establish OAuth, but full partner summary endpoints require approved access and remain unverified live here.

Official references:
- https://developer.garmin.com/gc-developer-program/overview/
- https://developer.garmin.com/gc-developer-program/health-api/
- https://developerportal.garmin.com/sites/default/files/OAuth2PKCE.pdf

## Validation and release state

Run `npm run test:health`, `npm run typecheck`, `npm run lint`, and the production build. Tests cover missing/stale health data, lighter-day guidance, backup rejection, payload normalization, encrypted-token tamper detection, and PKCE state binding. HTTP checks cover same-origin authorization, explicit AI consent, invalid context, and a live response using a fictional profile.

No browser interaction testing was requested or performed. No real health records were sent during the synthetic AI test. No Garmin account was connected. The Supabase migration and real Garmin endpoint behavior still require staging verification.

The inherited dependency audit initially had a critical Next.js finding. A compatible lockfile update moves Next.js to 15.5.25 and clears that critical finding. Remaining transitive advisories (including the older Mem0 stack and Next's PostCSS dependency) need a separate compatibility-reviewed upgrade before a shared production launch. The existing workout route retains those dependencies; they are not used as memory for the new agent.

This branch has not been pushed, publicly deployed, or logged as a public ship. The user's global AGENTS.md asks before changes to external accounts. Request approval only after presenting the working local result.
