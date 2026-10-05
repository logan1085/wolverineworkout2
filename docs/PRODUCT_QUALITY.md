# Wolverine product quality

Updated September 20, 2026. This is an evidence-based improvement backlog, not a claim that every dimension is production-ready.

## Product bar

A person can check in, understand what informed a response, choose one manageable next step, and return tomorrow without losing control of their data. Creative tools stay secondary to this daily health loop.

| Dimension | Working now | Next acceptance criterion |
| --- | --- | --- |
| Daily usefulness | Check-ins, rules-based briefing, contextual chat, activities | Walk through a week of sparse and complete records; every suggestion identifies its evidence and uncertainty. |
| Agent quality | Versioned runtime prompt, 12 synthetic evaluation scenarios, reviewed outputs | Expand evaluations for contradictory facts, missing dates, edited memories and repeated questions; require human review of advice quality, not just keyword checks. |
| Memory | Explicit confirmation, editing, expiry, export, forgetting, account revision checks | Two real accounts and two tabs must never restore each other’s facts or deleted conversations. Validate against deployed Supabase, beyond mocks. |
| Mobile usability | Visible-viewport composer, touch-sized controls, bottom sheets, home-screen metadata | Complete the iOS/Android checklist in mobile/USAGE.md on a secure deployment, with keyboard, zoom and large text. |
| Recovery | Inline chat errors, offline indication, restored drafts, stop-waiting action | Exercise disconnect, slow response, memory conflict, retry and account switch during requests. No duplicate or orphan messages. Stop does not promise cancellation at the provider. |
| Creative continuity | Real 3D geometry, bounded scene schema, GLB/JSON download, JSON reopen, undo/redo | Verify GLB in an independent viewer and touch orbit on both phone platforms. Add a saved gallery only with an explicit storage design. |
| Performance | 3D code loads on demand, capped resolution, no continuous render loop | Measure actual mobile loading and frame response; check GPU cleanup after repeated open/close. No performance score claimed without measurement. |
| Accessibility | Labeled inputs, native dialogs, keyboard 3D controls, reduced motion | Screen-reader walkthrough, focus return and contrast audit on the rendered app. |
| Integrations | Garmin OAuth/sync and owner-only Strava MCP implementations with guards | Configure approved credentials and exercise connect, refresh, sync, disconnect and expired authorization with a real account. Strava is not yet a general multi-user connection. |
| Privacy | Health sharing consent, separate sketch context, public policy files, scoped storage | Deployed isolation/deletion verification and documented provider retention. Public MEMORY.md must remain policy, never user facts. |
| Trust | Public SOUL.md generated from runtime; sample data is labeled | Keep displayed capability claims aligned with live configuration; never imply that a missing connector has synced. |
| Release operations | Repeatable checks and local preview | Secure authentication, migrations, secrets, quota behavior, production error reporting without health payloads, rollback procedure and deployed smoke checks. |

## This improvement pass

- Fixed memory-conflict responses leaving an unanswered user turn behind.
- Added stop-waiting with draft restoration and stale-response suppression.
- Moved chat errors beside the composer and blocked sending while the browser reports offline. No offline AI or background retry is implied.
- Kept the creative launcher out of the mobile keyboard’s way.
- Added validated scene JSON reopening and one-step undo/redo. Inputs freeze during generation so results stay tied to the submitted brief.

## Release order

1. Configure a secure preview with real account storage and complete identity/isolation checks.
2. Perform physical device and accessibility acceptance checks; fix failures before adding more features.
3. Connect one real Garmin account and the authorized Strava owner; verify lifecycle behavior.
4. Review multi-day agent outputs against actual user needs with explicit consent for any personal data used.
5. Publish the validated revision and log the deployment. Local builds are not public ships.

## Hosted account audit — September 22

Rechecked the configured Vercel Preview Supabase host: DNS lookup and an auth-settings request both failed with ENOTFOUND. No database records were read or changed. Provider credentials were kept out of output and the temporary ignored environment file was removed after the check. Garmin/Strava configuration and database migration validation remain open; the account endpoint availability probe does not prove either.

The session endpoint now reports actual bounded authentication-service reachability, not simply the presence of environment variables. It returns ready, unavailable or not_configured, caches results for 15 seconds and coalesces simultaneous checks. Unavailable accounts show a retryable state instead of a working-looking sign-in form; local data tools remain accessible. A healthy auth endpoint still needs real account/migration/isolation testing. The user has been asked to restore the existing project or identify the active Wolverine database; do not replace it with an unrelated project.

### Visual hierarchy refinement — September 22

- Replaced the uniform green dashboard treatment with a warm paper briefing, quieter forest surfaces, consistent stroke navigation icons, and a more restrained button hierarchy.
- Moved health metrics ahead of optional object cards. The daily briefing keeps its full explanation under an accessible disclosure; sample data remains explicitly labelled.
- Reduced mobile header density and rebuilt companion controls so the preview and all three character choices fit together at 390 × 844. Rotation/zoom retain named 44px controls and keyboard access.
- Browser-reviewed Today at 390 × 844 and 1440 × 1000, the mobile companion dialog, and mobile Agent. No horizontal desktop overflow or browser console errors observed. These are browser viewport checks, not physical-device or keyboard testing.
- Validation: 49 unit tests, lint, TypeScript, and production build. Supabase dependency build warning remains; hosted account reachability is a separate unresolved service issue.

### First-use and save recovery — September 22

- A fresh browser now starts with its personal empty dashboard. Sample records remain opt-in and labelled; existing explicit view preferences are preserved. The empty briefing opens the first check-in directly.
- New check-ins require explicit sleep, energy, stress and soreness values. Existing same-day answers remain editable. Storage destination and the separation from sample data are explained in the form.
- Save errors appear inside the open dialog. The check-in fields and dialog dismissal are disabled while a save is pending. Successful saves remember the personal view for reloads.
- Failed history loads now expose a retry action and block saves until a successful load, protecting records from being replaced by the temporary empty state.
- Browser evidence: isolated localhost origin (separate from the user's 127.0.0.1 storage) showed the personal empty dashboard; opening its first-check-in action showed four blank required fields. Attempting an empty save kept the dialog open with native missing-value validation. No synthetic health records were saved. Cloud persistence and injected storage/network failures still require dedicated runtime acceptance.

### Dialog keyboard acceptance — September 22

- Extracted the shared native dialog into `src/components/health/Modal.tsx` with explicit trigger restoration. Pointer activation is tracked because some browsers do not focus clicked buttons; transitions from More retain the stable menu trigger.
- Tab and Shift+Tab wrap over currently enabled, rendered controls. Busy dialogs expose `aria-busy` and retain focus even when controls are disabled. Escape and backdrop dismissal remain blocked during saves.
- Backdrop dismissal now requires both a press and release outside the dialog bounds. Interior padding and drags beginning inside no longer count as backdrop clicks.
- Browser verification with the current bundle: Escape and the Close button return focus to Daily check-in; reverse-tab from Close lands on Save my check-in; forward-tab from Save lands on Close; More → Choose character keeps exactly one open dialog with focus inside, then Escape returns to More.
- Native screen-reader and physical-device testing remain open. The pointer-boundary and busy-state guards were inspected in code; those specific branches were not fault-injected in this browser pass.

### Daily evidence and calendar trends — September 22

- Confirmed that today's primary metric values already require today's date. Corrected the remaining attribution errors: missing Garmin sleep is labelled unknown; wearable-only low sleep is attributed to Garmin instead of a nonexistent check-in; stress appears among the inputs when a check-in shapes the plan.
- A steps-only record no longer implies the app has enough current sleep/wellbeing context for its daily direction. Explicit self-reported sleep continues to take precedence over wearable sleep, matching the primary card.
- Spark bars now use seven calendar days with missing days preserved, excluding stale and future records. Zero and absent values no longer draw positive-height bars. These remain decorative summaries, not clinical recovery scores.
- Four regression cases passed alongside the existing eight health tests, covering stale dates, wearable-only evidence, partial measurements, stress attribution, zero/missing values and calendar boundaries. The expanded evidence disclosure was also checked in the browser using labelled sample data, then returned to the personal view.

### Companion loading and recovery — September 22

- Added a shared poster-first asset preview for the daily character and character picker. The local Blender portrait is available before the renderer chunk loads; its reserved frame remains while the interactive model loads. The poster hides only after a successful render.
- Model-load and WebGL-context failures restore the poster and expose Retry 3D. Rotation/zoom controls disable while loading or unavailable. Fallback copy no longer promises downloads that are absent from the compact/picker UI.
- Browser evidence: reload exposed the Moss preview before the viewer mounted; the completed view then contained a canvas, marked itself ready, hid the poster and preserved the 112px mobile frame. The picker rendered correctly and Rotate left produced no console error.
- Error branches were reviewed in code. GPU-context-loss and failed-network recovery have not yet been exercised on a physical phone; no mobile performance score is claimed.

### Live agent behavior review — September 22

Ran three sequential synthetic HTTP evaluation passes against the current runtime. Added conflicting-sleep and incomplete-week cases and strengthened checks after qualitative review found failures that prior regexes missed. The final `wolverine-health-2026-09-22.2` run passes 14 targeted checks; all outputs were read and a remaining profile-time-versus-goal wording issue is documented in `evals/results/REVIEW.md`. Prior failing captures are retained. This is evidence of specific improvements, not a clinical or production-readiness certification. Runtime prompt, public SOUL/MEMORY artifacts and generated prompt documentation are aligned.

### Resumed launch audit — September 25

The green-theme revision passed a 390×844 browser review of Today, check-in, and More; see mobile/USAGE.md. A fresh authenticated Vercel CLI request to the deployed `/api/health/session` returned `local:false, ai:true, auth:false, authStatus:"unavailable"`. Therefore hosted identity/isolation and wearable lifecycle acceptance remain unproven. Physical iPhone/Android and screen-reader acceptance also remain pending. The preview build is Ready, but the full product bar is not yet met.

## Routine integration audit — September 28

Previous goal turn: progress (onboarding, streaks and Blender revisions shipped). This pass inspected current runtime and code instead of treating that ship as complete-product acceptance. Production account status still returns `auth:false, authStatus:"unavailable"`; the owner has been asked to restore/access the existing Wolverine Supabase project. No replacement account, provider configuration or physical-device verification is implied.

Found and fixed a disagreement between the routine and briefing: the routine previously ignored high stress and short current sleep. Both now share the same pacing rule, including explicit self-reported sleep precedence and stale-date exclusion. Wind-down duration respects a five-minute preference. Onboarding keeps existing time choices, blocks all editing/dismissal while saving, and moves focus to the new heading on each step. The Home calendar follows the current local day until a history day is explicitly selected; its check-in action waits for history loading to finish.

The full product remains unproven: real identity/isolation, Garmin/Strava lifecycle acceptance, physical mobile behavior, accessibility and qualitative multi-day agent review remain open. The release-status summary was updated to distinguish authorized production publishing from completion of these requirements.

## Local history consistency — September 28

Found that health history (unlike memory) had no cross-tab refresh or stale-write guard. Local saves and deletes now compare the exact loaded snapshot before changing storage, under a shared Web Lock when the browser supports it. Storage/focus events refresh idle views; open forms retain their original snapshot and reject conflicting saves with a recovery message. Closing the form refreshes the current state. Unsupported Web Locks environments retain the comparison guard but do not provide atomic inter-tab locking. Storage errors do not advance the in-memory snapshot. Identity changes close old forms and late save/sync results cannot replace the new owner's displayed history.

Browser evidence on isolated localhost tabs: one tab opened routine editing, the second completed reflection, and the first tab's save was rejected. Dismissing the form displayed both completed tasks. Undo in the second tab updated the idle first tab to one completed task without reloading. No owner preferences were modified. Three storage tests cover stale save/delete rejection, validated writes and quota/corruption failure. Real cloud-account isolation and slow identity-switch testing remain unverified because account service availability is unresolved.

## Connected-product handoff — September 28

The preceding goal turn made progress by shipping cross-tab protection. The completion audit remains negative: production `/api/health/session` still returns `local:false, ai:true, auth:false, authStatus:"unavailable"`, and a fresh visit to the existing Supabase dashboard redirects to its sign-in page. No administrative session is available. GitHub's remote feature branch matches the latest release-log commit, and the production deployment remains Ready.

The same account-access blocker has persisted through the routine audit, cross-tab pass and this revalidation. The broader goal is blocked on access to the existing Wolverine Supabase project, not complete. Next owner action: sign into that project and restore its availability or identify the approved active replacement. Do not send secrets in chat or substitute an unrelated project. Once accessible: verify migrations and real account isolation, then configure/authorize Garmin or the supported Strava flow and exercise their full lifecycle. Physical iOS/Android and accessibility acceptance remains required separately. No new account, database, provider app or billing resource was created during this audit.

## Marathon experience audit — October 5, 2026

The Saywise-inspired entry is live, but the polished-app goal is not complete. Current evidence and remaining acceptance:

- Race entry and intention save through validated profile storage; browser verified planner handoff, reload and cancel. Returning-runner edits now prefill both values, including legacy “Training for…” goals, and loading no longer flashes the empty intake. Save submission is guarded against duplicates; pending state coordinates with dashboard writes. Network failure does not falsely assert that the server saved nothing.
- The training engine remains a four-week steady consistency block. Full marathon progression, race dates, tapering and reviewed adaptation are missing. Marketing is positioning, not proof of this capability.
- Photon transport and replies reached the owner's phone. OpenAI rejected the existing production key with `invalid_api_key` (401). New-key picker selection completed, but destination approval was declined and no replacement was created. Live generated coaching remains blocked.
- Account persistence/isolation, real Garmin/Strava acceptance and physical iOS/Android testing are still unverified. See the dimension table above; local storage tests do not establish cloud-account readiness.

Next acceptance: complete safe credential setup after destination approval; verify a real generated reply; implement and review race-specific planning; exercise signed-in storage and integrations with the intended accounts. Keep the overall goal active.

### Race-date continuity — October 5

The previous turn made progress by shipping reliable race-goal editing. This pass adds an optional structured race date to validated profile storage, onboarding review, the returning-runner countdown and the planner. Calendar arithmetic handles DST, race day and past dates without negative countdowns. No race date or year is inferred for the owner. Changing the free-text goal in profile clears the associated date with an explicit explanation.

Seventeen targeted tests and TypeScript validation passed. Isolated localhost browser acceptance verified date selection, confirmation, save, planner handoff, reload, edit prefill and clearing the date; 390px visual review passed. Browser testing caught and fixed date input event handling before shipping. Tests used synthetic local preferences only. This is race context, not race-specific progression: the existing steady four-week plan does not adapt or taper to the date. Full planning, credentials, hosted accounts and wearable/device acceptance remain open.

### Running starting point — October 5

Previous goal turn: progress (race-date continuity deployed and verified). Research and source links are now captured in MARATHON_PLANNING.md, including the remaining race-specific engine and acceptance work. Added a two-step running assessment in training: average weekly distance, typical running days and longest run over the last four completed weeks. Miles/kilometres convert to validated canonical kilometres. Missing inputs stay missing, zero running is supported, and the dated estimate is flagged for review after four weeks. Updating context does not regenerate workouts.

32 targeted assessment/training/storage/health/context checks and TypeScript validation passed. Browser acceptance on isolated local data verified required fields, contradictory-distance rejection with retained answers, save, reload, edit, unit conversion and cancellation. 390px visual review caught and corrected inherited low-contrast form styling; 320px review showed no page overflow. Synthetic inputs only, no owner records changed. Full marathon planning is still not implemented, and hosted identity, AI credentials, wearable acceptance and physical-device review remain open.

### Training block lifecycle — October 5

Previous goal turn: progress (running assessment shipped). Current block replacement now requires a preview and explicit activation. One profile save archives the previous block, including every session/status, and activates the replacement. Cancellation does not change the active plan. History is read-only, survives reload and is kept separate from the active calendar and recorded activity. The storage limit is 52 archived blocks; reaching it rejects replacement without trimming history. Routine agent context includes the active block and archive count, not archive contents; public memory documentation is aligned.

33 targeted training/storage/health/context tests and TypeScript validation passed. Isolated local browser testing verified creation, completion, cancel, replacement, archived completion, read-only details and persistence after reload. Mobile review verified the archive selector, statuses and progress bar at 390px. No owner data was changed. This fixes the one-block dead end and supplies history preservation for future marathon revisions, but the progressive engine and remaining AI/account/integration/device acceptance are still open.

### Marathon progression engine — October 5 (not activated)

Previous goal turn: progress (training replacement/history shipped). Implemented an original offline draft generator with versioned inputs, distance-based sessions, foundation/build/recovery/taper/race phases, explicit support errors and separate race distance. The first qualitative output review exposed early peak plateaus in longer preparations; revised growth distribution and a regression test address that. Nine synthetic workload profiles are captured in evals/results/marathon-draft-review.json, with full assumptions and remaining integration in MARATHON_PLANNING.md.

46 combined tests and TypeScript validation passed, including a 63-scenario engine matrix. No deployed UI or owner training data changed. This is concrete engine work toward the marathon requirement, not completion of that requirement: active schema/calendar/preview integration, feedback/adaptation, broader supported inputs and qualitative acceptance are still required. AI credentials, hosted identities/integrations and physical-device acceptance remain open as before.

### Marathon preview integration — October 5

Previous goal turn: progress (draft generator and offline review committed). The app now exposes the draft through Training → Marathon preview: explicit race/day choices, compatible week count, support explanations, weekly-distance chart and focused-week run/rest detail. Race distance is separate, unit switching is display-only, and the active block remains unchanged. The preview is explicitly ephemeral and inactive.

28 training tests and TypeScript validation passed. Local browser evidence covers unsupported baseline and short date-window rejection, a synthetic supported 20-week preview, race-week totals, miles/km switching, retained edit choices, unchanged active block, 390px visual review and 320px dialog overflow check. No owner records were edited. Active-plan schema/calendar integration and weekly adaptation remain required; preview availability does not complete the marathon feature or the overall app goal.

## October 5 — saved marathon flow

Saywise's single promise and short personal setup inform the marathon flow: race → recent running → review → explicit activation → today's session. The app uses “Your personal trainer for your marathon.” Source: https://saywise.com/ (reviewed October 5).

Distance-based marathon activation, archived prior plans, focused weekly details and calendar links now work together. 51 tests and typecheck pass. Automatic weekly adaptation, broader baseline coverage, working AI credentials, hosted identity/integration acceptance and physical-device testing remain open.

## October 5 — returning-runner home

Previous goal turn: progress (saved marathon plans shipped). Returning runners now see a compact race header/countdown, with the home calendar before the voice check-in in DOM and visual order. The full introduction remains available to new users and during goal editing. Duplicate goal copy and a redundant plan CTA were removed; saved race details and cancel/focus behavior remain intact. Updated onboarding copy describes the available plan choice instead of implying only a four-week block.

Local browser review covered 390px rendering, 320px horizontal bounds, prefilled goal editing/cancel with focus restoration, and direct calendar-to-completed-session navigation. Synthetic local data only. This improves daily usability, but automatic adaptation, supported-runner breadth, live AI credentials and account/integration/device acceptance remain open.

## October 5 — focused session detail

Previous goal turn: progress (returning-runner home shipped). Calendar and plan session links now open a focused detail view with date, distance/time, status, instructions and actions. Returning to the plan restores focus to the selected run. Future completion has an explicit explanation; archived sessions remain read-only and unsaved previews are labelled.

TypeScript and focused lint passed. Browser acceptance on isolated synthetic data covered direct calendar entry, completion/reopen, return focus, future completion disabled, collision rejection without changing the scheduled run, archived legacy details without mutation controls, 390px visual review and 320px overflow bounds. Automatic adaptation, runner coverage, working AI credentials and hosted account/integration/device acceptance remain open.

## October 5 — session reflections

Previous goal turn: progress (focused workout view shipped). Completed sessions now support an optional perceived-effort choice and a 280-character note, with edit/remove controls and an update date. Reflections persist with legacy and marathon plans and their archives. They are self-reports available in active-plan context, not wearable observations or confirmed durable memory. Public memory policy and UI disclosure reflect this. Reopening removes the reflection with an inline explanation; removing a reflection leaves completion intact.

53 training/health/storage/context tests passed, including feedback validation, storage round-trip, archive retention, unfinished-session rejection and clearing behavior. Typecheck and focused lint passed. Synthetic local browser review covered save, reload, edit prefill, remove without changing completion, add again and 390px rendering. Automatic weekly adjustment, broader runner support, AI credential repair and hosted account/integration/device acceptance remain open.

## October 5 — reviewable lighter weeks

Previous goal turn: progress (session reflections shipped). Active marathon weeks now offer explicit shorter-target previews and a restoration preview. Completed work and feedback, race day and later weeks are preserved. Original distance blueprints remain available; validated adjustment records support persistence and archiving. No automatic changes follow subjective feedback.

38 training tests and typecheck/focused lint passed. Local synthetic browser acceptance: cancel unchanged, explicit apply, reload persistence, original-target restoration, 390px change-list review and 320px overflow bounds. New previews are invalidated by plan/date changes. Automatic follow-on adaptation, interrupted training, broader runner support, AI credentials and hosted account/integration/device acceptance remain open.
