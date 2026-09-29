# Wolverine release status

Latest shipped visual/asset/build verification: September 28, 2026. The account and device acceptance requirements below remain open; see the dated release entries for the verified revisions.

**Not ready to claim a complete connected health product.** The production app supports local check-ins, activity records, device-local memory, personal routines/streaks, a history calendar, characters and contextual 3D objects. Its configured account service is unavailable, and neither wearable integration has passed real-account acceptance. A passing build does not remove those blockers.

## Requirement evidence

| Requested outcome | Current evidence | Remaining acceptance |
| --- | --- | --- |
| Refined mobile app | Browser review at 390×844; Today, agent, companion selection, modal keyboard boundaries and focus return; latest production build passed | Physical iOS/Android keyboard, large text, landscape and home-screen walkthrough in `docs/mobile/USAGE.md` |
| Personal health agent | Live fictional HTTP suite; 14 targeted checks pass on prompt `wolverine-health-2026-09-22.2`; outputs and qualitative review retained | Repeated/multi-turn review; profile available-time wording remains imperfect; no clinical validation claimed |
| Inspectable memory | Local confirmed facts and chat history; edit/forget/expiry flows; bounded context brief and source discrepancies; relevant unit tests | Real two-account isolation, deployed migrations/RLS, cross-tab and account-switch acceptance |
| Personalized onboarding and streaks | Three-step setup, saved preferences, daily actions, deduplicated local-day streaks and seven-day strip; local browser persistence/undo verified | Authenticated persistence and two-account isolation |
| Home calendar | Month navigation and recorded-day agendas; local browser and calendar tests | Physical screen-reader/touch acceptance |
| Public soul and memory documents | Runtime-generated `public/SOUL.md`, policy-only `public/MEMORY.md`, `/transparency` | Continue regeneration when behavior changes; never publish personal health records |
| Blender object catalog throughout app | Editable Blender sources, GLB models, portrait assets, integrated activity/journal/Today cards and studio | Independent GLB viewer and physical touch/GPU checks |
| Choose a character | Pip, Sprout, Honey; saved per-device/account scope; selection verified across Today/chat and reload | Cloud preference sync is not implemented or claimed |
| Smooth 3D experience | Detailed portrait remains the default; explicit 3D entry/return and rotation verified; retry/error handling implemented | GPU loss and network-failure fault testing on phones; no performance score claimed |
| Garmin account connection | OAuth/import/encrypted-token implementation, synthetic tests and HTTP guards | Approved provider configuration, restored Supabase, migrations, real connect/sync/refresh/disconnect |
| Strava account connection | Separate owner-only live connector implementation and guards | Eligible registered client, configured tools/credentials and real lifecycle verification; not general multi-user availability |
| GitHub and Vercel delivery | `feat/personal-health-agent` pushed; production Ready at https://wolverineworkout2.vercel.app; dated ships below | Connected-account and physical-device acceptance still pending despite authorized production publishing |

## Current and historical external evidence

- Hosted `/api/health/session` returned `local:false`, `ai:true`, `auth:false`, `authStatus:"unavailable"` on September 28, 2026.
- September 23 inventory (not rechecked in this pass): Vercel Preview environment contained only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENAI_API_KEY`. No credential values were printed. Garmin, Strava, server service-role and connector-encryption configuration are absent.
- Earlier configured-host DNS and auth-settings checks failed with `ENOTFOUND`; this audit confirms account unavailability persists. No database records have been read or changed.
- The Supabase dashboard currently presents a sign-in screen. No authenticated administrative session is available to inspect whether Wolverine's project can be restored.
- Test/build evidence is recorded per release below. Those checks do not establish real account isolation or provider lifecycle acceptance.

## Unblocking sequence

1. The project owner signs into the existing Supabase dashboard. Inspect the configured Wolverine project, restore it if possible, or deliberately select its replacement. Do not substitute an unrelated database.
2. Configure the approved project and secrets through the provider dashboards, apply the three checked-in migrations, and verify sign-in plus isolation with two dedicated test accounts.
3. Configure and authorize an eligible Garmin app/account (or the supported personal Strava flow). Follow `../CONNECTIONS.md`; do not advertise a connector merely because its code exists.
4. Complete the secure-deployment physical-phone checklist, including failure recovery and keyboard use. Local development authentication must remain loopback-only.
5. Resolve remaining evaluation findings and publish the verified connected-account revision. The current local-first product is already on production by user request.

No passwords, API keys or health exports should be sent through chat. The requested next user action is signing into the existing Supabase account, not creating or purchasing a new project.

[Current Preview](https://wolverineworkout2-git-feat-pers-506864-logan-horowitzs-projects.vercel.app) · [GitHub branch](https://github.com/logan1085/wolverineworkout2/tree/feat/personal-health-agent)

## UI redesign — September 22, 2026

Shipped `63f21fb` to GitHub branch `feat/personal-health-agent` and Vercel Preview:
https://wolverineworkout2-mdst37bsm-logan-horowitzs-projects.vercel.app

Replaced the forest theme with warm white surfaces, navy typography, and soft blue accents across the health app. Simplified first-use Today, enlarged the companion, unified dialogs and navigation, and bundled licensed fonts locally after Google Fonts broke the local build. Browser review covered mobile Today, check-in, character picker, agent, activity, journal, and More, plus desktop Today, memory, and connections. The mobile check-in has no horizontal overflow. Production build, lint, and type validation passed; Vercel reports Ready. Production promotion and previously documented account integration blockers remain unchanged.

## Anime companion — September 22, 2026

`909bee2` is live on Vercel Preview at https://wolverineworkout2-ix1ft8zjb-logan-horowitzs-projects.vercel.app (Ready). Adds Kai, an original static anime-style Blender character, to Today, agent avatars, and the picker. Existing mascot preferences remain available; Kai is the default for new preferences. Eight catalog checks and the production build passed. Browser checks confirmed selection persistence, shared chat identity, and a contained loading poster. No skeletal or facial animation is included.

## Mascot direction and public identity — September 23, 2026

The human-character exploration was rejected. `1c2ee1f` restores Moss, Sunny, and Pebble, with Moss as the default and fallback for a saved Kai choice. The live app retains the soft, round, non-human direction; Kai is absent from the selection catalog. The corrected preview was verified Ready.

`cb2f710` aligns the public soul/memory page, manifest colors, browser icon, and generated Apple home-screen icon with the light app design. Vercel Preview is Ready at https://wolverineworkout2-pmt3qawp1-logan-horowitzs-projects.vercel.app. Browser review verified the public page, memory anchor, no horizontal overflow at the reviewed mobile-sized viewport, return navigation, theme metadata, and current icon link. The generated Apple PNG was visually inspected. All 53 unit tests and the production build (including lint/types) passed. The local environment check was skipped because local account configuration is absent; this is not hosted integration acceptance.

A fresh hosted session check still returns `auth:false, authStatus:"unavailable"`. Connected accounts, wearable lifecycle verification, and physical-device acceptance remain incomplete. The goal is not complete.

## Narrow and landscape chat — September 23, 2026

`1b7ddf4` is Ready on Vercel Preview at https://wolverineworkout2-2ba034pdx-logan-horowitzs-projects.vercel.app. Browser checks at 320×667 and 667×320 found and fixed header crowding and an unreachable landscape composer. Narrow conversation space, document scrolling, focused composer visibility, and no horizontal overflow were verified. Details and measurement limits are in `docs/mobile/USAGE.md`. Lint and the hosted build passed. A repeated hosted account-status check still reports `authStatus:"unavailable"`; the owner was asked to sign into the existing Supabase project so account and connector acceptance can proceed.

## Minimal views — September 23, 2026

`15133ce` is Ready on Vercel Preview at https://wolverineworkout2-1s050hnnp-logan-horowitzs-projects.vercel.app. Simplified all six main health views: shorter titles, removed promotional duplication, compact empty states, record-first Activity/Journal, focused chat with accessible Context, memory facts and toggle first, concise provider summaries, and native disclosures for secondary tools. Existing companions and object library remain accessible. Reviewed local mobile Today/Activity/Journal/Memory/Connections and desktop agent; confirmed Context opens, the daily plan exposes all three actions, and the normal browser viewport was restored. Local build and final lint/type validation passed; hosted build is Ready. Existing account/provider acceptance blockers remain open.

## Forest-green palette restored — September 25, 2026

`2865e46` is Ready on Vercel Preview at https://wolverineworkout2-bp09f89bf-logan-horowitzs-projects.vercel.app. Restored forest-green surfaces, sage accents, the pale daily briefing, and matching public-page and app-icon colors. Preserved the minimal view hierarchy and rounded companions. Local browser review covered Today, the agent view, and its Context dialog. Production build including lint and type validation passed; hosted build is Ready.

## Blender green-palette assets — September 25, 2026

`c8b6178` is Ready on Vercel Preview at https://wolverineworkout2-pqimrzmqt-logan-horowitzs-projects.vercel.app. Regenerated all three approved companions and six objects in Blender, including editable sources, GLB materials, and transparent renders. Object images now use 640px, 96-sample denoised Cycles rendering. Versioned asset filenames avoid stale optimized-image and model caches. Visually inspected all nine PNGs and the local companion picker; confirmed all three versioned portrait URLs loaded. Eight catalog tests and the production build passed. This changes palette/materials and render quality, not character geometry or animation.

## Soft companions and production ship — September 25, 2026

User explicitly requested shipping to GitHub and Vercel. Published `73a5743` from `feat/personal-health-agent` to production: https://wolverineworkout2.vercel.app. Deployment `dpl_HdJc2VW67in6as7K7u9FBJbbCHcc` reports READY; immutable URL: https://wolverineworkout2-9sfftx8av-logan-horowitzs-projects.vercel.app. This supersedes the earlier preview-only release status; the original workout view remains at `/workout`.

Rebuilt Moss, Sunny, and Pebble in Blender with continuous soft bodies, small linen faces, relaxed limbs, and original botanical/stone accents after studying the Muse visual reference. Updated live companion lighting, soft shadow filtering, editable sources, versioned GLBs and 768px portraits. Each GLB stays below 800 KB. Eight catalog tests and local/hosted production builds passed. Visually inspected all portraits, desktop/mobile Today and picker, live rotate/reset, and the public production page. No browser errors appeared in the reviewed viewer interaction. Account service availability, provider setup, and physical-device acceptance remain separate incomplete work; this deployment does not certify them.

## Companion detail and clarity — September 25, 2026

`e19388b` is live at https://wolverineworkout2.vercel.app (production READY, deployment `dpl_9G8pkQYVDa4A9a8s7ga95Zgjzwa4`). Adds modeled facial stitches, eye catchlights and leaf veins, 1024px Blender portraits, quality-95 responsive image requests, tighter live framing, AgX companion tone mapping, and a larger mobile picker canvas. Live rendering supports up to 3× density capped at 1.5M pixels. All eight catalog checks and local/hosted builds pass. Browser review verified the picker and canvas buffer sizes; production loads `moss-soft-v2.png` at quality 95. The approved soft silhouette is preserved. Physical-device performance and prior account/provider acceptance remain open.

## Focused Blender refinement — September 25, 2026

`744fd74` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_Gr54S1VN4SGME279dU3JLwL9Zo5t`). Rebuilt the face as a surface conforming to the body, refined stitching, relaxed the arm pose, and replaced Moss's primitive leaf with a tapered cupped mesh and corrected stem. Baked fabric normals now ship inside all three GLBs; texture resources are released when viewers unmount. Editable Blender sources and 1024px portraits share the exported geometry.

Reviewed front, three-quarter, and profile Blender renders; all three final portraits; local mobile picker, character switches, and rotation/reset; and the live production picker using atelier-v2 assets. Nine catalog tests and local/hosted production builds passed. Models are 681–796 KB. This art release does not resolve prior account/provider or physical-device acceptance work.

## Stable portraits, focus spaces and Home calendar — September 25, 2026

`4d87f90` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_6spXMY4Kpddbeqn9jjdQ6usTpWuY`). Stops the automatic detailed-portrait-to-WebGL replacement; interactive 3D is now explicitly requested. Integrates Movement, Rest and Reflection object spaces into Home, Activity and Journal, with focused agent draft actions. Adds a month calendar with selected-day records, month navigation, Today and sample/empty states. Removes Home's duplicate activity list and puts metrics behind a disclosure. The calendar presents existing health history; it does not schedule future events or sync external calendars.

Three date/agenda tests and local/hosted builds (lint/types included) passed. Browser review covered 320px/375px mobile and desktop, demo activity matching, future-month empty states, focus switching, draft-only agent navigation, companion/object 3D entry and return, and canvas removal. Production verification confirms the calendar, atelier-v2 portrait and zero default WebGL canvases. Prior provider/account acceptance remains separate.

## Personal onboarding, daily routines and streaks — September 28, 2026

`cc4fcb8` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_Gf17sNb6GAFBamoy4nNU236cZxt1`). Adds goal/time/pace/companion onboarding, validated optional routine preferences in the health profile, daily task actions/completion, a seven-day strip, current and best streaks. Saved check-ins and activities satisfy relevant tasks. Rest counts, yesterday stays active until today ends, and undo recalculates actual history. Replaces the generic daily checklist. Atelier-v3 updates all Blender sources, portraits and GLBs with rounder proportions and softer fabric; interactive lighting has less ambient fill.

Passed 41 checks (12 health, 15 memory/context, 5 routine, 9 catalog), lint, and local/hosted production builds. Browser-tested mobile onboarding, saving, reload persistence, task completion/undo and live 3D in a separate localhost test session. Production verification confirms the onboarding dialog and atelier-v3 assets. The owner's preferences were not configured during testing. Hosted account/provider acceptance remains separate and incomplete.

## Routine consistency and onboarding acceptance fixes — September 28, 2026

`9fdf0bf` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_6JFBNYW5KxkLiAb3VGhYrohQS5ge`). The routine and briefing now share stress/sleep pacing evidence; short time preferences bound the wind-down suggestion. Onboarding preserves previously configured time choices, freezes controls and dismissal during saves, and focuses each new step heading. Calendar Today follows local day changes while explicit history selections stay fixed, and its check-in action waits for loaded history.

Passed 22 targeted tests (7 routine, 12 health, 3 calendar) and local/hosted builds including lint/types. Mobile browser review confirmed step focus, layout and cancellation; the production wizard also focuses the new step heading. Pending-save control guards were inspected in code, not exercised against a slow real account. Live account status remains unavailable, so the broad product goal remains incomplete; see the updated requirement table and product-quality audit.

## Cross-tab health history protection — September 28, 2026

`b873c25` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_GqC1peeZyZ7Vds61GzsRvntqXGC7`). Adds idle cross-tab/focus refresh, stale snapshot checks for saves/deletes, shared Web Lock serialization where supported, and identity guards on late save/sync responses. Open forms preserve their base snapshot and reject conflicting saves; dismissal refreshes current records. Tests do not certify real cloud-account isolation.

Passed 22 targeted tests (3 local storage, 7 routine, 12 health), lint, and local/hosted builds. Two isolated localhost tabs verified that a stale routine save cannot erase the other tab's task completion, closing the form refreshes progress, and subsequent undo propagates without reload. Production Home loads after deployment. The owner's health preferences were untouched; previous external-account and physical-device acceptance remains open.

## Original apple companion family — September 28, 2026

`5e272aa` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_21eQ6Dkpc5NyNi7bWrYPFNTvigfj`). Replaces the selectable family with Pip, Sprout, and Honey: original Blender apple characters with lobed bodies, indented tops, bent stems, cupped leaves, seed-shaped eyes, waving mitten hands, and small shoes. Includes editable Blender sources, a reproducible generator, versioned apple-v2 GLBs and 1024px transparent portraits. Retired saved character IDs fall back to Pip. Home, chat, onboarding, and the picker use the shared catalog; interactive 3D remains opt-in.

All nine catalog checks and local/hosted production builds including lint/types passed. Local mobile browser review covered Home, character switching, chat, and interactive rotation. Production verification confirms Pip's apple-v2 portrait loads at quality 95. Existing account/provider and physical-device acceptance remains separate and incomplete.

## Approved sprout-creature sculpt — September 28, 2026

`5948175` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_7mR1J7CEgrmcWYZPoCcyU9y9z6iH`). Four Blender render/critique passes replaced the literal apple with a continuous rounded sprout creature, refined limb joins and waving pose, and polished the silhouette. Pip, Sprout and Honey share versioned sprite-v4 portraits and GLBs. The user approved this direction; the reference and iteration studies are saved in `docs/studio/COMPANION_DESIGN.md`.

Nine asset checks and local/hosted production builds passed. Reviewed all three final renders, the mobile picker, and the matching interactive 3D appearance. Each GLB remains below 800 KB. Existing account/provider acceptance remains separate.

## Researched training-plan release — September 28, 2026

`c0d10a2` is live at https://wolverineworkout2.vercel.app (production READY, `dpl_uTNPthP9xKHuHJcDZenogujXtEDR`). Includes the earlier week-first Home plus a four-week consistency block with current-comfort setup, preview before activation, optional familiar strength, recovery spacing, saved session details, completion/undo, skip/reopen, recovery substitution, and collision-aware rescheduling. Research and execution notes are in `docs/RUNNA_DIRECTION.md`.

Passed 37 targeted training/health/routine/local-storage/context/calendar checks and local/hosted builds. Isolated 390px browser review verified save/reload, status changes, direct session details, successful rescheduling and visible collision feedback. Production verification opened the new setup flow; no plan was saved for the owner. Device persistence is verified; existing signed-in account/provider acceptance remains open. One active block only; race progression, archives and watch workout delivery are not included.

## Running welcome and voice check-in — September 28, 2026

`8c8be30` is live at https://wolverineworkout2.vercel.app (deployment `dpl_Gk7bgc7YspdPxeZu94ckvEmaRzGj`). Adds the minimal “Did you run today?” welcome, athletic typography and lime voice action, the approved Pip companion, text draft fallback, and direct training/run logging entry points. A separate authenticated Realtime WebRTC check-in uses the existing server key, explicit audio sharing, mute/end controls, captions and bounded call duration. No voice transcript or activity is saved automatically.

Four voice tests and local/hosted production builds passed. Browser review covered 390px mobile and desktop, text draft navigation, training entry and Running as the log default. A live credential-minting smoke test succeeded using the reused key, without transmitting microphone audio. Production verification confirms the new welcome and signed-out voice guidance before microphone access. A full spoken call remains untested. Hosted voice still depends on resolving the existing account-service blocker; local development is available through the existing authenticated preview wrapper. Details and limitations are in `docs/VOICE_CHECKIN.md`.
