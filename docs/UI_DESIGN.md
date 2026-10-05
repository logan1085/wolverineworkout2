# Wolverine interface

The health app uses forest-green surfaces, warm paper text, sage accents, and 3D companion portraits. The shared theme is in `src/components/health/refinement.css`; layout and interaction rules remain in `health.css`.

- One clear primary action in the first-use daily briefing.
- Show a useful explanation and connection action before daily signals exist. Never fill empty health metrics with invented values.
- Use the same sans-serif typography, surfaces, controls, and focus indicators across Today, agent, activity, journal, memory, connections, and dialogs.
- Keep character choice secondary to the daily action, with a larger interactive portrait and a visible fallback while WebGL loads.
- On mobile, preserve the bottom navigation, keyboard-aware chat layout, and minimum 44px action targets.
- Demo data remains explicitly labeled and separate from personal records.

Visual review covers a 390px mobile viewport, the character picker, agent screen, More menu, and a desktop layout. Build validation is recorded in the release notes when shipped.

## Character direction

Use original soft, round, non-human companions: simple silhouettes, expressive eyes, tiny limbs, and a playful Kirby-esque feel. Moss, Sunny, and Pebble remain selectable; Moss is the default. Avoid human anime characters. The selected mascot appears consistently in Today and the agent avatar/welcome. Preserve the constrained loading-poster frame. Kai was an unaccepted exploration and is excluded from the app catalog; its editable source remains in repository history/workspace for reference.

## Minimal view hierarchy — September 23

Each primary view uses a short title and one primary action. Today shows the briefing and available signals, with the daily plan and ritual objects in disclosures. Activity shows totals and the log; the chart appears only with records, and movement ideas/legacy coach live in a disclosure. Journal prioritizes check-ins with reflection tools below. The agent uses a single conversation column; Context remains available through its button. Memory prioritizes the on/off control and saved facts, with context inspection and conversation/backups in disclosures; empty stores have no redundant search/filter fields. Connections leads with account state and concise provider cards, then privacy and history tools. Optional detail is accessible through keyboard-operable native disclosures. Primary consent and provider availability remain visible.

## Color preference — September 25

Restored the original forest-green palette across the health views, dialogs, public documents, and installed-app identity. Preserve the simplified layouts and non-human companions. Today uses the pale sage briefing against the dark green canvas.

## Soft companion revision — September 25

Reference research: Meta's official Muse page (https://ai.meta.com/muse/) and visual inspection of the installed Muse avatar. The useful direction is a compact soft body, small facial features, quiet expression, and relaxed limbs. Original Wolverine models use a continuous remeshed body, warm face panel, tiny smile, and their own leaf/sun/stone accents. Remove the earlier rabbit ears, separate belly and oversized shoes. These are original Blender models, not copied Meta assets. Portraits use a subtle procedural surface texture; web GLBs use mobile-friendly smooth geometry and matte materials. No facial animation or Muse realtime-avatar capability is implied.

## Companion clarity — September 25

Soft-v2 adds modeled face stitches, eye catchlights and leaf veins, while keeping the approved silhouette. Blender portraits are 1024px at 160 Cycles samples. Posters and choice thumbnails request quality 95; picker posters request an appropriate 360–480px display width. The live viewer uses AgX for companions, tighter framing, and up to 3× device density within a 1.5-million-pixel buffer budget. The mobile picker gives the model a 240px frame. Each companion GLB remains under 800 KB. Procedural fabric detail is in the Blender portrait; the live model uses matte surfaces and modeled details, not a baked fabric texture.

## Blender sculpt and material pass — September 25

The atelier revision replaces Moss's oval leaf with a tapered, cupped surface and finer veins; gives the body a relaxed asymmetric arm pose; projects the face panel onto the actual body surface; and sinks finer stitches into its edge. A 256px tangent-space fabric normal is baked in Blender and embedded in each GLB, so the web version retains material detail. The renderer disposes uploaded texture resources on unmount. Review the source from front, three-quarter and profile angles with `scripts/blender/review_character.py`; the regeneration script supports `--only moss` for focused iteration. Original artwork and the green palette remain intact.

## Companion-led focus spaces and Home calendar — September 25

The Blender portrait is now the stable default everywhere AssetPreview is used. A view no longer loads WebGL automatically and replaces the authored lighting with a flatter live render. Full previews expose an explicit Explore in 3D / Back to portrait control; compact Home portraits stay still. Changing assets resets the interactive view, and exiting it releases the canvas and textures.

Home includes Your rhythm: a Monday-first month calendar with selectable day agendas from existing check-ins, activities, Garmin daily metrics and completed daily steps. It supports month navigation, Today, sample labels, empty days and a today-only check-in action. This is a recorded-history calendar, not an external calendar connection or a future scheduling system. Dates are local calendar dates at noon to avoid UTC shifts.

Movement, Rest and Reflection focus spaces integrate the original Blender objects into the page itself, with one contextual next action. Home can switch among all three; Activity opens Movement and Journal opens Reflection. Their actions prepare an agent message for review, without sending it. The optional object collection remains available for browsing and creating objects. No decorative WebGL scenes load until requested.

## Personal routines and streaks — September 28

Home offers a three-step routine setup: selected goals, daily time/pace, and companion. Preferences are validated as an optional profile extension, so existing local and account data still loads; normal health save/export paths retain it. Edit routine reopens the setup. Canceling setup changes nothing. The daily card replaces the old generic checklist with chosen movement, rest and reflection tasks, completion progress and a seven-day history strip. Movement becomes gentler when reported energy is low or soreness is high. Existing check-ins and activities satisfy relevant tasks automatically; their completion is corrected by editing the source record, not the task checkbox.

Streaks count unique local calendar days since onboarding with a routine completion, check-in or logged activity. One meaningful action earns a day; multiple tasks do not inflate it. Yesterday's run remains current until today ends. A missed day resets current, not best. Future and pre-onboarding records are excluded. Manual task completions can be undone; statistics are recomputed from actual records. No notifications, external account changes or social leaderboards are enabled by onboarding.

Atelier-v3 makes the Blender body rounder with shorter arms, softer feet and quieter fabric grain. Reduced ambient fill and a stronger directional key restore shape in interactive 3D. Portraits remain the default and all three editable sources, GLBs and portraits share the new geometry.

## Apple companion reset — September 28

Replaces the previous cloth-bodied family with Pip (red apple), Sprout (green apple), and Honey (golden apple). Each uses a newly modeled lobed apple body with a recessed stem crown, curved stem, cupped leaf, direct seed-shaped eyes, tiny rounded smile, freckles, mitten hands and soft shoes. No human torso or separate face panel. Smooth satin skin and modeled features export directly to GLB without procedural-only texture differences. All three colors share the same friendly waving pose. Pip is the new default and fallback for retired saved IDs; character choice still propagates through Home, chat, picker and onboarding. The stable portrait / explicit interactive viewer behavior is preserved.

### Soft creature iteration — September 28

Pip now uses a continuous sage-green sprout-creature sculpt. No fruit dimples, brown stem, gloves or separate shoes. The face and asymmetrical flipper pose carry the character; the leaf is a small accent. The documented render/critique loop lives in `docs/studio/COMPANION_DESIGN.md`. Current assets use the `sprite-v4` version to prevent stale portrait/model caches.

### Running welcome — September 28

Default Home is now a single-question welcome: “Did you run today?” Bold italic sans-serif, lime voice action, quiet dark-green surfaces, approved Pip and subtle track-like rings. Training and run logging are secondary actions; the full dashboard is revealed on demand. Voice consent and failure states remain readable within the welcome. Preserve the approved character geometry and colors.

## Runna-informed daily screen — September 29

Reviewed https://www.runna.com/ and its displayed app previews. Follow the product UI's charcoal surfaces, compact card hierarchy, normal sans-serif headings, clear selected days, and visible training week. Preserve Wolverine's mint-green accent and approved Pip asset. Home now places the voice check-in and real training calendar together, with routines and insights disclosed below. No invented activity, streaks, or race metrics. Desktop uses two columns; mobile stacks the cards. Voice consent and text fallback remain visible.

## Saywise-inspired marathon entry — October 5, 2026

Reference reviewed: https://saywise.com/. Adopt its outcome-first headline, named companion introduction, single-field entry, progressive questions and direct next action. Keep Wolverine's original Pip artwork and green identity; do not copy Saywise assets, logos, statistics, endorsements or job-search promises.

Positioning: “Your personal trainer for your marathon.” A warm paper-colored welcome sits above the daily dashboard. Two steps ask for a race and intention. The final action explicitly replaces the profile goal using existing validated storage and opens the real training planner. Cancel/back before saving leaves stored data unchanged. Existing plans remain intact. Profile goal remains visible in the calendar; goals saved through this flow show a returning-runner card. Sample mode disables writes.

The current planner is a four-week consistency block, not a complete race-periodized program. Do not promise automatic adaptations, full marathon readiness, shared SMS/web memory, or live AI availability. Photon transport works, but generation remains blocked by the invalid OpenAI key; the replacement key destination was declined. This UI pass does not alter credentials or send messages.

Next product increments: structured race/date and baseline fields; a reviewed race-specific training engine; explicit plan-change previews; verified account-to-phone pairing; consented shared context. These are future work, not shipped features.
