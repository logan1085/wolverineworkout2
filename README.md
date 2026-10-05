# Wolverine — Your personal trainer for your marathon

A marathon-focused running companion built around one race goal, a training calendar, and a daily conversation with Pip.

[Open the app](https://wolverineworkout2.vercel.app) · [Public soul & memory](https://wolverineworkout2.vercel.app/transparency) · [Release acceptance](docs/RELEASE_ACCEPTANCE.md)

## The experience

- **Start with your race.** Conversational onboarding asks which marathon, then your intention and optional race date.
- **Review your training.** A recent-running assessment leads to a supported 16–24-week marathon draft with build, recovery and taper phases. Preview before activating; previous blocks remain available. A separate four-week consistency planner remains available. Supported inputs and limitations are documented in [marathon planning](docs/MARATHON_PLANNING.md).
- **Take it one day at a time.** Browse the calendar, open a session, record completion and effort, or review a lighter week. Pause and review the unchanged schedule before returning. No automatic catch-up training or readiness clearance.
- **Record what happened.** Log in miles or kilometres, correct manual entries, and explicitly link an actual activity to a planned session. Actual measurements remain separate from targets; logging a run does not silently complete a plan.
- **Control personal memory.** Review, confirm, correct, expire, export or forget facts. Device-local records work without cloud sign-in; account sync requires a working Supabase project and migrations. Main-app memory does not depend on Mem0.
- **Choose your companion.** Pip, Sprout and Honey use original Blender assets. The object library works without AI; the separate AI studio creates bounded primitive-based sketches with JSON/GLB export. [Studio capabilities](docs/studio/README.md).

## Current release status

October 5, 2026: the website is deployed to Vercel and source is pushed to `feat/personal-health-agent`. The latest audit passes 164 unit/synthetic tests. This is **not full connected-product acceptance**.

The production status endpoint currently reports rejected AI credentials and unavailable account authentication. Chat, voice and successful Photon AI replies remain blocked or unverified. Garmin and the separate owner-only Strava flow require approved provider configuration and real-account tests. Physical iOS/Android, screen-reader and GPU acceptance remain open. See [release evidence](docs/RELEASE_STATUS.md) and [acceptance gaps](docs/RELEASE_ACCEPTANCE.md); a successful deployment does not prove those connections work.

## Development

Use Node.js 22. Install dependencies with `npm install`, configure an ignored `.env.local` using `.env.example`, and run `npm run dev`. The default development URL is http://localhost:3000.

The normal production build requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These public values are embedded at build time; changing them requires a fresh build. `OPENAI_API_KEY` is server-only and required for AI requests, not successful compilation. Missing configuration is not permission to provision new accounts or keys. Never commit secrets or include them in logs or issues.

[Supabase setup](SUPABASE_SETUP.md) · [Deployment](DEPLOYMENT.md) · [Health architecture](HEALTH_AGENT.md) · [Garmin/Strava](CONNECTIONS.md) · [Photon texting](docs/PHOTON_SETUP.md)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Regenerate public policies, check environment, compile, lint and typecheck |
| `npm run start` | Serve the production build |
| `npm run typecheck` / `npm run lint` | Static checks |
| `node --test tests/*.test.mjs` | Unit/synthetic suite; excludes separate live API scripts |
| `npm run eval:marathon` | Deterministic marathon draft review |
| `npm run eval:agent` | Validate/load 21 fictional coaching scenarios without generation |
| `npm run eval:agent -- --live` | Live synthetic evaluation; requires an approved local preview identity and working AI access |
| `npm run docs:agent` | Regenerate public SOUL/MEMORY and the documented runtime prompt |

Live evaluation output still needs qualitative review. Existing captures predate the current marathon prompt and do not validate it. [Evaluation evidence](evals/results/REVIEW.md).

## Code and public policies

- `src/components/health/`: dashboard, onboarding, calendar, training, memory and connection interfaces.
- `src/lib/health/`: validation, persistence, training logic, provider integrations and agent instructions.
- `src/app/api/health/`: authenticated data, memory, chat, voice and scene routes.
- `src/app/api/garmin/`, `src/app/api/strava/`, `src/app/api/photon/`: separate provider routes.
- `supabase/migrations/`: account storage, access policies and quotas.
- `assets/blender/` and `public/models/`: editable sources and web assets.

The [system prompt](docs/agent/SYSTEM_PROMPT.md) is generated from `src/lib/health/agent-prompt.ts`. `/SOUL.md` publishes intended behavior; `/MEMORY.md` publishes storage/recall policy, **never personal memory contents**. Edit memory policy in `docs/agent/MEMORY.md`, then regenerate. [Mobile behavior and acceptance](docs/mobile/USAGE.md).

## Original workout coach

The earlier chat → workout preview → set logging → summary workflow is preserved at `/workout`. Its separate voice and optional Mem0 integration are legacy features, not the marathon dashboard's memory system. They also require their configured services. Developer reset tools can erase legacy records and should remain disabled in production.

Built with Next.js 15, React 19, TypeScript, Supabase, OpenAI, Three.js and Blender.
