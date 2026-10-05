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
