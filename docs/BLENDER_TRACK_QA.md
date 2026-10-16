# Blender training ground — local verification, 2026-10-16

Blender 4.5.0 (8cb6b388974a), already mounted at /Volumes/Blender/Blender.app, runs on this Mac. No installation or provider configuration change was needed.

Editable scene: assets/blender/training/training-ground-v1.blend. Rebuild script: scripts/blender/build_training_ground.py. Cycles-baked 2048-square atlas and Blender-rendered poster accompany a self-contained GLB: 1,464,780 bytes, 39,912 triangles, one static mesh/primitive/material, KHR_materials_unlit. SHA256 and provenance are in public/models/training/manifest.json.

The browser now loads that GLB, with existing live day stations, completion bars, countdown, camera controls, keyboard-accessible day controls and lightweight/list fallbacks. Initial display uses the Blender-rendered poster. Renderer disposes loaded resources and aborts pending fetches on teardown.

Shared page styling covers Today, Activity, Journal, Memory, Connections and Your agent. Activity and Journal move optional inspiration into collapsed disclosures. Corrected cascade conflicts and light-panel helper-text contrast.

Validation: 167 tests passed including two asset validity/budget/provenance checks; typecheck and lint passed; production build passed (existing Supabase dynamic dependency warning). git diff --check passed. Built local app rendered GLB and reported 3D ready; saved synthetic race/completed workout remained visible after reload. Desktop visual review covered all six navigation pages. Final compiled Memory colors verified. At 390px, GLB reported ready and document width did not exceed viewport. No paid inference, real health records, provider settings or credentials changed.

Evidence: output/playwright/blender-track-desktop.png and blender-track-mobile.png. These are local QA screenshots, not production deployment evidence. Production deployment is recorded in the release report. Unavailable-asset fallback was exercised against the local production build by temporarily withholding the GLB: fallback message appeared, canvas was removed, seven day controls and the completed synthetic workout remained. The asset was restored before commit. Physical touch gestures and hardware context loss have not been re-tested in this final pass.

## Reliability and readability follow-up

Fixed an indefinitely stalled GLB download with a 15-second deadline covering response headers and body. Unmount cancels immediately, HTTP errors reject before parsing, and retry uses a fresh request. Four regression tests cover stalled headers/body, unmount cancellation, successful retry/deadline cleanup, and HTTP rejection.

A local-only HTTP proxy held all GLB requests: the browser switched to fallback with no canvas and seven usable day controls. Restoring the proxy connection and selecting Enter 3D world recovered the actual scene. No QA harness is included in source or public assets.

Controlled WebGL context loss and reentry passed with the Blender asset. A temporary local reduced-motion harness measured zero camera transition RAF callbacks during keyboard day selection. These are controlled browser tests, not physical touch or hardware-failure/FPS measurements.

Reopened only the existing synthetic 20-minute workout, marked completed, and reloaded: completion persisted. Fresh and saved-state homepages now expose one H1; the secondary race/welcome region uses H2 with preserved styling.

Reviewed all six page surfaces and measured text foreground/background contrast. Darkened secondary labels, chart captions, memory state/disclosure labels, connection explanations and agent controls; removed legacy important color overrides. The scan excludes disabled controls and closed disclosure content, and is not a full WCAG audit. Decorative Garmin triangle is not body text. No real health data, credentials or provider settings changed.
