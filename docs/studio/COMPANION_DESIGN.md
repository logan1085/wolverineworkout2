# Companion design: September 28

The apple was too literal: fruit silhouette, brown stem, gloves and shoes made it an object dressed as a person. The new direction is a small forest creature with only a sprout as a botanical cue.

## Render / critique / refine

1. **Silhouette study.** Removed the top dimple, lobes, stem, freckles, brown limbs and clothing. Created a bottom-heavy rounded body, larger seed eyes, small flippers and feet. Render: [first study](studies/pip-separate-limbs.png). Critique: the primitive intersections made limbs look attached.
2. **Continuous sculpture.** Fused the limbs and torso using voxel remeshing, smoothed the joints and reduced geometry for mobile. Render: [second study](studies/pip-fused-sculpt.png). Critique: the raised flipper was too melted into the shoulder and lost the wave.
3. **Pose refinement.** Lifted and straightened the raised flipper and reduced smoothing to retain a readable gesture.  Same sculpt drives the portrait and GLB; no separate old model is swapped in.

4. **Outline polish.** Full-resolution review revealed small voxel artifacts along the outline. Added a subdivision pass after mesh reduction, keeping the exported model below the existing mobile asset limit. Final: `public/models/characters/pip-sprite-v4.png`.

## Acceptance criteria

- Creature silhouette reads without its leaf, eyes or color.
- One continuous sculpt, with no visible primitive seams at limb joins.
- Face stays legible in the small Home and chat placements.
- Leaf stays a small accent, without an apple stem or fruit lobes.
- Three coordinated colors, all exported from the same Blender source generator.
- GLBs remain below 800 KB; detailed portraits stay the default on mobile.

Regenerate using `scripts/blender/build_sprites.py`. Add `--draft` after the repo argument for a single 768px Pip study in `/tmp/wolverine-sprite-study`; draft mode does not change the app catalog or production sources.
