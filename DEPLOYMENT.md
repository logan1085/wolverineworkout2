# Deployment Guide

## Environment variables

Set these in your host's dashboard (Vercel: Settings → Environment Variables)
before the first deploy. `.env.example` is the authoritative list.

### Required

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

`NEXT_PUBLIC_*` values are inlined into the client bundle **at build time**.
Adding or changing one requires a rebuild, not just a restart.

### Optional

| Variable | Effect |
| --- | --- |
| `MEM0_API_KEY` | Enables long-term memory. Without it Logan starts fresh each session. |
| `ENABLE_MEMORY` | Set to `false` to disable memory even when the key is present. |
| `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | Set to `true` to expose in-app dev tools. **Leave unset in production** — the reset tool destroys user profile data. |

## Deploying

1. Import the repository into your host.
2. Add the environment variables above.
3. Deploy. Build command is `npm run build`.

## Build configuration

The build runs a real TypeScript and ESLint check and **will fail on errors**.

This is deliberate. Both checks were previously suppressed in `next.config.ts`
(`ignoreBuildErrors` / `ignoreDuringBuilds`) so deploys could never fail; that
hid around fifty genuine type errors. If a deploy fails now, fix the error
rather than reinstating the suppression — the check is doing its job.

Run the same checks locally before pushing:

```bash
npm run typecheck
npm run lint
npm run build
```

## Secrets

- Never commit `.env.local`, and never paste a key into a log, issue, or chat.
- Do not embed credentials in the git remote URL. Use a credential helper or
  SSH; a token in `.git/config` is echoed by any `git remote -v` and ends up in
  CI logs.
- If a key is ever exposed, revoke it at the provider first, then replace it.
  Removing it from a file is not sufficient once it has been printed.

## Troubleshooting

**Blank page / "Missing required environment variable"** — a Supabase variable
is unset. Add it and rebuild.

**All API calls return 401** — the request has no valid Supabase session. Every
AI route requires a signed-in user by design. Check that auth is configured and
cookies reach the server.

**Chat works but Logan never remembers anything** — `MEM0_API_KEY` is unset or
`ENABLE_MEMORY=false`. This degrades cleanly and is not an error.

**Deploy fails on a type or lint error** — see "Build configuration" above.
