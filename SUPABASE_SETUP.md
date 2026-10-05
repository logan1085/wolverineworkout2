# Wolverine account setup

Account integration exists in the repo, but configuration alone does not establish a working connected product. See `docs/RELEASE_STATUS.md` for current production evidence.

## Choose the correct project first

Use the original Wolverine project if it can be restored, or a dedicated replacement explicitly selected by the owner. Do not point this health app at another application's database. Changing the project or its account settings requires owner approval under AGENTS.md.

Keep credentials out of chat, Git and screenshots. Configure the chosen project's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the deployment environment and local ignored environment file. These public values identify the backend; never substitute a service-role key for the anon key. Server-only integration credentials are documented in `CONNECTIONS.md`.

## Email confirmation

The browser client uses PKCE. Registration supplies an explicit `/auth/callback` return URL on the current app origin. The callback exchanges the code server-side and writes session cookies through the existing server client. It redirects to `/auth/confirmed` with a fixed, non-sensitive result. The result screen verifies the user with the auth service before showing a signed-in state; a query parameter alone never proves authentication.

For the approved Supabase project, configure:

- Site URL: `https://wolverineworkout2.vercel.app`
- Allowed redirect URL: `https://wolverineworkout2.vercel.app/auth/callback`
- Local development redirect URLs, only when needed: `http://localhost:3018/auth/callback` and `http://127.0.0.1:3018/auth/callback`
- Add an exact preview origin only when deliberately testing there. Do not broadly allow arbitrary preview or third-party domains.

Keep the standard confirmation email's confirmation URL flow when using this code-exchange callback. A custom token-hash template requires a separate verification handler; it is not implemented here. Open the email link in the same browser that initiated registration so the PKCE verifier is available. Used, expired, missing-verifier or service-failure cases return to a clear result screen with a Connections link.

Official references: [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Database schema

Review and apply these checked-in migrations in order to the approved project:

1. `supabase/migrations/20260918_health_agent.sql`
2. `supabase/migrations/20260918120000_health_memory.sql`
3. `supabase/migrations/20260918180000_strava_mcp.sql`

Do not treat schema application as proof of row-level isolation. Validate with two dedicated test accounts before making that claim.

## Required hosted acceptance

- Confirm `/api/health/session` reports account availability.
- Register an approved test address; verify email delivery and the exact callback destination.
- Open the link in the initiating browser; confirm cookies survive the redirect and reload.
- Verify an already-used link and a link opened in another browser give a useful recovery screen.
- Confirm normal sign-in and sign-out, then test cross-account isolation of profiles, memory, training and connections using two test accounts.
- Confirm local records are not silently uploaded into an account.
- Test production on an actual phone. Simulated viewport checks are not physical-device acceptance.

The synthetic callback tests (`node --test tests/auth-callback.test.mjs`) cover redirect/error handling and result-screen authentication checks. They do not prove email delivery, provider allowlist configuration, cookie persistence or database isolation. Password recovery is implemented but still requires hosted acceptance.

## Password recovery

Both sign-in forms link to `/auth/forgot-password`. The page checks account availability before accepting an email. A successful request returns the same copy for known and unknown addresses. The provider enforces request limits; the UI prevents duplicate in-flight submission and does not automatically resend.

Allow the exact recovery callback `https://wolverineworkout2.vercel.app/auth/callback?flow=recovery` in the approved project's redirect configuration, plus corresponding exact local URLs if testing locally. Keep the standard recovery email confirmation URL flow. A successful code exchange returns to `/auth/reset-password`; the routing flag by itself does not authenticate anyone. The server verifies the user before rendering the password form and the client checks the user again before submitting to Supabase's authenticated `updateUser` API. Provider password policy remains authoritative.

Acceptance still required: an approved test address receives a reset email, same-browser callback works, password update succeeds, the new password signs in, the old password fails, expired links recover clearly, and provider password/rate-limit policies display useful messages. No real email or password change is part of the synthetic test suite. Never store test credentials in the repo or release log.

Reference: [Supabase password reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
