# แดนสวรรค์ล่มสลาย — ตัวทดลองบน D:

Status: publication authorized on 2026-11-19, based on `aa9881f2`. Twenty Heaven PNGs and the supplied waterfall recording were uploaded to immutable Supabase objects and SHA-256 verified before preparing this release. Deployment and live validation records are in `D:/GameDev/soulbeast/tmp/heaven-waterfall-publish-20261119/`.

Preview: http://127.0.0.1:8836/?v=heaven-preview-1

The launcher uses a disposable localhost save: level 60 ดาบเวทย์สงคราม (`sbwar`) and level 60 legendary Eclipse beasts. It offers normal exploration, individual native events, ordinary locations, six original hazards, and three capital boss-quest scenarios. Changing the selection resets only this preview origin. The boss-quest scenarios fixture the original prerequisite as completed; production acceptance rules are unchanged.

## Presentation

Twenty built-in `image_gen` PNG outputs are saved in `assets/forest-walk/generated/heaven/`: nineteen transparent six-part atlases and one marble ground texture. Full initial prompts are in `HEAVEN-ART-PROMPTS.json`; local checksums and sizes are in `HEAVEN-LOCAL-ASSETS.json`. Binary source images remain local and ignored by Git, following the project's storage convention.

Ivory marble, tarnished gold, pale foliage and old roots follow the original boss-room theme. Ground, rear walls, columns, arches, story props and NPCs are separate pieces. Sparse trees leave the approach readable. Overhead pieces fade near the player. The boss uses the existing closed Nidhogg doorway and two separate guardian statues.

The Country Walk shadow engine remains unchanged: alpha silhouettes project toward the upper right into the shared ground mask, then characters and foreground props are composited above it. Existing actor rigs, joystick walk/run thresholds, movement speed, pursuit speed, action placement and broad Y exits are reused. Fire and water use bounded masks from the PNG pixels, without gameplay RNG.

True-alpha refinements were made to gate, ruins, stars and spring atlases with built-in image editing. Bell and storm pieces were recentered within their six cells to remove clipped edges. Original draft outputs are retained under `D:/GameDev/soulbeast/tmp/heaven-source-drafts/`. `tools/inspect-heaven-alpha.py` inspects pixels and writes crop metadata without editing the image files.

## Original content

The fourteen catalog entries are `valhalla`, `heaven`, `heaven-stars`, `heaven-oath`, `heaven-lightning`, `heaven-soulwind`, `heaven-0` through `heaven-3`, `encounter-5`, `after-heaven`, `villager`, and `boss`. They route to the original secret, special, riddle, tale and boss handlers. Ordinary encounters, villages, wells, ruins and exit locations also use the new scenery.

Menus open full screen. Completing an event restores its walking map and stored contact position. Native event data, random probabilities, costs, rewards, combat, inventory and player saves are not replaced.

Five city quests (six routes) contain a zone-5 objective: the three `*-capital:forest5` quests, `green-capital:resident-1`, and `road:green:npc-2:npc-2-1`. All zone-5 objectives are native boss objectives. Searches in the longer stories remain in their original earlier zones; the later zone-6 boss requirement is retained. No new zone-5 search or reward is invented.

## Validation

- `python tools/inspect-heaven-alpha.py`: twenty PNGs, real alpha, crop bounds, no cell-edge warnings.
- `node tools/test-heaven-forest.mjs`: complete original fourteen-entry catalog, fourteen ordinary maps, six hazards, existing well calibration, deterministic scenery.
- `node tools/test-heaven-forest-browser.mjs`: all fourteen event contacts and full-screen menus, same-place returns, mobile riddle layout, duplicate-reward guard, original secret combat, and ordinary maps.
- `node tools/test-heaven-city-quests.cjs`: five quests/six routes through the real town accept/claim controls and native event packets; earlier searches, later boss steps, exact rewards and duplicate guards. Native packets are test fixtures, not a claim of manually playing every battle.
- `node tools/test-forest-ground-shadows-browser.mjs`: upper-right shadow pixels at DPR 1/1.5/2, overlap density, foreground occlusion, and all five walking zones.
- `node tools/test-forest-prop-effects-browser.mjs`: fire/water masks, animated pixels, cache, reduced motion, no gameplay RNG, and five-zone integration.
- `node tools/test-forest-actions-browser.mjs`: five viewport sizes per zone, unobscured chest/actions, reward once, and original bosses including Nidhogg.

Screenshots and preview checks are under `D:/GameDev/soulbeast/tmp/heaven-forest-qa/` and `D:/GameDev/soulbeast/tmp/heaven-preview-qa/`. The launcher and local server are `D:/GameDev/soulbeast/tmp/heaven-forest-preview.html` and `D:/GameDev/soulbeast/tmp/serve-heaven-forest-preview.py`.

The actual localhost launcher also passed all three capital boss-quest flows: accept, approach the Nidhogg doorway, start the original battle, fixture a native resolver win, exit, open the original town NPC claim UI, and verify the exact gold reward. Screenshots: `D:/GameDev/soulbeast/tmp/heaven-preview-city-qa/`.
