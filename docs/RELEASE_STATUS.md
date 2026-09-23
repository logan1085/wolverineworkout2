# Wolverine release status

Latest visual/asset/build verification: September 23, 2026. The account and device acceptance requirements below remain open; see the dated release entries for the verified revisions.

**Not ready to claim a complete connected health product.** The current preview supports local check-ins, activity records, device-local memory, characters, 3D objects and the implemented UI. Its configured account service is unavailable, and neither wearable integration is configured. A passing build does not remove those blockers.

## Requirement evidence

| Requested outcome | Current evidence | Remaining acceptance |
| --- | --- | --- |
| Refined mobile app | Browser review at 390×844; Today, agent, companion selection, modal keyboard boundaries and focus return; latest production build passed | Physical iOS/Android keyboard, large text, landscape and home-screen walkthrough in `docs/mobile/USAGE.md` |
| Personal health agent | Live fictional HTTP suite; 14 targeted checks pass on prompt `wolverine-health-2026-09-22.2`; outputs and qualitative review retained | Repeated/multi-turn review; profile available-time wording remains imperfect; no clinical validation claimed |
| Inspectable memory | Local confirmed facts and chat history; edit/forget/expiry flows; bounded context brief and source discrepancies; relevant unit tests | Real two-account isolation, deployed migrations/RLS, cross-tab and account-switch acceptance |
| Public soul and memory documents | Runtime-generated `public/SOUL.md`, policy-only `public/MEMORY.md`, `/transparency` | Continue regeneration when behavior changes; never publish personal health records |
| Blender object catalog throughout app | Editable Blender sources, GLB models, portrait assets, integrated activity/journal/Today cards and studio | Independent GLB viewer and physical touch/GPU checks |
| Choose a character | Moss, Sunny, Pebble; saved per-device/account scope; selection verified across Today/chat and reload | Cloud preference sync is not implemented or claimed |
| Smooth 3D experience | Poster visible before chunk/model; successful renderer handoff and rotation verified; retry/error handling implemented | GPU loss and network-failure fault testing on phones; no performance score claimed |
| Garmin account connection | OAuth/import/encrypted-token implementation, synthetic tests and HTTP guards | Approved provider configuration, restored Supabase, migrations, real connect/sync/refresh/disconnect |
| Strava account connection | Separate owner-only live connector implementation and guards | Eligible registered client, configured tools/credentials and real lifecycle verification; not general multi-user availability |
| GitHub and Vercel delivery | `feat/personal-health-agent` pushed; latest Preview Ready; stable preview alias below | Production promotion follows connected-account and device acceptance |

## Current external evidence

- Hosted `/api/health/session` returned `local:false`, `ai:true`, `auth:false`, `authStatus:"unavailable"` during this audit.
- Vercel Preview environment inventory contains only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENAI_API_KEY`. No credential values were printed. Garmin, Strava, server service-role and connector-encryption configuration are absent.
- Earlier configured-host DNS and auth-settings checks failed with `ENOTFOUND`; this audit confirms account unavailability persists. No database records have been read or changed.
- The Supabase dashboard currently presents a sign-in screen. No authenticated administrative session is available to inspect whether Wolverine's project can be restored.
- All 53 current unit tests pass. The last build passes lint, types and compilation with the existing Supabase realtime dynamic-dependency warning.

## Unblocking sequence

1. The project owner signs into the existing Supabase dashboard. Inspect the configured Wolverine project, restore it if possible, or deliberately select its replacement. Do not substitute an unrelated database.
2. Configure the approved project and secrets through the provider dashboards, apply the three checked-in migrations, and verify sign-in plus isolation with two dedicated test accounts.
3. Configure and authorize an eligible Garmin app/account (or the supported personal Strava flow). Follow `../CONNECTIONS.md`; do not advertise a connector merely because its code exists.
4. Complete the secure-deployment physical-phone checklist, including failure recovery and keyboard use. Local development authentication must remain loopback-only.
5. Resolve remaining evaluation findings, review the release evidence and promote the verified revision to production.

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
