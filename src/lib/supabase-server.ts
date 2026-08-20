import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for use in route handlers and server components.
 *
 * `cookies()` returns a promise in Next 15, so this must be awaited - the
 * previous synchronous version handed `createServerClient` a pending promise
 * and every `getAll()` call failed at runtime.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore: the browser client refreshes the session.
          }
        },
      },
    }
  )
}

/**
 * The signed-in user for the current request, or null.
 *
 * Uses `getUser()` rather than `getSession()`: getSession trusts whatever is in
 * the cookie, while getUser revalidates it against the Supabase auth server. For
 * an authorization check the difference matters - a forged cookie would sail
 * past getSession.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
