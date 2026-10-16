# Interactive training track

Verified 2026-10-16 with synthetic data on loopback only.

## Implementation

The home page uses a rust-colored SVG running track as a weekly calendar. Each station is a native button for a day. The adjacent panel opens the existing workout dialog, shows separate activity records, and logs runs through the existing validated local/cloud save path. The full planner and goal editor remain available. No schema, credential, provider or API changes were made.

The race panel shows the saved countdown and jumps to race week. A saved race date is explicitly distinguished from a scheduled workout or readiness prediction. Weekly completed sessions, all-time recorded runs and distance use existing persisted state, not an animation or fabricated progress score.

The same controls work in list view. Arrow keys move day focus; Enter activates. Native buttons remain in normal tab order. Selection uses the URL's trackDay parameter and browser history. Main navigation now also honors Back/Forward.

Blender was not found on PATH, in /Applications, or in the checked local application/tool directories. Existing Blender source assets were preserved. No software was installed. This implementation uses inline SVG and HTML, with no WebGL context, new runtime dependency, external texture, render loop or new animation. Reduced-motion styles suppress inherited transitions. The smallest layout omits the infield decoration while keeping a readable progress summary.

## Verified checks

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `SKIP_ENV_CHECK=1 npm run build`: passed, including the final edits. Home route 62.4 kB; first-load JS 208 kB. The bypass is for a credential-free LOCAL build only, not a production deployment prescription.
- 67 tests passed across training, marathon goal, running baseline, marathon progression/training, training/activity linking, pause, weekly summaries, local storage, distance and activity editing.
- Browser: empty first-use state displayed a goal setup action and separate plan entry.
- Cancelled a partially entered synthetic run. Reopening showed a fresh empty form and no saved activity.
- Saved `Synthetic track QA run`, 25 minutes, 3 km. Exactly one record appeared and the totals changed to one run / 3 km.
- Reload preserved that activity. A later production-server restart and reload preserved the run, race goal, plan and completion.
- Saved `Synthetic Spring Marathon`, April 18, 2027. The existing setup opened the planner without using AI.
- Previewed and explicitly activated the existing four-week consistency block. It accurately stated that the block does not adapt to the race date or include a taper.
- Open workout on today's station opened the correct 20-minute walk/jog instructions.
- Mark completed changed weekly progress to 1 of 1, independently of the logged activity. Reopening showed Completed.
- Next week opened October 23. Browser Back restored October 16 and Forward restored October 23. Back to today restored the completed workout.
- ArrowRight from Friday moved focus to Saturday; the visible focus ring was distinct. Activation and plan flows also worked with Enter.
- List view replaced the oval with conventional day controls without changing saved data.
- Go to race week reached April 18 and showed the saved race date, with no invented scheduled workout.
- Mobile CSS viewport 320: document content width 312, no horizontal overflow. Also inspected a 487 CSS pixel mobile layout. Narrow infield overlap found and fixed.
- Desktop CSS viewport 1440: document content width 1440, no horizontal overflow. Day targets approximately 66 x 74 px. Small-screen CSS targets at least 44 x 48 px.
- Client error log inspection returned no errors during the initial interaction pass.
- Browser viewport override reset; local preview tab retained. Other tasks' tabs were not operated.

Screenshots: `output/playwright/track-desktop.jpg` and `output/playwright/track-mobile.jpg`. Screenshots contain synthetic data only. A fixed mobile navigation bar may appear partway through a full-page screenshot; it is a viewport-fixed control while scrolling.

## Limits and publication gate

No physical-device touch test or reduced-motion media emulation was performed. Touch-size/layout and reduced-motion behavior were reviewed in CSS. Browser control intermittently timed out; state was inspected before retrying. A final extra cross-tab navigation-history check timed out before dispatch; day-selection Back/Forward was positively verified.

Production was rechecked in Vercel: team `logan-horowitzs-projects`, account `zev1085-2681`, project `wolverineworkout2`, deployment `HF8FaHmt7BCbyJNan2YXNgRhJyga`, Ready, source `0f12a46380b5d6056b80ae9c99e9dc043da0762e`. It still says automatic production deployments target main.

GitHub remote refs were read successfully: feat/personal-health-agent is `bb57e78e0cbf2eac7c14fb65c473722eeb001832`; main is `9bc8fef887f537c38ff363a8b2126375dfa4dd92`. This work is based on bb57e78 in an isolated clone, preserving the original checkout. No push, promotion or deployment occurred. The local preview deliberately has no cloud/AI credentials; it must not be published as a substitute for the configured deployment.

Previously reported OpenAI 401 and Supabase service issues were not repaired or concealed. Cloud account, paid inference, real health-data and provider credential verification remain outside this local QA.

## Preview

The verified production build is running at http://127.0.0.1:4193.
To restart from this clone after the server stops:

```
SKIP_ENV_CHECK=1 npm run build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 4193
```

This clone currently reuses the original checkout's installed node_modules via a symlink. No dependency versions or lockfile were changed. A standalone environment should install from the existing lockfile before building.
