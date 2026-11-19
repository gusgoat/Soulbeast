# ป่าทมิฬพันธนาการ — ตัวทดลองบน D:

The requested forest after Demon Castle is native zone 8, named **ป่าทมิฬพันธนาการ** in the original game. “ป่าทมิฬบรรพกาล” does not occur in the native catalogue. This preview keeps the original name and all gameplay content. The approved preview is now prepared for production on `codex/web-latest-20261103`. All 18 images are uploaded to immutable Supabase objects and SHA-256 verified; the original PNGs remain on D: outside Git. See `BINDING-PUBLISHED-ASSETS.json`. The Lv60 launcher remains local only.

Preview: http://127.0.0.1:8838/?v=binding-preview-1&scene=normal&tour=0

## Art and walking

Eighteen PNG assets are saved in `generated/binding/`: seventeen transparent six-cell prop atlases plus one opaque forest ground texture. Trees, roots, gates, piers, roofs, ground pieces and NPCs are individual depth-sorted parts. Raised layers fade when they hide the player. All original native contact points and Y exit coverage remain. The renderer uses the existing Country Walk upper-right silhouette shadows for characters and props, the existing 3D profession avatars, joystick walk/run thresholds, 1.5 movement scaling and 1.7 pursuer scaling.

The visual theme uses ancient dark ironwood, sparse teal leaves, basalt, bronze chains, ruined shrines and amber lanterns. Native encounter pool depth bands are echoed by extra stone/root ruins and fortress piers, without consuming gameplay randomness. Waterfalls, basins, campfire, furnace, brazier and torch effects use the existing effect and distance-audio systems. Native six trap graphics and calibrated well surfaces are reused.

Files and SHA-256: `BINDING-LOCAL-ASSETS.json`. Built-in image_gen prompts and refinements: `BINDING-ART-PROMPTS.json`. Source alpha bounds: `binding-frames.js`, regenerated without editing pixels by `tools/inspect-binding-alpha.py`. Draft opaque images are retained under D:/GameDev/soulbeast/tmp, outside the runtime art folder.

## Native events retained

The walking catalogue covers the original ironreliquary secret, iron-wagon repeatable event, four iron riddles, four STAGE_SEVEN_QUESTS, encounter-8, native traveller, boss and aftermath presentation. It retains the hidden-vault 3% discovery, bandit and Baihu guard battle, single-choice vault rewards, quest stages across other zones, puzzle answers and penalties, native costs and buffs. The boss room uses the existing binding gate and two guardian statues; the actual boss handler still creates Ferroth and Mortivar at Lv60 with their original two helpers, mechanics, drops and first-clear reward choice.

City quests are the three existing capital forest8 boss quests. The native quest engine locates zone 8 in the **green** country regardless of the player's home country. The disposable launcher therefore passes `country=green`, while accepting/reporting at the selected home capital; it does not change quest country rules. There are no additional native city search objectives in zone 8. The normal city quest-site bridge remains enabled for any eligible native objective.

## Preview and validation

The launcher is D:/GameDev/soulbeast/tmp/binding-forest-preview.html; the hidden server is D:/GameDev/soulbeast/tmp/serve-binding-forest-preview.py on port 8838. The isolated localhost save uses Lv60 sbwar and the existing legendary Eclipse Lv60 beast catalogue with native carried/team capacity. Only this launcher fixtures the prior Demon Lord clear to enter zone 8. It offers normal walking, every event, ordinary maps, traps and the three city boss quest demos.

`tools/test-binding-forest.mjs` compares the entire native menu body with production ec2199bd, checks all eighteen PNG source bounds, the native event catalogue, fourteen ordinary maps, six original traps and absence of added gameplay RNG/contact colliders. `tools/test-binding-forest-browser.mjs` exercises native event contacts, full-screen/mobile menu layout, same-place returns, secret guard fight/reward, duplicate puzzle rewards, actual two-boss/two-helper battle and ordinary map rendering. City tests exercise the original accept/claim UI and exact rewards. Real PNG fire/water pixel masks, cache and reduced-motion behavior pass the shared effects test. Evidence stays in D:/GameDev/soulbeast/tmp/binding-forest-qa and binding-preview-city-qa.
