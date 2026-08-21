import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 *
 * `createBrowserClient` memoises per browser context, so calling this from
 * several components does not open several clients.
 *
 * The URL and key are read explicitly rather than with a `!` assertion: when
 * they are missing, the assertion let `undefined` through and Supabase failed
 * later with an opaque message, which presented as a blank page on a fresh
 * checkout. Failing here names the variable that is actually missing.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env.local and fill it in, then restart the dev server.`
    )
  }
  return value
}

// Non-generic wrapper so `ReturnType` below resolves to the concrete client
// type. Taking `ReturnType<typeof createBrowserClient>` directly would erase the
// generic parameters and widen every query result and callback argument to
// `any`, which then trips `noImplicitAny` at the call sites.
function newClient() {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

let client: ReturnType<typeof newClient> | undefined

/**
 * Returns the browser client, creating it on first use.
 *
 * Call this lazily - from an effect, an event handler or inside an async
 * method - never at module scope or during render. Constructing it during
 * render also runs it on the server during prerendering, where the throw above
 * aborts `next build` with an error attributed to whichever page happened to
 * render first (typically `/_not-found`, which does not use Supabase at all).
 * Deferring construction keeps the static shell buildable and reports a missing
 * variable against the code that actually needs it.
 */
export function createClient() {
  if (!client) {
    client = newClient()
  }
  return client
}
