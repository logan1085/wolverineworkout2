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
