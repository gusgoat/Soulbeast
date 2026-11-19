# Blender mountain pines · local review

Two procedural Blender models replace the generated tree cells in Sleeping Dragon Peak: `pine-upright` and `pine-windswept`. Their tapered trunks, roots, boughs and individual paired needles use rough bark and cool mountain foliage materials. Orthographic Cycles renders have transparent backgrounds and match the existing moonlight Blender prop workflow.

Authoring source: `tools/render-dragon-trees.py`. Run with Blender 5.2 in background mode. It writes both editable `.blend` models and 640×800 RGBA PNGs under `assets/forest-walk/generated/dragon-trees/`, and exports alpha-bound crop metadata to `dragon-tree-frames.js`. No AI image generation is used for these trees.

The walking scene keeps the previous deterministic sparse tree selection, world positions and collision radii. Tree render height now follows the moonlight Blender tree scale (1.45 × the original prop width). Only tree appearance changes. Smaller shrubs, scenery kits, quest sites, fork transitions, probabilities, rewards and combat are unchanged.

Validated with `node tools/test-dragon-forest.mjs` (19 PNGs, original native catalogue, density/collisions, hazards and no scenery RNG) and `node tools/test-dragon-forest-browser.mjs` (all 14 native event scenes and 14 ordinary maps). Local preview retains the level-60 sbwar hero and Eclipse beasts.

This change is only on D: for review. The live release remains `abf6a7e67a90245238bcee99609e6435b5e4ec75`. Before future publication, add the two `dragon-trees` PNGs to the immutable Supabase scene manifest and uploader; the current live manifest intentionally remains unchanged during review.

Preview: http://127.0.0.1:8835/?v=dragon-blender-preview-1&scene=map%3Afootprints&tour=1
