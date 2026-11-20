# Three-country regional walking preview — 20 November 2026

Local prototype only. Enable with `layout=regions-v5`; default country maps retain their existing layout. No deployment or APK build was performed for this preview.

## Open

Double-click `D:\GameDev\soulbeast\Open-Country-Regions.cmd`. It starts the loopback-only server if necessary and opens the world/country selector. Country launchers and review screenshots are in `D:\GameDev\soulbeast\outputs\three-country-regions-v5-20261120`.

Selector: `http://127.0.0.1:8792/Soulbeast/tools/hemant-walk-demo/regions-preview.html`

Individual scenes: `index.html?country=green&layout=regions-v5&region=N&packlord3d=1&roster=1` (country blue/green/red; region N/W/E/S).

## Source of truth and build

- `content/country-regions-v5-plan.json`: approved irregular region polygons, original named places, village/war identities, internal and international gate topology, original/future island metadata.
- `tools/build-country-regions-v5.cjs` and `tools/region-country-builder.cjs`: generate all 12 playable regions, routes and local coordinates. Run `node tools/build-country-regions-v5.cjs` from the production worktree.
- Generated outputs: `tools/hemant-walk-demo/country-regions-data.js` and `content/country-region-bridge-layouts.json`. Do not hand-edit generated data.
- `tools/region-hydrology.cjs`: initial new-country river/lake placement respecting landmarks. The selected green/red waterways are now stored on each region in the plan so later gate changes preserve their locations; blue keeps its hand-positioned waterways. Bridge angles remain unchanged.
- `tools/region-gate-placement.cjs`: landing and gate image clearance. `region-gate-geometry.js` selects actual sprite views with uniform scaling.
- All gates now slide along their actual shared border, with only 25–170 projected units of inward offset allowed. The current build places all 46 doorways 25–30 units from the border. At corners, the approach may turn toward the interior without moving the doorway inland; the gate image stays aligned with the border tangent. Gate images retain at least 15 units of separation from conservative settlement bounds and 40 from neighboring gate images. A few crowded border gates use a smaller existing view. All original gate pairings are preserved.
- `country-regions.js`: selection, regional/country travel, arrival, region controls and 2x minimap. `world.js` loads only the active region's destinations and special sites.
- `road-lamp-placement.js`: dry bridge-head lights reserved first, followed by more frequent road shoulder lights. Lamps keep clear of water, bridge decks, roads and props.
- `bandits.js`: regional camp positions need a clear approach from a road and room for the existing treasure placement. This prevents a tiny isolated clearing from stopping scene initialization.

The green western region uses local projection scale 14 rather than 12 to fit eight villages and two cities with safe walking gaps. Its world atlas polygon and all war IDs remain unchanged. Its ground cache is about 7.5 million pixels, below the existing blue southern region's 7.9 million.

## Preserved and extended

All countries contain one capital, four other cities and 16 original villages: eight toward each neighbor. Each of the four regions has at least one important site excluding settlements. All original place IDs appear exactly once per country.

There are five reciprocal internal gate pairs per country and eight reciprocal international gate pairs globally. All 46 directed crossings preserve region mode and land safely inside the destination region. The original islands are unchanged; second islands are future expansion reserves only.

Each region has a river, lake, a middle-river Blender crossing, rocks, mountains and ten shadows away from roads and settlements. Existing tree assets use widths 115–160. Existing snow/forest/volcanic themes remain country-specific. Coast sand is doubled, with ocean water and animated offshore waves. Camera Smooth v1 and 3D joystick walk/run behavior are retained.

## Art

Gate views: `assets/country-walk/gates-directions-v2/{country}-{front,diagonal-right,diagonal-left,side}.webp`. Blue retains its approved views; eight green/red views were created using the built-in image generation tool and encoded as alpha WebP. Source PNGs and the complete final prompt sets are in the output folder's `gate-sources`, `green-gate-assets.json`, and `red-gate-assets.json`.

Bridge overlays: `assets/country-walk/region-bridges-v5/{country}-region-{code}-{deck,rail}.png`. These are renders of the existing bridge Blender file, not replacement models. Re-render if bridge angles change:

`blender --background --disable-autoexec D:\GameDev\soulbeast\outputs\country-bridges-blender\soulbeast-country-bridges.blend --python tools/render-region-bridges.py -- green red`

Preview media are local. Before a future public release, move suitable new media to Supabase Storage under the project's existing delivery convention and update references.

## Verification

- `node tools/test-region-gate-borders.cjs`: every doorway is beside the correct shared border.
- `node tools/test-three-country-regions.cjs --assets`: original IDs/settlements, every route, water/landmark/bridge clearance, safe arrivals, reciprocal gates, ten-shadow patrol safety, bandit treasures, dry lamps and art existence.
- From the workspace root: `node tmp/test-three-country-regions-browser.cjs`: actual touch joystick events at 390×844 and 844×390 in all 12 scenes, map/place UI, all 46 walked gate directions, selector and missing-asset/runtime errors.
- `node tools/test-country-regions-v5.cjs`: retained blue-region regression checks.
- `node tools/test-sealer-loading.cjs`: retained sprite loading/shadow-adapter regression.

Browser QA deliberately aborts external models and exercises the existing sprite fallback. It does not establish real-device frame rate or verify Supabase model delivery. The local preview retains the online 3D URLs. Real-phone review and user visual approval remain pending.

Latest border-edge revision: `D:\GameDev\soulbeast\outputs\border-gates-edge-fix-20261120`. It contains current screenshots, border distances and browser validation. Root launchers use the same updated production worktree. Blue east shadow spacing is 240 instead of 260 to retain ten safe shadows beside the revised roads; road and settlement exclusions are unchanged.

## Country background scenery — latest preview

`region-backdrop.js` paints existing snow/forest/volcanic ground textures and two layers of existing country mountain images outside the active region. `worldMainlands` in generated data describes all three country outlines in local coordinates, so neighboring land beyond a gate no longer appears as empty sea or flat placeholder gray. Ocean gradients and waves exclude this world land, while actual coastlines retain their beaches.

Mountains are rendered once into the existing ground cache, clipped outside playable terrain and inside world land. Mountain feet leave the outward doorway corridor clear. They add no terrain collisions, destinations, moving actors or extra media downloads. The world-aligned texture continues beyond the existing cache bounds when necessary; ground cache dimensions are unchanged. Existing gate locations, world places, rivers, lakes, roads and bridge angles are byte-identical to the previous border-edge revision.

Current artifacts: `D:\GameDev\soulbeast\outputs\country-border-backdrops-20261120`. `test-region-backdrop.cjs` checks all background placements. `tmp/test-region-backdrop-pixels.cjs` validates actual canvas pixels: original playable ground is unchanged, mountain images render outside it, distant texture continues beyond cache bounds and ocean does not cover neighboring mainland. Browser scene/gate validation retains the intentional offline character-model fallback; actual mobile frame rate still needs device review.

## Soft coast, coconut beaches and single bandit camps — prior revision

Artifacts: `D:\GameDev\soulbeast\outputs\soft-coast-coconut-20261120`. The server/launcher paths remain the same. No publish, Git push or APK build was performed.

- The builder includes `worldCoastline` for the continuous true exterior shoreline. All context polygons/shore segments also follow the green-west local scale. Coast painting is shared across neighboring regions, so sand and shallow water no longer stop at a region boundary. Beaches use translucent sand bands fading over 240 projected units, and sea depth uses one consistent distance-band palette. Ocean color continues outside the existing ground cache when a camera reaches an edge. Political border lines are trimmed out of the beach transition.
- `coast-vegetation.js` reuses the coconut palm from the original island beach atlas (`island-props.json` rectangle 1148,294,238,267). Terrain marks every beach tree as a palm before shrub conversion. Living vegetation, grass, shrubs and flowers are excluded from the beach transition. Palms retain normal trunk collision and are drawn in the scene depth order. Inland country vegetation retains its normal variants.
- `bandits.js` creates exactly one regional guard, placed in a reachable peripheral clearing. Camps stay 400+ units from roads, 550+ from destinations (larger buffers for special sites), and 1,300+ from ports. Their aggro range is 180, and patrols preserve the same safety buffers. A deliberate approach still starts an encounter. Regional quest requests share this one actor, using quest-place tags for progress and one selected quest chest; no extra quest bandits are appended.
- `country-weather.js` renders green butterflies only from 06:00 until before 18:00 in game time. Country daylight is passed explicitly; other callers can use the shared game clock. Night fireflies and other country weather are retained.
- `assets/country-walk/green/mountain-dry-v2.webp` is a new alpha WebP (600 KB) generated with the built-in image generation tool. The original art is preserved. The selected source PNG and full prompt are saved in the output folder's `dry-mountain-art.json`. Green country mountains and cached background ranges now use this dry forest image at full height. Mountain-only water shimmer and water audio sources are removed; actual rivers, lakes, ports and forest waterfalls retain their sources.

Validation: `node tools/test-coast-camps-weather.cjs` checks all 12 single-guard camps through patrols, ordinary road travel versus deliberate encounters, quest guard reuse, coconut-only trees, consistent world coast projections, day/night butterflies and mountain-effect wiring. `tmp/test-soft-coast-weather-browser.cjs` checks actual sand/ocean canvas pixels and night/day transitions. `tmp/test-three-country-regions-browser.cjs` checks all 24 mobile scene cases and 46 walked gate directions; set `REGION_POLISH_QA=1`, `REGION_BACKDROP_QA=1`, and `REGION_PREVIEW_OUTPUT=outputs/soft-coast-coconut-20261120`. Its output is saved to `browser-test.log` so progress survives an app restart.

Preview art is local until a release is requested. Move suitable new media to Supabase under the existing project convention before publishing. Real-device performance and online character model delivery remain user-review checks; browser QA deliberately uses the existing offline fallback sprites.

## Expanded rivers/lakes and wading — 2026-11-20

Artifacts: `D:\GameDev\soulbeast\outputs\wide-water-wading-20261120`. This revision also restores the original green mountain artwork, its animated water highlights and mountain water audio, as requested after reviewing the dry alternative. The dry image remains archived and unused.

All twelve regional rivers are twice their previous width (100 to 200 projected units). Lake polygons double in both dimensions, giving four times their previous area. `region-wide-water-fit.cjs` moves the river/lake cluster where necessary to preserve the positions of named cities, villages and landmarks and keep water inside each region. Bridge crossings and road connections follow the translated water cluster. Existing island maps are unchanged.

`waterways.js` exposes depth sampling and bank access points. River depth increases toward its centerline; lake depth increases toward its center, with a smooth transition from the banks. Bridge decks stay dry. `terrain.playerBlocked`, `navigation.playerWalkable`, `playerClear` and `playerRoute` allow the local sealer to wade while retaining normal collision for rocks, trees, scenery and region borders. Existing navigation for land actors remains dry. Bank entry points exclude blocking trees, shore rocks and scenery props.

`water-interaction.js` halves movement speed whenever the sealer is in water, renders ripples and clips the lower body at the water surface. Submersion scales with depth and with the active renderer, including the loading/portrait fallback. Original joystick direction, continuous 3D rotation and Camera Smooth v1 remain in use. Demo URLs accept `arrival=river` or `arrival=lake` together with a region.

`water-beasts.js` reuses the existing Kappa atlas, with one creature per river and one per lake. Each actor patrols/chases only within its own water body; it cannot engage a sealer standing on a bank or bridge. Land foes return when the sealer enters water. Aquatic encounters use the original battle menu through `encounter=shadow&habitat=water`; encounter rules select unlocked ordinary water species from the original catalog. Land shadows remain ten and bandits one per region.

Validation includes `node tools/test-region-wide-water.cjs` (optionally set `WATER_BASELINE` to the saved `before-data.js`), the existing twelve-region route/assets checks, gate/background geometry checks and the single-camp/coast/weather regression checks. Browser reports and screenshots in the artifact folder record completed scene/gate and real-model water tests. This is a local prototype; no deployment, push or APK build is part of this revision. Real-device performance remains for user review.

## Village spacing, bridge side barriers and enabled preview sound — 2026-11-20

Latest artifacts: `D:\GameDev\soulbeast\outputs\village-spacing-20261120`. The green-west pair ไทรพันปี (`green-village-8`) and ผานกคราม (`green-village-9`) was only 157 projected units apart. `content/country-region-place-offsets.json` moves ไทรพันปี 600 units east and 100 projected units north after the existing terrain layout is built. Their separation is now 538 units. All other named places, village/war IDs, parent-child relationships, water polygons and gates are preserved. This local placement override intentionally leaves the original world-war topology intact; generated scene and preview atlas coordinates use the updated village location.

`waterways.bridgeRails` and `bridgeRailHit` define solid side barriers. Player navigation excludes the barriers, samples movement segments to prevent stepping through them, and routes around barriers at road waypoints. Head/tail entrances remain open. Aquatic actors retain their underwater navigation and cannot engage someone on a bridge. Water entry from ordinary river/lake banks remains available.

An explicit `audio=1` parameter on the 3D preview enables saved game sound while retaining nonzero volume preferences. The first joystick/touch gesture unlocks playback. Existing `assets/audio/forest-journey/water.mp3` is used for water footsteps; no new media was added. The sound stops when movement stops.

`test-region-villages-bridge-rails.cjs` checks village spacing in every region, unchanged world features, both bridge side barriers and open road entrances across all twelve bridges. Structure/assets, water traversal and camp/coast/weather checks also pass. `tmp/test-village-bridge-audio-browser.cjs` checks the moved village views in portrait/landscape using the original 3D model and verifies actual water audio playback (ready state, advancing time, nonzero volume), gesture unlock and idle stop. No publish, push or APK build was performed.

## User-supplied country water sounds — 2026-11-20

Artifacts: `D:\GameDev\soulbeast\outputs\country-water-audio-20261120`. The user supplied `เสียงเดินในน้ำ.mp3` (227,369 bytes) and `เสียงน้ำ แม่น้ำและลำธาร.mp3` (2,727,360 bytes). Both exact original files were uploaded to content-addressed objects in the existing public Supabase bucket without replacing existing objects. `storage-audio-manifest.json` records public URLs and SHA-256 checks against downloaded bytes. The MP3 files are kept in the output archive, not the GitHub Pages assets.

`walkAudioCatalog.countryWater` provides country-only audio overrides. `world.js` passes the supplied water ambience and water footsteps to `WalkAudio.create`. The shared engine uses the uploaded ambient loop instead of generated water noise for country scenes, retaining distance-based volume, existing volume preferences, gesture unlock, mute, pause, visibility and cleanup behavior. Water sources include rivers, closed lakes, landmark/mountain water and regional coasts. Only one ambient loop plays, irrespective of the number of nearby sources. Other scene types retain their existing sound catalog and procedural water.

Water footsteps use the supplied file at natural playback speed when moving in water, including lakes, and stop on idle or changing surface. Dry bridge decks retain their ordinary walking sound. `tmp/test-country-water-audio-browser.cjs` validates actual playback of both supplied assets for rivers and lakes in all three countries, idle footsteps stopping while ambience continues, and muting both tracks. Browser tests serve the SHA-256-verified audio bytes from the artifact archive while retaining their public Storage URLs. Web deployment and APK creation remain outside this change.

## Static mountain water art and shallow sea wading — latest 2026-11-20

The user requested keeping the original green mountain image, including water painted into it, while disabling its flowing-water overlay and mountain-only water sound sources. `world.js` no longer calls the mountain overlay or adds mountain audio sources. The original image and cached background art remain unchanged. Actual rivers, lakes, coastal water and landmark waterfalls retain their effects/sounds. Mountain-specific proof and a screenshot are in `outputs/mountain-water-effects-off-20261120`; mountain diagnostics now report zero effects.

`RegionCoast.seaSample` defines a shallow sea strip extending at most 180 projected units beyond an active region's real coastline. It excludes all world mainland polygons and continues adjoining political borders out to sea, so wading cannot bypass a region/country gate. Depth grows smoothly from the shore toward the outer limit. Inland regions have no sea extension. The player collision path permits this strip while retaining scenery collision; ordinary land actors remain inside the original region. Beyond the strip, deeper water blocks movement.

Sea samples use the existing `WaterInteraction` behavior: half movement speed, ripples, depth-dependent lower-body clipping, uploaded water footsteps and coastal ambience. Existing sea gradients/waves remain in use. `arrival=sea` starts a preview at a shallow accessible point; demo: `http://127.0.0.1:8792/Soulbeast/tools/hemant-walk-demo/index.html?country=green&layout=regions-v5&region=S&arrival=sea&packlord3d=1&roster=1&audio=1&v=sea-wading-20261120`.

Artifacts: `D:\GameDev\soulbeast\outputs\sea-wading-20261120`. `tools/test-region-sea-wading.cjs` checks depth, offshore limits, reachable beach openings and land-only actors across every coastal region. Existing inland-water, bridge-side, camp/coast/weather checks pass. `tmp/test-sea-wading-browser.cjs` checks real 3D joystick movement out to the limit and back toward shore in all three countries. This change adds no new media and does not deploy or build an APK.

## Living beast integration — latest 2026-11-20

Walking silhouettes now use the existing 177-model/form sprite catalog. See `content/living-beasts-integration.md` for source/revision details, load-time 1–4-member groups with one visible lead, cumulative forest unlock rules, ordinary/common/native country filtering, river/sea/sand habitats and the separate online-party server release requirement. Current review artifacts are `outputs/living-beasts-game-20261120`. No map geometry, war-village IDs, bridge access, player water depth or Camera Smooth v1 settings were changed by this integration.


## Production cutover — 2026-11-20

User approved replacing the original country maps. Regional selection is now the default for normal country entry URLs. Existing town/village exits, forest arrivals, port returns, dungeon arrival and colosseum return infer the correct region; legacy mode is available only with an explicit layout=legacy query for rollback comparison. Prototype region-jump links stay restricted to the 3D test preview; the normal game uses the actual gates and retains original save progression, ownership/war restrictions and place IDs.

The release preserves all 80 country places and 46 directed gate entries (15 domestic and 8 international pairs). Online presence and realtime/rank scene checks now accept an optional N/W/E/S suffix while retaining legacy scene names and existing ownership checks. A reversible SQL patch was tested under rollback before application; no character rows were changed. Existing kingdom-boss server coordinates are translated into a single matching region with inverse player-coordinate translation, preserving its server-side combat rules.

New gate views and Blender bridge renders are streamed from immutable, hash-verified Supabase objects (36 files); original authoring inputs remain local and are excluded from this release. Existing media and the 177 authored beast atlases are reused. The country scene uses CORS when drawing streamed images.

The dungeon-party backend was backed up, compared byte-for-byte (normalized line endings) against the release baseline, and deployed before the new web client so appearance/group identity remains authoritative. This country-map release does not restart Render; the existing colosseum server protocol remains in use. Prepared colosseum server spawn-filter changes are held out of this web release, alongside unrelated castle-architecture work.

Validation artifacts: D:\GameDev\soulbeast\outputs\country-regions-live-release-20261120. APK building is separate from this website release.
