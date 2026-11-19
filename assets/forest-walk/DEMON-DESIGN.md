# ปราสาทจอมมาร — ตัวทดลองบน D:
Current interior redesign: see `DEMON-ROOM-DESIGN.md`. Outdoor trees/props are retained for steps 1–3; steps 4–10 use furnished rooms and a red-carpet throne-room approach.


Local preview only, based on approved production `7c4bd95c`. No new media was uploaded and no production deployment was performed for this castle preview.

Preview: http://127.0.0.1:8837/?v=demon-preview-1

The disposable localhost launcher uses level 60 ดาบเวทย์สงคราม (`sbwar`) and eight level-60 legendary Eclipse beasts, with the original party capacity. It offers normal exploration, individual native events, fourteen ordinary locations, six original hazards and three capital boss-quest scenarios. The preview fixtures earlier forest clears, class prerequisites and the boss quest prerequisite; production rules and saves are unchanged.

## PNG presentation

Twenty built-in `image_gen` outputs are saved in `assets/forest-walk/generated/demon/`. Nineteen transparent six-cell atlases provide individual floors, walls, supports, upper beams, story props and NPCs; one opaque basalt texture supplies the ground. `DEMON-ART-PROMPTS.json` records the full initial prompts and `DEMON-LOCAL-ASSETS.json` records local checksums. PNG binaries remain local and ignored by Git.

The palette is charcoal basalt, aged black iron, dull bronze, burgundy cloth and sparse deadwood. Terrain stays readable and the entrance approach remains open. Story NPCs have complete silhouettes and are placed beside the player approach. Overhead architectural parts can fade independently. The boss reuses the existing closed demon doorway and paired boss statues.

Country Walk's upper-right silhouette shadows, character rigs, joystick walk/run thresholds, 1.5 movement multiplier, 1.7 pursuit multiplier, broad Y exits and destination labels are inherited. The original well basin, rim, water contact and rewards remain calibrated. New waterfall and lantern masks use the shared pixel effects; the already approved waterfall recording, distance attenuation, mute/effects controls and corrected trail footsteps are reused.

## Original content

Fourteen entries route to native handlers: `pandemonium`, `castle`, `castle-mirrors`, `castle-chains`, `castle-banquet`, `castle-hounds`, `castle-0` through `castle-3`, `encounter-6`, `after-castle`, `villager`, and `boss`. Menus open full screen and restore the previous walking map and contact position when finished. Event data, probabilities, costs, rewards, inventory, combat and saves are not replaced.

Nine city quests, ten routes, have a zone-6 objective. The original earlier searches and follow-up conditions remain. `tools/test-demon-city-quests.cjs` covers acceptance/claim controls, six native search controls in earlier areas, 55 original event packets, save/reload and exact rewards. Packets are automated fixtures, not a claim of manually playing every fight. The actual localhost launcher also covers three capital boss quests through original boss contact and battle start, fixture wins at the native resolver, and return to the original town NPC claim controls.

## Validation and restart

`tools/inspect-demon-alpha.py` inspects all twenty original PNGs and writes crop metadata without editing pixels. It verifies alpha, bounds and cell-edge clearance. `tools/test-demon-forest.mjs` compares the catalog with native data and checks ordinary locations, hazards, well clearance and deterministic scenery. `tools/test-demon-forest-browser.mjs` covers fourteen original event contacts, full-page menus, same-place returns, mobile riddle layout, duplicate reward protection, native secret combat and ordinary scenery. Shared prop effect tests include the castle's flames, waterfall, basin water and reduced motion.

The launcher and server are `D:/GameDev/soulbeast/tmp/demon-forest-preview.html` and `D:/GameDev/soulbeast/tmp/serve-demon-forest-preview.py`. Restart the Python server on port 8837 if needed. Changing the selection resets only this dedicated localhost preview origin. **เปิดเสียงทดลอง** enables the original game audio on a real gesture.

Evidence is saved under `D:/GameDev/soulbeast/tmp/demon-forest-qa/`, `demon-preview-qa/` and `demon-preview-city-qa/`. Upload the new `demon/*` PNGs and extend the immutable published-media manifest before any future production deployment.
