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
