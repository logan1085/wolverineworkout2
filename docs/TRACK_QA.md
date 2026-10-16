# Wolverine training ground QA

## Releases

- SVG baseline published and verified: 20b4917c339e5435c350885c9540cfe54d88d42a, Vercel dpl_ofXiUprSLiFJCD94NKJma5L2vie4, https://wolverineworkout2.vercel.app.
- This increment adds an optional, real WebGL 3D stadium using the existing pinned Three.js dependency. It is not an SVG simulation of 3D. Blender is absent and was not installed.
- Earlier production rollback: dpl_HF8FaHmt7BCbyJNan2YXNgRhJyga / 0f12a46380b5d6056b80ae9c99e9dc043da0762e. The published SVG baseline is the immediate rollback target for the 3D increment.

## Architecture and limits

TrainingTrack owns selected date and uses the existing health state. TrainingWorld is lazy-loaded only after Enter 3D world. The procedural renderer builds raised track lanes, stepped seating, lights, a finish gate, seven selectable day stations, completion bars and a selected-day halo. Native day buttons and the selected workout panel remain available beside/below it. Camera rotation, zoom and overview buttons support keyboard and touch. Pointer raycasting selects the same day state; it never completes a workout or saves data.

Scheduled stations have taller columns; completed stations turn green; logged activity is a separate amber marker. Weekly bars use the existing scheduledWeekSummary, while the finish gate displays the saved race countdown. A saved race date is not a readiness prediction. The planner still explicitly distinguishes the four-week consistency block from a race-specific plan.

There are no remote assets, dependency changes, autoplay, shadow maps or perpetual animation loops. Finite 420 ms camera transitions follow selection and respect prefers-reduced-motion and an explicit camera-motion-off control. Pixel ratio is capped at 1.5 with a 1M-pixel budget. Offscreen/hidden views stop rendering. Unmount disposes geometry, textures, materials, controls, observers and the WebGL context. Unsupported WebGL, major performance caveats and context loss return to the lightweight SVG track. List view remains available.

No API, credentials, schema, cloud account or persistence model changed. Existing voice/text check-in remains available and clearly reports unavailable AI. No paid model call, real health record, migration, subscription, new account or credential change was used.

## Verification on 2026-10-16

- All 165 synthetic tests passed; typecheck, ESLint, whitespace check and production build passed.
- Initial home route remains about 63.1 kB / 209 kB first-load JS; the Three.js world is an explicit lazy load.
- Live SVG release: clean first-use goal setup, explicit plan preview/activation, workout completion, cancellation of an unsaved log, one saved synthetic 25-minute/3-km run, reload persistence, day-selection Back/Forward, desktop/mobile screenshots. Public alias and commit metadata matched the release.
- Local real 3D: WebGL canvas visibly rendered the stadium on desktop and 390px mobile. Synthetic race goal and plan activation updated the scene. Opening Friday's station launched the existing 20-minute walk/jog workout. Completion updated weekly progress to 1/1 and the station color.
- ArrowRight moved focus Friday to Saturday; Enter selected Saturday and showed its recovery day. Rotation, zoom, overview and camera-motion-off controls worked. No console errors/warnings were observed during this pass.
- Switching to lightweight track removed the canvas and restored SVG. List view retained all seven native day controls. Reload retained the synthetic goal, plan and completed session, with lightweight view as the initial low-power default.
- Mobile 390 CSS px: document width 382, no horizontal overflow; canvas 340 x 360. Native camera/day controls remain available.

Physical-device multitouch, forced GPU context loss and OS reduced-motion emulation were not performed. These paths were reviewed in code; do not claim device-lab coverage. Earlier OpenAI authentication and Supabase cloud-service issues remain unresolved and separate from local planner functionality.

Final deployment identifiers and live 3D screenshots are recorded in the release report in output/playwright after publication.
