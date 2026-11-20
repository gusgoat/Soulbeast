# Living beasts in the walking game — 2026-11-20

This is the local implementation in `D:\GameDev\soulbeast\tmp\party-encounter-production`. No website/server deployment, Git push or APK build was performed. Existing authored media was uploaded to the project's public Supabase Storage. No Meshy task, new model, new animation, rerig or image generation was used.

## Authoritative assets

Read `D:\GameDev\soulbeast\BEAST_MODELING_HANDOFF.md` and `BEAST_CHAT_RESUME.md` before changing this integration. The source is `output/living-beasts-v1/catalog.json` plus `manifest.json`, covering 177 models/forms. The 2D path uses the original transparent WebP atlases and JSON metadata in each group's `game-sprites` directory: 8 directions × 16 frames, 3 seconds. Original GLB/Blender/atlas files and authoring review/approval flags were not edited.

The current Storm Drake is `extended-air-slither-v2`; `wisp`, `wisp_ghostfire`, and `wisp_death_lantern` are `full-blue-fire-v2`. Content hashes in public URLs prevent the old same-named files from remaining cached. `outputs/living-beasts-game-20261120/asset-manifest.json` records every original atlas path, metadata path, SHA-256 and immutable Storage URL. `storage-validation.json` verifies all 177 downloaded objects against the originals, totaling 534,234,038 bytes. All atlas headers have alpha and the expected dimensions. The large media files are not copied into the GitHub Pages repository.

`assets/living-beasts/catalog.js` is lightweight runtime metadata, including the model/form-to-species mapping and canonical game species/forest pools. Its preparation imports the account engine's catalog and adds missing forest 8 from the existing forest UI catalog, matching the late-stage client forest. There are 177 model/form entries, not 177 distinct base species. Game species outside the authoritative model catalog are excluded from walking encounter selection; another animal's appearance is never substituted for them. Existing game species definitions, forest battle artwork and boss-specific renderers are retained.

## Encounter groups and progression

`tools/town-walk-demo/living-beasts.js` assigns an encounter group when a map is loaded. Each existing encounter point still represents 1–4 opponents, with exactly one walking model: the group's first member in its correct evolution form. Remaining members stay hidden until battle. Rendering does not reroll a group.

Country, island and solo dungeon encounters pass their frozen plans through an origin-local session token to the original battle menu. Island contacts also store the original group's units in the existing `visit.pending.plan`. Normal battle construction, skills, capture rules, rewards and quest/group counters remain in use. Internal `kind: shadow` identifiers continue to represent the existing encounter category, not a silhouette visual.

Country rules remain ordinary-only. The progression order is `7,1,2,3,4,5,6,8`: all cleared forests plus the first uncleared, unlocked forest are included. This cumulative rule was explicitly confirmed by the user; it is not limited to the latest forest alone. Example: clearing training forest 7 unlocks forest 1, and both pools become available. Clearing 7 and 1 adds forest 2. Species must also be in the common pool or the current country's native pool. A native species is never used as a fallback in another country. Existing common/native selection weights remain in place. Night/day filtering occurs at map load, and the resulting group is kept until that map is reloaded.

## Habitats

`beast-habitats.js` classifies water-type creatures plus explicit turtles, tortoises and crocodiles as aquatic; crabs override their water typing and belong on sand. Marine-only and freshwater-only sets further constrain river/sea placement. Land selection excludes both aquatic species and crabs. Every member of a hidden group passes the same habitat filter as its visible lead.

- Countries retain ten ordinary encounter points per region. Where an eligible native/common crab pool and a safe sandy clearing exist, one of these points moves to the beach core and its patrol/chase navigation is constrained to sand.
- Aquatic country groups use rivers or the existing shallow sea band. They are not spawned in lakes under the user's latest river/sea-only instruction. Lakes remain wadeable. Eligible pool/terrain availability controls whether a region has 0–2 water groups; an unavailable native habitat is not filled with foreign species. Water navigation confines each actor to its own body and retains bridge safety.
- Islands retain twenty encounter points and their existing island rarity/level rules, selecting only models in the supplied catalog. Available marine groups and crab groups are moved to sea/sand positions with separate navigation bounds. Their groups keep one visible lead.
- Dungeon roaming encounters use land-compatible species from the original floor pools. Counts remain fifty per floor. Bandits and fixed boss rules are retained.
- Colosseum walking enemies use the real catalog appearance for their known species/form. Fixed shadows already use land species; map bosses now exclude aquatic/non-catalog species from land spawns. Human/player 3D rendering is retained.

`roamers.js`, island patrols and encounter pursuit honor actor-specific habitat bounds. Fish/turtles cannot chase onto land, and crabs cannot follow someone inland. The previous water movement, side barriers on bridges, coastal effects, static mountain water art and supplied water sounds remain in use.

## Renderer and online party

The runtime crops the authored frames using normalized metadata anchors. Direction follows actual movement; source atlases are not mirrored into fabricated views. Animation uses real elapsed seconds rather than a clamped physics clock. The browser resizes decoded atlases to 128-pixel cells (96 on low-memory devices), loads at most two atlases concurrently and releases old decoded images. It fetches only selected/visible species rather than downloading all 177 on entry. Page navigation releases the cache, including when a page enters the browser's back cache. A not-yet-loaded actor cannot start an invisible local encounter.

Online party visuals consume the server's first-member `appearance`. The server adapter freezes all shadow encounter plans before publishing a floor snapshot and reuses those exact groups in battle. Only the lead appearance is public; the full enemy plan stays in private room storage. The new helper files are included in the function package manifest. **Deploy the updated party backend before the updated web client when a release is requested.** The colosseum server must also receive the updated spawn-pool and static-helper changes. Until then, production online servers are unchanged. A new party client waits for authoritative appearance data instead of inventing an unrelated species for an older server.

Country/island/solo dungeon renderers, online party art, and the colosseum scene share the new renderer. The old shadow atlas is no longer requested by these walking scenes. An existing missing road-lamp placement dependency in the island entry page was also repaired so the whole island scene initializes correctly.

## Review and verification

Artifacts: `D:\GameDev\soulbeast\outputs\living-beasts-game-20261120`.

- `tools/test-living-beasts.cjs`: all model/form mappings, latest four revisions, cumulative forest unlocks, ordinary-only/common-native country restrictions, habitats and stable 1–4-member plans.
- `tools/test-living-beast-renderer.cjs`: frame cropping, exact 3-second loop, movement directions, all 177 render selections and cache eviction.
- `tools/test-living-habitat-patrols.cjs`: river/sea containment and sand-only crabs through 120 seconds of patrols across countries and islands.
- `tmp/test-living-country-browser.cjs`: real scene loading in three countries; visible lead/group identity matches the actual battle menu; no old silhouette requests.
- `tmp/test-living-worlds-browser.cjs`: islands, dungeon floors, all twelve country regions, the latest Storm Drake/Wisps, and actual online-party/colosseum renderer smoke checks. Its environment modes select separate reports rather than overwriting the full world report.
- `tmp/test-living-party-server.mjs`: fifty authoritative groups on each of seven floors; snapshots do not reroll, and first appearance matches battle species/level.
- Existing colosseum/survival suites: 89 tests pass. Existing regional map/assets, bridge, shallow sea, camp/coast/weather regression checks also pass.

Browser media is served from the SHA-256-verified originals while retaining the public Storage URLs; public CORS and local preview HTTP were checked separately. These are desktop browser/mobile-viewport tests, not a claim of measured real-phone frame rate.

Walking demo: `http://127.0.0.1:8792/Soulbeast/tools/hemant-walk-demo/index.html?country=green&layout=regions-v5&region=N&arrival=beasts&packlord3d=1&roster=1&v=living-177-2`.

177-model review: `http://127.0.0.1:8792/Soulbeast/tools/living-beasts-preview/index.html`.

The source preparation/upload scripts are separate from gameplay. Do not rerun one-off integration patch scripts over already-modified files. For a future authored revision, regenerate runtime metadata from the authoritative catalog, upload only content-addressed media and verify hashes before release.


### Walking preview and simulated complete progression — 2026-11-20

The 3D-character country preview previously skipped the land-roamer and bandit update calls. Patrol updates now run in that preview as well as normal play; preview battle/tutorial suppression stays in place.

Add `beastTestAll=1` together with `packlord3d=1` to use a temporary level-60 encounter profile with all eight forest clears. This only supplies encounter eligibility; it never writes level or clears back to the saved player. Country encounters still exclude rare/legendary and foreign-native species, and retain water/sand habitat restrictions. Groups stay fixed at map load with only one visible lead. Preview selection retries duplicate lead species to show more variety. Two or three existing land actors are staged near the arrival clearing without increasing the ten regional encounter points; other actors retain their spread.

Use `arrival=beasts` to start near the staged actors. The arrival helper searches multiple walkable offsets rather than failing silently when three fixed offsets are blocked. Region/border travel retains the mock flag; the country selector also retains it. The preview footer identifies simulated unlocks.

Verified six mobile-viewport browser scenes (three countries, normal and all-unlocked preview): 9–10 land actors changed world position over six seconds; all-unlocked scenes had ten distinct lead species each. Saved test level 3 and forest clears stayed unchanged, and encounter plans did not reroll. Existing model/rules, renderer and habitat patrol suites passed. Browser report/screenshots: `D:\GameDev\soulbeast\outputs\living-beasts-wander-preview-20261120`. Local server serves the updated source with HTTP 200. These checks do not measure real-phone performance.

Updated walking preview: http://127.0.0.1:8792/Soulbeast/tools/hemant-walk-demo/index.html?country=green&layout=regions-v5&region=N&arrival=beasts&packlord3d=1&roster=1&beastTestAll=1&v=living-wander-20261120-1


### Country bandit identities and patrol idle — 2026-11-20

Country bandits now roll a complete encounter plan during map initialization using the existing country encounter rule (unchanged level offsets, class tiers, pet count and forest progression). The new `bandit-actors.js` carries the 63 class/tier/capacity entries exported from the canonical battle catalog. It gives each bandit the corresponding existing animated sealer GLB and a fixed gender. Rendering uses an independent sealer renderer so the player avatar is unaffected. Single regional bandits preload; legacy maps with several bandits initialize models on visibility. The existing remote camp, one bandit per region, quest target bindings, treasure ownership and pursuit remain unchanged. This change targets country bandits; forest events, island/dungeon bandits and online server encounter generation retain their existing behavior.

Contact stores the whole pre-rolled group under a context-checked session token. The battle menu restores the same human class/gender/level and pets instead of rerolling. Missing/invalid/expired tokens retain the original random battle fallback. No persistent progression edits, new models, media uploads, deployment, APK build or Meshy usage.

The shared living-beast renderer now uses standing frame 0 when a patrol stops, retaining its heading; it resumes the existing three-second locomotion cycle on movement. Chase/return animation checks actual position changes, avoiding stepping against an obstruction. Colosseum actors now also pass their movement state. Gallery previews without a movement flag continue showing the full loop. No new idle animation was authored: the standing pose comes from the existing atlas.

Validation: 3,240 stable bandit rolls cover all 63 existing classes at their proper tiers; token context/identity and renderer direction/idle/lifecycle checks pass. Three actual mobile-viewport country scenes render an existing sealer GLB, patrol, and enter the battle menu with an identical group, without fetching the old bandit atlas or changing saved test level. The renderer test checks stopped and moving frames for all 177 models, including blocked chases. Model/progression/habitat suites and actual colosseum/online-party renderer smoke checks pass. Local updated source responds HTTP 200. Reports and screenshots: `D:\GameDev\soulbeast\outputs\bandit-class-walk-20261120`.

Bandit preview: http://127.0.0.1:8792/Soulbeast/tools/hemant-walk-demo/index.html?country=blue&layout=regions-v5&region=N&packlord3d=1&roster=1&beastTestAll=1&v=bandit-class-walk-1&arrival=bandit

Beast walk/pause preview: http://127.0.0.1:8792/Soulbeast/tools/hemant-walk-demo/index.html?country=green&layout=regions-v5&region=N&packlord3d=1&roster=1&beastTestAll=1&v=bandit-class-walk-1&arrival=beasts


### Approved flight behavior and web release — 2026-11-20

At the user's request, stopped models whose authoritative catalog kind is flight (34) or hover (15) continue the existing three-second animation in place. Ground locomotion kinds hold frame 0 when stationary. This overrides the earlier all-model idle wording above; no new animation/model is generated. All 177 model selections were retested with the flight/hover exception, normal movement and blocked-chase cases. Country maps are now enabled by default, with the simulated unlock profile still restricted to the explicit preview flags.

The online-party function and optional region-scene validators were deployed before publishing this web release. No online save progression was edited. Render continues serving the existing colosseum backend; its separate local spawn-filter changes are not included in this web cutover.
