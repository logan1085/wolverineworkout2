# Marathon planning: implementation and acceptance

Wolverine is positioned as “Your personal trainer for your marathon.” The current four-week consistency block does not fulfill that promise by itself. Race-specific training is an open product requirement, not a rename of the current block.

## Research — October 5, 2026

The [B.A.A. training overview](https://www.baa.org/races/boston-marathon/info-for-athletes/boston-marathon-training/) distinguishes plans by training level and uses preparation, building, marathon-specific and taper phases. Even its introductory level assumes substantial existing running. Its schedules are protected; do not copy or republish them. Use the structural lesson: establish actual current workload before selecting progression, and allocate time for tapering rather than extending training to race day unchanged.

[NHS running-injury guidance](https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/) cautions against rapid increases in distance or intensity. This supports an explicit response to interrupted training and symptoms, not automatic catch-up work. These references inform the design; they do not validate Wolverine's future algorithm or endorse the product. Do not present a fixed percentage as universally safe.

## Inputs and storage

Implemented: named race, optional calendar date, intention, existing comfortable-duration/day choices, and a self-reported recent-running assessment. The assessment records average weekly distance over the last four completed weeks, typical running days, longest run in that period, preferred mi/km display, and assessment date. Kilometres are canonical. Zero running is valid. Missing assessment remains missing rather than receiving assumed fitness. Estimates older than four weeks are visibly dated and flagged for updating.

The assessment follows profile JSON validation, existing local conflict protection and account save paths. It enters the existing agent context only under that flow's sharing choice. It is not a readiness score. Saving it does not rewrite workouts, create activity records or change completion history. Cloud acceptance remains separate from local test evidence.

## Remaining implementation sequence

1. Extend the existing training schema with a versioned marathon mode, distance-based targets, race day, week phases and an immutable input snapshot. Preserve existing block data and completed work. Do not fabricate duration from distance when pace is unknown.
2. Implement a deterministic proposed progression from supported baseline/date/day combinations. Clearly explain unsupported combinations, short preparation windows and missing information. Do not compress missed training into the remaining days or promise a finish time. Offer the existing consistency option explicitly when a full progression is unavailable.
3. Preview the whole journey and a focused week: weekly distance, longest session, recovery weeks, taper and race day. Keep calendar arithmetic independent of daylight saving. Separate planned distance from recorded distance.
4. Add review/activation and plan replacement with history retained. Changing race date or baseline requests a new preview; it must not silently replace an active plan.
5. Implement weekly feedback and adaptation with a reviewable change list. Preserve completed sessions; respond to missed work without catch-up stacking. Injury/pain reports need an appropriate pause/escalation path, not diagnosis or rehabilitation programming.
6. Exercise the actual mobile flow, persistence, units, rescheduling, race/date changes, interrupted weeks and old-plan migration. Review generated plans across baseline extremes and date windows; assertions must verify workload and phase behavior, not merely output shape.

## Acceptance still required for the full product

Full marathon progression and adaptation; reliable generated AI replies; hosted account isolation; real Garmin/Strava lifecycle behavior; matching recorded activity to planned sessions; physical mobile and accessibility review. Watch workout delivery must not be claimed without separate acceptance. See PRODUCT_QUALITY.md for the broader audit.

## History foundation delivered — October 5

Existing consistency blocks now support explicit preview/replace with the old block archived atomically alongside activation. Archived session statuses remain readable after reload; no activity records are fabricated. Canceling a proposal leaves the active block unchanged. Archives are bounded to 52 blocks and are never silently evicted; replacement rejects at capacity. The normal agent context includes the active block plus an archive count. Marathon-specific schema, progression and weekly adaptation still remain in the sequence above.

## Offline draft engine — October 5

`src/lib/health/marathon-progression.ts` now generates a versioned, deterministic proposal with a copied input snapshot, distance-only sessions, dated weeks and separate training/race totals. It now powers the explicit marathon preview described below. It is now connected to the active training schema and calendar through explicit activation. No saved plan is regenerated by previewing it.

Initial support boundaries: 16–24 weeks starting within the next seven days, a recent assessment averaging 40–60 km over four/five running days, and a 16–30 km longest recent run. The draft schedules four selected days, leaves the days adjacent to the long run free, and rejects three consecutive running days. These are implementation boundaries, not medical clearance or a statement that other runners cannot train for a marathon. Missing/stale/future assessments and unsupported date windows fail explicitly.

The original algorithm holds the initial workload for two foundation weeks, distributes growth through the remaining build opportunities, inserts reduced weeks, then two taper weeks and race week. Engineering caps are 5% above the previous high training week, 10% above the previous high long run, a weekly ceiling of the lesser of 1.5× baseline or 75 km, and a 30 km long-run ceiling. These percentages are product assumptions under review, not universal injury-prevention rules or rules attributed to the cited sources. A planned reduced week followed by a return to build workload can exceed those percentages relative to the immediately preceding week. Automatic feedback/adaptation remains unavailable; activation creates a static schedule with explicit manual changes.

An offline review found that the first implementation reached peak too early in longer preparations. Growth now spreads across the full build window. Reproduce the synthetic nine-profile review with `npm run eval:marathon`; results are saved in `evals/results/marathon-draft-review.json`. The 16-week/40-km case peaks at 57.5 km per training week and a 25.5 km longest run. This is an observed output, not evidence of adequate preparation for a particular runner. The higher-volume and longer-window cases have different peaks; no finish-time claim is made.

46 combined engine, legacy training, assessment, race-goal, health, storage and context tests plus TypeScript validation passed. A 63-case matrix covers race weekdays, supported lengths/volumes, calendar boundaries, uniqueness, rest adjacent to long runs and race placement. A separate regression prevents early peak plateaus. This verifies engineering properties only.

Next integration: migrate the active training union and archive validation to support distance-based sessions without fake durations; build a reviewable journey/week preview; activate explicitly through the existing archive-and-replace path; then implement feedback, changes and interrupted-week handling. Generalized novice coverage and qualitative progression acceptance remain open. Do not label this engine production-ready or silently fall back to a generic plan as though it were a marathon schedule.

## App preview — October 5

Training now exposes “Marathon preview.” Race name/date are prefilled when known and remain draft-only when edited here. Preparation length derives from the date with exact calendar-week boundaries. Four running days and a long-run day are explicit choices. The engine's supported inputs are explained before submission; unsupported assessments/windows return a focused error without substituting a generic schedule.

A successful preview shows the whole weekly-distance profile, peak training distance, longest training run, and a focused week containing both runs and rest days. Miles/kilometres changes affect display only. Race distance is shown separately from training totals and the chart. Previewing does not persist or replace training. Explicit activation now saves the distance-based schedule and race goal/date, archiving the previous plan atomically. Automatic weekly adaptation remains unavailable. No external model request occurs.

28 training tests and TypeScript validation passed. Local browser acceptance covered unsupported baseline, successful 20-week preview with synthetic inputs, unit switching, race-week totals, edit preservation, short-window rejection and return to the unchanged active block. 390px visual review and 320px overflow check passed. Real physical-device acceptance remains open.

## Saved marathon schedule — October 5

Explicit activation validates the proposal against its original inputs and current date, then saves the race goal/date and schedule through the existing profile persistence path. Replaced blocks remain in history. Sessions retain kilometres and run type rather than fabricated durations; preferred units are display-only. The home calendar links to the selected session and correct week.

Completion, skip, recovery and within-week moves are supported. Validation preserves original distances, fixed race placement and recovery spacing; future completion is rejected. A recovery substitution is ten minutes of optional gentle movement, not a completed run. Weekly adaptation and wider runner coverage remain open.

51 training, health, local-storage and context tests pass alongside TypeScript checking. Synthetic local-browser acceptance verified activation, persisted race/calendar after reload, calendar-to-session navigation, future completion disabled, valid rescheduling and completion.

## Feedback foundation — October 5

Completed sessions accept optional easy/steady/hard perceived effort and a short note. The feedback is saved with the session, retained in history, and available in current-plan agent context. It never changes scheduled distance or inserts recorded activity. The user may edit/remove it; reopening a session clears it. This supplies explicit subjective inputs for future review, but automatic adaptation is still unavailable.

## Reviewable weekly distance edits — October 5

A saved marathon week now offers a before/after preview for a user-requested 20% reduction, rounded down to 0.1 km. This is an explicit product editing option, not an evidence-backed readiness formula or injury treatment. The NHS injury guidance above was rechecked: pain is a reason to stop, not to use reduced mileage to continue through symptoms; the UI links that guidance.

Only unfinished runs dated today or later are affected. Race day, recovery substitutions, completed/skipped/past sessions and all other weeks remain unchanged. One active reduction per week prevents accidental compounding. Original proposals remain immutable; bounded adjustment records validate the modified distances. The user can review and restore original targets before affected runs become completed, skipped or past. Feedback counts are factual context, not an automatic recommendation. Stale plan/date previews cannot apply.

38 training tests pass, including reduction/restoration, feedback preservation, race exclusion, forgery rejection, archive retention, recovery handling and coverage across every week of a synthetic preparation. Mobile browser acceptance verified cancel, apply, reload and restore. This is a first manual weekly adaptation flow; automatic follow-on progression, interrupted-training logic, symptom escalation and wider supported inputs remain incomplete.
