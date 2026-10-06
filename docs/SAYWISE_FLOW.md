# Marathon trainer entry flow

Reference reviewed: https://saywise.com/ on October 5, 2026.

## Positioning

Your personal trainer for your marathon.

## Adapted interaction

Saywise introduces its agent alongside one immediate input, then illustrates the service through concrete tasks. Wolverine applies that pattern with its own identity and approved Pip artwork:

1. New runner: one clear promise and a conversational race question. Race suggestions reduce typing. Only the race name is requested on this first screen.
2. Race intention: choose what a good race feels like and optionally add the race date. Back navigation preserves both choices. Saving explicitly replaces the profile goal, then opens training setup.
3. Training: review recent running and the proposed schedule before activating it. Goal setup does not silently replace an existing schedule.
4. Returning runner: compact race header, countdown when available, then the training week. Keep the positioning visible without repeating onboarding.
5. After a run: mark the session complete and optionally record effort and a reflection. Review any proposed lighter week before applying it.

## Honest capability boundaries

Do not copy Saywise branding, testimonials, metrics or pricing. Do not promise proactive texts, working voice, synced devices or cloud memory until the corresponding production connection is verified. AI connection status and account availability remain visible independently from the local training tools.

## Acceptance

Preserve the original race/aim persistence and explicit plan activation. Keep mobile inputs labeled, choices keyboard accessible, save failures recoverable, and returning users out of repeated onboarding. The entry flow now progressively reveals the optional date after the race question. No save happens until the runner explicitly confirms the second step.

## Introduction refinement

The welcome page now explains the concrete outcome before asking for a race: a training week and a place to reflect. An optional “How we’ll get from here to your start line” disclosure covers race choice, reviewed plan activation, and post-run logging. It stays collapsed on mobile and is absent for returning runners. This borrows Saywise’s task-led explanation without presenting example messages as real conversations or claiming the unavailable connected services work.

## Conversation continuity

The agent entry now uses marathon-specific questions about the latest run, saved week and fatigue, displays the selected companion name, and references a saved race goal when present. If AI configuration is unavailable, the notice offers manual run logging and training review directly. Opening and canceling either dialog returns to the agent; a draft selected before plan review remained intact in the local browser test, with focus restored to the review button. No AI output or training recommendation was fabricated. TypeScript and focused ESLint passed.
