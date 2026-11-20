# Live 3D beasts and six graphics levels — 2026-11-21

Make the tested animated GLB renderer the normal renderer for living beasts in country, island and solo dungeon walking scenes. Use the existing immutable Supabase registry for all 177 catalog forms, including the latest Storm Drake and three blue-fire Wisps. No authored model/animation files, review approvals or paid tasks are changed. Ordinary-country rarity, cumulative forest unlocks, country endemism, habitat and 1–4 member encounter plans remain unchanged. One lead actor represents each group.

Settings now has six levels: ประหยัดสุด, ประหยัด, ค่อนข้างประหยัด, สมดุล, สูง, สูงสุด. Country canvas targets and beast raster intervals follow the tested APK presets; active 3D budgets are 1/2/3/3/4/4, capped at two on low-memory devices. Additional/loading actors use the existing same-species sprites. Visible fallback remains encounter-ready if WebGL or the model module is unavailable. Ground actors reuse their still frame at rest; flight and hover remain animated. All actors share one WebGL raster.

Migrate old preferences 1→2, 2→4, 3→5, 4→6 once. Keep the semantic defaults: balanced on touch and highest on desktop. Capture the browser preference store before isolated menu storage is installed, so the actual settings slider updates both the country scene and model budgets immediately. Add the six-level panel to root/legacy settings and refresh scene/menu/module cache keys.

Restore the solo dungeon startup tail from the last valid pre-regional release: the live tail was truncated during an earlier release and could not load the scene. Preserve the current room-party branch, current presence script and current beast scripts. No backend or account schema changes.

Preserve the painted atlas, teleport ownership/item handlers, Camera Smooth behavior, and nighttime-only water reduction. No APK build in this web release.

Validation artifacts: D:/GameDev/soulbeast/outputs/beasts-3d-six-graphics-web-20261121. Includes 36 actual normal-game settings cases, 12,480 encounter-rule rolls, current catalog mapping for all 177 forms, eight real GLB motion/idle checks, context loss/recovery and module-failure fallback, island/dungeon low-RAM tests, pixel-identical daytime water and preserved reduced nighttime water. These are desktop Chrome touch viewport tests, not a physical phone FPS guarantee.
