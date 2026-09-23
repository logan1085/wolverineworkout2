# Wolverine object library

Six original assets authored procedurally in Blender 4.5.0: kettlebell, dumbbell, hydration bottle, yoga mat, balance stones, moon sculpture. Each .blend includes editable meshes/modifiers/materials, marked mesh assets, a camera and studio lighting. No stock models or external textures were used.

Rebuild from the repo root:

```sh
blender --background --python scripts/blender/build_catalog.py -- "$PWD"
```

The generator writes compressed Blender sources here and web-ready GLB, transparent PNG thumbnails and catalog.json under public/models/wolverine. The app displays this manifest in 3D studio → Object library. Source files are not shipped in the public directory. Catalog assets are display/export objects; primitive-based AI editing remains in Create with AI.

The viewer loads a single selected GLB on demand and disposes GPU resources when it closes. Original models have no scripts, external URLs or textures. Keep exported models under 500 KB each and run `node --test tests/catalog.test.mjs` after rebuilding. GLB uses glTF's Y-up conversion from Blender's Z-up scene.

Ownership: original Wolverine project artwork, available for use and modification in this application. Not an anatomical, medical or manufacturing model.

## Archived human-character exploration

Kai is an original stylized human companion with sculpted indigo hair, layered amber eyes, jacket seams, cuffs, and sneakers. Regenerate using `blender --background --python scripts/blender/build_anime.py -- "$PWD"`. The editable source is `characters/kai.blend`; the web GLB is approximately 619 KB. It is a static, orbitable model, without a skeleton or facial animation. The script retains the other catalog entries. Kai is excluded from the app catalog. Moss is the default; the approved direction is soft, round, non-human mascots.
