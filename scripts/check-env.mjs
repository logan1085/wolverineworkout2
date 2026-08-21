/**
 * Build-time environment check.
 *
 * Runs as the `prebuild` script, so `npm run build` invokes it automatically -
 * locally and on the host. It exists because of how `NEXT_PUBLIC_*` variables
 * work: they are inlined into the client bundle at build time, so a build that
 * runs without them produces a bundle that is permanently broken until it is
 * rebuilt. Setting the variable afterwards and restarting does nothing.
 *
 * Without this check that failure is silent (the deploy is reported green and
 * the app throws in the user's browser) or, worse, surfaces as a prerender
 * error against `/_not-found` - a page that has nothing to do with Supabase.
 *
 * Set SKIP_ENV_CHECK=1 to bypass, e.g. to typecheck a build without credentials.
 */
// `@next/env` is CommonJS, so it has no named ESM exports - destructure the
// default import rather than using `import { loadEnvConfig }`.
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

// Populate process.env from .env.local / .env.production / .env exactly the way
// `next build` will, so a correctly configured local checkout is not rejected.
loadEnvConfig(process.cwd(), false, { info: () => {}, error: () => {} })

// Required at BUILD time: inlined into the client bundle, so an absent value is
// baked in as `undefined` and cannot be corrected without a rebuild.
const BUILD_TIME_REQUIRED = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Dashboard -> Settings -> API -> Project URL'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Dashboard -> Settings -> API -> Project API keys -> anon'],
]

// Required at RUNTIME only: read inside route handlers per request. A missing
// value breaks the AI routes but does not corrupt the build output, so this is
// a warning - the value can be added later without rebuilding.
const RUNTIME_REQUIRED = [
  ['OPENAI_API_KEY', 'https://platform.openai.com/api-keys'],
]

if (process.env.SKIP_ENV_CHECK === '1') {
  console.warn('check-env: SKIP_ENV_CHECK=1 set, skipping environment validation.')
  process.exit(0)
}

const isBlank = (name) => {
  const value = process.env[name]
  return value === undefined || value.trim() === ''
}

const missingRuntime = RUNTIME_REQUIRED.filter(([name]) => isBlank(name))
for (const [name, where] of missingRuntime) {
  console.warn(`check-env: warning - ${name} is not set. Get it from ${where}.`)
  console.warn('check-env: the build will succeed; the AI routes will return an error until it is set.')
}

const missingBuild = BUILD_TIME_REQUIRED.filter(([name]) => isBlank(name))
if (missingBuild.length === 0) {
  process.exit(0)
}

const lines = [
  '',
  'Build stopped: required environment variables are not set.',
  '',
  ...missingBuild.flatMap(([name, where]) => [`  ${name}`, `      ${where}`, '']),
  'These are NEXT_PUBLIC_ variables. They are inlined into the client bundle at',
  'build time, so building without them ships an app that cannot reach Supabase',
  'no matter what is configured afterwards. Set them, then trigger a new build.',
  '',
  '  Vercel:  Settings -> Environment Variables (tick every environment you',
  '           deploy, then redeploy - "Redeploy" reuses the previous build',
  '           unless you clear the build cache).',
  '  Local:   cp .env.example .env.local and fill it in.',
  '',
  'See DEPLOYMENT.md. To bypass this check, set SKIP_ENV_CHECK=1.',
  '',
]
console.error(lines.join('\n'))
process.exit(1)
