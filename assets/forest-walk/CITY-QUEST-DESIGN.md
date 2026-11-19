# City quests in the walking forests · local D: preview

The native data contains 187 quests / 250 routes with an explicit objective in training (7), moonlight (1), Golden Tomb Desert (3), or Sleeping Dragon Peak (4). Their forestSearch objectives have 25 story families and 114 distinct targets. City variants and choices keep their original quest IDs, step IDs, dialogue, prerequisites, countries, depth requirements and rewards. The existing dragon data contains boss objectives, with no new search quest invented.

## Presentation

`tools/town-walk-demo/forest-quest-sites.js` maps each search story to a matching PNG cutout and stable world position. Examples include a wounded explorer, family gemstone under roots, lost tame beast guarding an injured traveler, false alarm bell, duty roster, grain trail, spy dead drop, altered inscription and sealed spirit. Five transparent PNG sheets supply all 25 mini-scenes. Shared plots may share art; their quest records and buttons remain independent.

Only the original `WalkQuestEngine.searchObjectives` result creates sites. Unaccepted quests, later steps, wrong countries and insufficient forest depth create no site. No quest-engine or world-quest-data rules were changed. Boss, capture, combat and chest quests retain their existing encounter art and event paths; country-only objectives are not broadened to forest fights.

The atlas source, coordinates and image cache live in `quest-frames.js` and `quest-scenery.js`. Active sites clear nearby decorative vegetation, use no solid foreground or roof, add minimap markers and a direction/distance button. Walking close opens only that site's native quest cards in a full-page menu. Discovery grants no progress; the original quest action does. Closing returns to the same coordinates. Completing one quest updates the remaining sites without completing unrelated quests. The ordinary forest transitions, Y exits, native events and combat stay intact.

## Local art and preview

PNG originals: `D:/GameDev/soulbeast/tmp/party-encounter-production/assets/forest-walk/generated/city-quests/{rescue,evidence,witness,pact,help}.png`.

Exact prompts and generation method: `CITY-QUEST-ART.json`. All five were generated with the built-in image_gen tool and transparent_background=true. Original alpha is preserved; Pillow was used only to inspect alpha and calculate atlas rectangles, not to paint or edit images. The five PNGs are stored in the existing ignored generated-assets folder, not uploaded or published.

Preview: `http://127.0.0.1:8835/?v=city-quests-1&scene=quest:0`. The existing D: preview launcher now has 25 city-quest selections. These disposable scenarios accept the original quest and replay any preceding objectives as fixture setup, so the player can immediately try its forest step. They keep the requested level-60 sbwar hero and level-60 Eclipse beasts. Normal game saves do not receive fixture flags.

## Validation and its scope

- `node tools/test-city-forest-quests.cjs D:/GameDev/soulbeast/tmp/city-forest-quest-flow-report.json`: 319 quests / 405 routes, including the 187 explicit forest quests and related country/combat/chest/capture regressions. Executes production town accept/claim click handlers in a DOM test host, all 229 relevant native search-button handlers, and replays 1,304 native event packets for other objectives. Verifies exact gold and item/gear/beast rewards, all choices, save/reload, wrong depth/country/place, quest isolation, stale actions and duplicate rewards. This is exhaustive automated quest-flow validation, not 405 manually played battles.
- `node tools/test-city-forest-browser.mjs`: real rendered PNG sites for all 25 families; keyboard contact, native search actions, full-page menus, same-place returns, isolated concurrent quests and mobile guide hit targets.
- D: QA `check-city-desert-sites.mjs`: all native desert search objectives, including repeated search steps.
- D: QA `check-city-quest-launcher.mjs`: every one of the 25 preview selections retains the level-60 sbwar hero and Eclipse beasts.
- Existing quest logic, expansion and integration suites: original 549 routes / 1,334 objectives and all reward/visual models. Existing four-zone action/boss tests cover the surrounding chest and battle interfaces.

Publication was authorized on 2026-11-19 together with Sleeping Dragon Peak and the wider Y exits. Images use immutable Supabase objects; release evidence is saved in D:/GameDev/soulbeast/tmp/dragon-city-publish-20261119/.
