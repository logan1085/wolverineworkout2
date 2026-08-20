# Logan — AI Personal Trainer

A Next.js app where you chat with Logan, an AI personal trainer, and get a
workout built for the time, equipment and goals you actually have today. Logan
then coaches you through the session by voice.

## How it works

1. **Chat** — tell Logan how long you have, what you want to work on, and what
   equipment is around. He asks follow-ups for anything you leave out.
2. **Preview** — Logan proposes a workout. Review the exercises, then start it
   or go back and adjust.
3. **Train** — work through the session, logging reps and weight per set. An
   optional voice coach can mark sets complete hands-free.
4. **Finish** — see what you actually completed. Logan remembers your
   preferences for next time.

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open http://localhost:3000.

`.env.example` documents every variable. The three required ones are
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`OPENAI_API_KEY`; the app will not build or run without them. See
[SUPABASE_SETUP.md](SUPABASE_SETUP.md) for where to find the Supabase values.

Memory (`MEM0_API_KEY`) is optional — without it Logan simply starts fresh each
session instead of recalling past preferences.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs typecheck + lint) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat-with-logan/        # Conversation with the trainer
│   │   ├── generate-simple-workout/# Turns the conversation into a workout
│   │   └── realtime-session/       # Mints ephemeral keys for the voice coach
│   ├── page.tsx                    # Chat → preview → workout → summary
│   └── layout.tsx
├── components/                     # UI for each step of that flow
├── contexts/AuthContext.tsx        # Supabase auth state
├── lib/
│   ├── conversation-context.ts     # Pulls goals/time/equipment out of chat
│   ├── supabase.ts                 # Browser client
│   ├── supabase-server.ts          # Server client + auth helper
│   ├── memory.ts                   # Mem0 long-term memory
│   └── logger.ts                   # Dev-only debug logging
├── prompts/                        # All model prompts
├── services/database.ts            # Supabase queries
└── types/workout.ts
```

## API routes

All three require an authenticated Supabase session and are rejected with 401
otherwise — each one spends OpenAI credits.

| Route | Purpose |
| --- | --- |
| `POST /api/chat-with-logan` | Logan's next reply, given the conversation |
| `POST /api/generate-simple-workout` | Build a workout from the conversation |
| `POST /api/realtime-session` | Ephemeral key for the realtime voice coach |

## Developer tools

The chat reset button and memory inspector are hidden unless
`NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` (they are always on in `npm run dev`).
Reset permanently clears the signed-in user's profile and chat history, so keep
it off in production.

## Security notes

- Never commit `.env.local`, and never paste keys into logs or issues.
- `log.debug` is a no-op outside development. Keep chat content, AI responses
  and memories out of `log.warn`/`log.error` — they hold personal data.
- User identity is always read from the session cookie server-side, never from
  a request body.

## Built with

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase ·
OpenAI · Mem0
