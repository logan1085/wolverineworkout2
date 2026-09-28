# Plan-first Wolverine

Keep the approved sprout companion and green visual identity. Borrow Runna's product clarity: one goal, today's useful actions, a readable week, and progress grounded in recorded activity.

Reference: https://support.runna.com/en/articles/10473504-your-quick-guide-to-navigating-the-runna-app
Reference: https://support.runna.com/en/articles/15443877-how-to-create-a-training-plan-in-runna

## Implemented first pass

- Home begins with the current Monday–Sunday week and the user's existing goal.
- Selecting a day shows recorded sessions, duration and distance where available.
- Weekly totals include recorded activity through today; future days are explicitly unscheduled.
- Today's log action opens the existing activity form and uses existing persistence.
- Existing routine setup and daily actions sit before the companion briefing.
- Full calendar and object focus space remain available in expandable sections.
- No changes to approved companion geometry, provider connections, data storage or health-agent prompts.

## Next product decisions and work

The current routine is not a progressive running plan. Before building that layer, settle whether the product is running-first, running plus strength/recovery, or broader health.

A real training-plan release needs explicit experience, current volume, available training days, goal/date, generated session prescriptions, rescheduling, completion matching, recovery adjustments and tests for plan changes. Do not relabel current activity history as a scheduled plan. Garmin/Strava workout delivery must be verified separately; current integration code is not evidence that scheduled workouts reach a watch.

## Research and execution plan — September 28

Research: Runna's setup asks for ability and current workload and previews the plan before activation. Its calendar separates scheduled work from history and supports moving sessions. NHS Couch to 5K recommends rest days between runs. These inform the interaction design and spacing guard; this release does not reproduce Runna's proprietary programming or the NHS nine-week programme.

Sources:
- https://support.runna.com/en/articles/15231838-how-does-runna-build-your-training-plan-around-your-current-fitness
- https://support.runna.com/en/articles/10137793-how-to-use-your-training-calendar
- https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/

Implementation sequence:
1. Add a validated four-week training block to the existing health profile JSON, preserving old records and existing write/conflict handling.
2. Build setup for current running comfort, two/three non-consecutive run days, optional familiar strength, start date, and a preview before activation.
3. Show planned sessions alongside actual history with week navigation and detailed session instructions. Support explicit completion/undo, skip, recovery substitution, and rescheduling with run-spacing checks.
4. Test invalid inputs, calendar boundaries, run spacing, completion and recovery transitions, round-trip persistence and old-state compatibility. Review the mobile workflow and run a production build.
5. Ship the verified slice to GitHub/Vercel and record limitations.

Product scope: a consistency block based on self-reported comfortable duration. No automatic load increases, race-time predictions, injury rehabilitation, implicit activity matches or watch workout delivery. Completion of a planned session is tracked separately from recorded activity totals. Future progression should use a reviewed weekly feedback loop, not an unqualified percentage increase.

## Delivered training-block slice

The setup, preview, persistence, week navigation, direct session details, completion/undo, skip/reopen, recovery substitution and rescheduling are implemented. Runs cannot be moved next to one another or onto another scheduled session. Future sessions cannot be completed. A rescheduling buffer extends one week beyond the block. Days use calendar arithmetic independent of daylight-saving offsets.

Validation: 31 training/health/routine/local-storage checks plus six context/calendar checks passed; production build passed. Isolated localhost browser review at 390px covered preview, save, reload, completion/undo, moving a session, collision feedback, recovery substitution and skip. The date-input review exposed an input-event compatibility issue; the final control handles input and change events and the successful reschedule was re-tested.

Limitations: one active block; no block archive/replacement UI yet. No automatic activity matching, progression, race plan, GPS/audio coaching, or outbound watch workouts. Cloud storage follows the existing health-profile JSON path; real signed-in account acceptance remains unverified. The first production launch does not configure a plan for Logan.
