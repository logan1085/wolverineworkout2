# Wolverine release acceptance

Audit: October 5, 2026. Source revision: `9e34cc8` (feature revision `ebf59a5`). Production deployment: `dpl_6aoQNx2SoBVgbsVQxA1d35yjb3y4`.

## Decision

The complete product goal is **not achieved**. Local training and UI evidence is substantial; connected coaching and real-account acceptance are still blocked, and several training workflows remain incomplete. Passing regressions must not be described as full product acceptance.

## Fresh evidence

- `node --test tests/*.test.mjs`: **139 passed, 0 failed, 0 skipped**. This executes the checked-in unit/synthetic suites, not the separate `*-api.mjs` live scripts. It covers model validation, memory/context, local storage, training/progression/adjustments, calendar, routines, assets/scenes, account/callback/recovery behavior, voice guards, Photon guards and provider connection guards. It does not contact real wearable accounts or establish real email delivery.
- `npm run docs:agent`: regenerated runtime-derived prompt and public policy artifacts with no Git changes. Public documents remain aligned with their checked-in generator.
- Live `GET /api/health/session`: `local:false`, `ai:false`, `aiStatus:authentication_failed`, `auth:false`, `authStatus:unavailable`.
- Current Git branch is pushed; the latest deployment is recorded as READY in `RELEASE_STATUS.md`. No new production deployment is needed for this documentation audit.

## Requirement audit

| Requirement | Current evidence | Completion status / missing proof |
| --- | --- | --- |
| Marathon positioning and Saywise-inspired entry | `SAYWISE_FLOW.md`, `MarathonWelcome.tsx`, live headline and prior browser review | Implemented; full new-user journey with a working cloud account unverified |
| Runna-like plan-first home and calendar | `TrainingWeek.tsx`, `TrainingPlanner.tsx`; local mobile saved-plan navigation, completion, reflection and date return verified | Implemented locally; physical-device and hosted-account acceptance open |
| A useful marathon training plan | Supported deterministic 16–24-week drafts, baseline validation, preview, explicit activation and archives; engine matrix/review plus unit suite | Narrow supported baseline range; generalized runner coverage and qualitative progression review incomplete |
| Review and adapt to everyday training | Session completion, reschedule, skip, recovery substitution, reflection, reviewable lighter-week edits | Interrupted-training handling, symptom escalation path and follow-on progression incomplete; explicit activity linking now implemented; automatic matching remains absent |
| Daily onboarding, habits and streaks | Routine/setup implementation and passing routine tests; earlier local persistence review | Cloud persistence and physical-device walkthrough unverified |
| AI system prompt and trustworthy replies | Runtime-derived public soul, context safeguards, historic synthetic output reviews | Current production authentication failure blocks new replies and fresh multi-turn evaluation |
| Voice check-in | RunWelcome UI, ephemeral session endpoint, consent/origin tests and visible unavailable state | Working production voice session and physical microphone/keyboard behavior unverified |
| Textable agent through Photon | Webhook/consent/quota tests; user reported receiving fallback replies | Successful AI response and multi-turn delivery require repaired AI credentials; web-memory pairing is not implemented |
| Personal memory and transparency | Confirmation/edit/forget/expiry and context tests; public policy-only SOUL/MEMORY generated without diff | Real two-account isolation, account switching, deletion and cloud conflict behavior unverified |
| Garmin/Strava connection | Guarded connector implementations and synthetic checks; `CONNECTIONS.md` | Approved app/client configuration and real lifecycle tests missing; no watch-workout delivery claim |
| Blender character/object use and choice | `.blend` source files, GLB/portrait assets, passing catalog/scene tests, prior browser character/3D review | Independent GLB viewer and physical GPU/touch/performance acceptance open |
| Mobile clarity and accessibility | 320px/390px reviews, keyboard focus return, labeled controls; `mobile/USAGE.md` | Real iOS/Android keyboard, large text, screen reader, safe-area and landscape checks open |
| GitHub and Vercel delivery | Feature branch pushed, production READY, live home and status endpoint reachable | Delivered; does not prove connected features work |

## Implementation priority after the audit

Close the gap between completing a planned run and recording the actual run. Today those are deliberately separate, which avoids fabricated distance/time but makes the daily flow repetitive. A reviewable, explicit link between an existing recorded activity and a planned session should preserve actual values, avoid duplicate matching, survive export/import, handle edits/deletion, and never infer a match merely from the same date. Do not silently migrate or manufacture activity records. Build against fictional local data first; cloud/provider matching must retain its own acceptance gate.

Then address a user's explicit report of time away: preserve completed work and offer a reviewed restart/pause decision rather than compressing missed sessions. Absence of logs alone is not evidence that the runner stopped training. New workload rules require supported-input reasoning and qualitative review; an untested percentage is not a safety guarantee.

## External decisions and acceptance

Existing pending decisions remain required: reopen approved secure OpenAI key setup, and choose restoration/original-login access versus a dedicated replacement Supabase project. Do not provision credentials or change external accounts while those choices are unanswered. Provider configuration, real email/password tests, real device authorization and physical-phone acceptance follow those decisions. Do not substitute an unrelated database or claim that account-service availability proves row-level isolation.

The full goal remains active. This audit is evidence for selecting the next work, not permission to mark the product complete or to bypass account approval.

### Activity-link follow-up

The explicit linking work described above is now implemented and covered by six new regression cases plus local browser link/reload/unlink/relink acceptance. The complete synthetic suite passes 145 tests. Source and deployment evidence are recorded in RELEASE_STATUS.md. Real-provider and cloud-account acceptance remain separate; interrupted-training handling is the next unimplemented training workflow.
