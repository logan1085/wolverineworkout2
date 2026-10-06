# Wolverine release acceptance

Audit: October 5, 2026. Source revision: `60e5626` (feature revision `073fa07`). Production deployment: `dpl_37A6v8j2v9fjQ6wy8a4F5Yd7nKar`.

## Decision

The complete product goal is **not achieved**. Local training and UI evidence is substantial; connected coaching and real-account acceptance are still blocked, and several training workflows remain incomplete. Passing regressions must not be described as full product acceptance.

## Fresh evidence

- `node --test tests/*.test.mjs`: **164 passed, 0 failed, 0 skipped**. This executes the checked-in unit/synthetic suites, not the separate `*-api.mjs` live scripts. It covers model validation, memory/context, local storage, training/progression/adjustments, calendar, routines, assets/scenes, account/callback/recovery behavior, voice guards, Photon guards and provider connection guards. It does not contact real wearable accounts or establish real email delivery.
- `npm run docs:agent`: regenerated runtime-derived prompt and public policy artifacts with no Git changes. Public documents remain aligned with their checked-in generator.
- Live `GET /api/health/session`: `local:false`, `ai:false`, `aiStatus:authentication_failed`, `auth:false`, `authStatus:unavailable`.
- Current Git branch is pushed; the latest deployment is recorded as READY in `RELEASE_STATUS.md`. No new production deployment is needed for this documentation audit.

## Requirement audit

| Requirement | Current evidence | Completion status / missing proof |
| --- | --- | --- |
| Marathon positioning and Saywise-inspired entry | `SAYWISE_FLOW.md`, `MarathonWelcome.tsx`, live headline and prior browser review | Implemented; full new-user journey with a working cloud account unverified |
| Runna-like plan-first home and calendar | `TrainingWeek.tsx`, `TrainingPlanner.tsx`; local mobile saved-plan navigation, completion, reflection and date return verified | Implemented locally; physical-device and hosted-account acceptance open |
| A useful marathon training plan | Supported deterministic 16–24-week drafts, baseline validation, preview, explicit activation and archives; engine matrix/review plus unit suite | Narrow supported baseline range; generalized runner coverage and qualitative progression review incomplete |
| Review and adapt to everyday training | Session completion, reschedule, skip, recovery substitution, reflection, reviewable lighter-week edits | Explicit pause/unchanged-schedule review implemented; prescribed return-to-running progression, symptom escalation path and follow-on progression incomplete; explicit activity linking now implemented; automatic matching remains absent |
| Daily onboarding, habits and streaks | Routine/setup implementation and passing routine tests; earlier local persistence review | Cloud persistence and physical-device walkthrough unverified |
| AI system prompt and trustworthy replies | Marathon prompt `wolverine-health-2026-10-05.2`, 21 evaluation fixtures, context safeguards, historic output reviews | Current production authentication failure blocks new replies; local live-eval preflight also lacks its development identity. Current prompt has no fresh multi-turn output evaluation |
| Voice check-in | RunWelcome UI, ephemeral session endpoint, consent/origin tests and visible unavailable state | Working production voice session and physical microphone/keyboard behavior unverified |
| Textable agent through Photon | Webhook/consent/quota tests; user reported receiving fallback replies | Successful AI response and multi-turn delivery require repaired AI credentials; web-memory pairing is not implemented |
| Personal memory and transparency | Confirmation/edit/forget/expiry and context tests; public policy-only SOUL/MEMORY generated without diff | Real two-account isolation, account switching, deletion and cloud conflict behavior unverified |
| Garmin/Strava connection | Guarded connector implementations and synthetic checks; `../CONNECTIONS.md` | Approved app/client configuration and real lifecycle tests missing; no watch-workout delivery claim |
| Blender character/object use and choice | `.blend` source files, GLB/portrait assets, passing catalog/scene tests, prior browser character/3D review | Khronos validation now passes all nine exported GLBs with zero errors/warnings; independent visual viewer and physical GPU/touch/performance acceptance open |
| Mobile clarity and accessibility | 320px/390px reviews, keyboard focus return, labeled controls; `mobile/USAGE.md` | Real iOS/Android keyboard, large text, screen reader, safe-area and landscape checks open |
| GitHub and Vercel delivery | Feature branch pushed, production READY, live home and status endpoint reachable | Delivered; does not prove connected features work |

## Current priorities

The explicit activity link, pause/review, mile entry and manual correction workflows are implemented with local acceptance. Do not keep treating these as missing features. Their hosted-account and physical-device acceptance is still separate.

1. Resolve the pending AI credential and Supabase project decisions. Then verify cloud storage/migrations and real two-account isolation before claiming connected memory or sign-in.
2. Restore the development-only evaluation identity using an approved working key, run all 21 coaching cases, read the outputs, and verify voice and owner-authorized Photon conversation delivery. Historical captures do not validate the current prompt.
3. Verify real Garmin and eligible Strava connection lifecycles with the user's authorization. Phone/web memory pairing remains unimplemented and must verify account ownership; an allowlisted phone alone is insufficient.
4. Complete physical phone, screen-reader and GLB/GPU acceptance. Browser viewport checks and asset parsers cannot prove these.
5. Expand supported runner coverage and assess interrupted-training/follow-on progression with defensible workload reasoning and qualitative review. Do not replace this work with an untested percentage or claim medical readiness.

## External decisions and acceptance

Existing pending decisions remain required: reopen approved secure OpenAI key setup, and choose restoration/original-login access versus a dedicated replacement Supabase project. Do not provision credentials or change external accounts while those choices are unanswered. Provider configuration, real email/password tests, real device authorization and physical-phone acceptance follow those decisions. Do not substitute an unrelated database or claim that account-service availability proves row-level isolation.

The full goal remains active. This audit is evidence for selecting the next work, not permission to mark the product complete or to bypass account approval.

### Activity-link follow-up

The explicit linking work described above is now implemented and covered by six new regression cases plus local browser link/reload/unlink/relink acceptance. The complete synthetic suite passes 145 tests. Source and deployment evidence are recorded in RELEASE_STATUS.md. Real-provider and cloud-account acceptance remain separate; explicit pause and return review now have local acceptance; generalized return-to-running prescriptions remain outside the implemented scope.

### Pause and conversational entry acceptance — October 5, 2026

The first onboarding screen asks only for a marathon name; intention and optional date follow. Explicit pause stores a validated date without rescheduling or inferring inactivity. Local fictional-profile checks cover cancel, pause, reload, replacement-preview/back, reviewed resume, and preservation of completed-session reflection/activity reference. At 320px the document has no horizontal overflow; a 390px return-review screenshot is retained in workspace outputs/marathon-proof/training-pause-mobile.png. All 151 synthetic tests, typecheck and focused lint pass. Runtime prompt now instructs the agent to respect paused schedules, but fresh live AI evaluation remains blocked by credentials. This is manual schedule review, not a personalized return-to-running prescription or readiness clearance.

### Full regression and documentation reconciliation — October 5, 2026

At `60e5626`, all 164 unit/synthetic tests pass. Public policy regeneration has no diff. A fresh live status request still reports authentication_failed for AI and unavailable for account auth. README now describes the implemented marathon draft, local memory, activity correction, and current connected-feature limitations instead of the older workout-only architecture. The missing external decisions were presented again during this audit; no account or credential changes were made. This audit is progress in release evidence, not completion of the product goal.

### Independent GLB and dependency audit — October 5, 2026

All nine current catalog exports pass the pinned Khronos glTF Validator with zero errors and warnings; 54 informational findings are unused UV coordinates. `docs/studio/gltf-validation.json` records hashes and structural details. Nine existing catalog tests also pass. Blender is not installed in the current environment, so no independent visual render is claimed. Physical GPU/touch and exported appearance remain open.

Installing the dev-only validator also surfaced dependency advisories. A separate fresh `npm audit --omit=dev --json` reports 26 affected production-tree packages (10 high, 16 moderate, zero critical). This counts dependency advisories, not demonstrated runtime exploits. High findings are concentrated in legacy Mem0 dependencies and PostCSS; the tool proposes major Mem0/Next updates, which must not be applied blindly. Review reachable behavior and supported patched versions, then run appropriate compatibility/build checks before release. This is a concrete release-quality gap that can be worked on independently of account approval.

## Dependency remediation — October 5, 2026

Mem0 is pinned to 3.3.1 for the legacy workout endpoint; add now uses `userId` and search uses `filters.user_id`. An isolated test exercises the actual installed SDK serializer with synthetic responses and confirms distinct user scopes. No live Mem0 account was contacted.

Targeted npm overrides pin Next's PostCSS to 8.5.29 and OpenTelemetry core to 2.11.0, retaining Next 15 and the existing Photon adapter. Remove overrides only when upstream packages resolve patched versions without them. Production-tree npm audit: zero advisories; full tree: 11 high advisories remain in development dependencies. This is dependency metadata, not evidence of exploitability or a full security review.

Validation: 165 tests passed; TypeScript passed. Existing test-harness bindings were renamed to satisfy Next's module-variable lint rule. The Saywise-inspired welcome explanation was rendered and expanded in a clean local browser origin.

### Development dependency follow-up — October 6, 2026

Updated lockfile-only `brace-expansion` resolutions from 1.1.18 to 1.1.21 and 2.1.4 to 2.1.7 within their existing major versions. Full lint and TypeScript checks pass. Fresh runtime audit remains zero; full audit now reports ten high affected-package entries, all tracing to the single `braces <=3.0.3` advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Registry latest and advisory both show no patched braces release.

The installed path is `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`; no direct use was found in app source or checked scripts/configuration. This limits current exposure evidence to development tooling, not a proof of general immunity. Do not downgrade Next/ESLint or suppress the advisory merely to turn the count green. Revisit when a supported upstream patch is published. This tooling-only lockfile change does not alter the deployed UI.
