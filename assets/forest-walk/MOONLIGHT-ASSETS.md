# Moonlight Forest local preview assets

Approved for publication on 2026-11-19. PNGs stream from immutable, SHA-256 verified Supabase Storage objects listed in published-scene-assets.js. Localhost previews use the ignored originals unless ?storage=1 is set. No generated PNGs or Blender source files are added to GitHub.

PNG files and Blender scenes are in the ignored `generated/moonlight/` folder. The set contains 17 generated six-cell atlases and four Blender renders. `moonlight-frames.js` records transparent source rectangles without editing image pixels. The original calibrated well basin images and gameplay geometry remain in use, surrounded by new moonlight props.

## Blender props

`tools/render-moonlight-props.py` builds and renders the oak, birch, rock cluster and timber post. Matching `.blend` files are saved beside their transparent PNGs. The camera is orthographic, looking down from the front/right, with blue-silver area light and a soft fill. No player or battle models are replaced.

## Built-in imagegen prompt set

Each atlas used this common instruction with its own six object descriptions:

> Soulbeast Moonlight Forest production game sprite atlas. Landscape 1536x1024, 3 columns by 2 rows of equal square cells, six disassembled physical parts with transparent 12% margins. Realistic weathered forest materials, soft silver-blue moonlight with readable midtones, muted green foliage, no neon. Orthographic front view slightly from right and downward at 40 degrees. True RGBA alpha-zero empty background; no white or colored background, checkerboard, gradient, halo, gridlines, text, border, people or assembled view. Each cutout wholly inside its cell. Non-floor pieces have no ground bases.

| Atlas | Row-major cutouts |
| --- | --- |
| woodland | Broadleaf tree; pale-bark tree; fern/shrub; silver grass/flowers; mossy stones; blank fork sign |
| gate | Ground; rear boundary; left support; right support; crescent lintel; low roots |
| shrine | Ground; moon altar; left column; right column; crescent ornament; offering bowl |
| ruins | Broken paving; rear wall; left support; right support; arch; low tablets |
| camp | Ground; rear canvas; left post; right post; canvas roof; backpack/stool |
| settlement | Doorstep; rear shelves; left facade; right herb facade; tiled roof; medicine basket |
| yggdrasil | Stream ground; ancient trunk; left roots; right roots; crown; cracked root |
| lantern | Clearing; hollow root; left lantern post; right post; travel lantern; traveller parcel |
| reflections | Pond with three reflections; moon tablet; left marker; right marker; reeds; pebbles/flowers |
| scales | Ground; altar table; balance frame; silver leaves; balanced pans; silver leaf/crystal |
| wolves | Pawprint ground; broken sign; left roots; right roots; curved branch; pawprint patch |
| moth | Ground; fallen log; seal satchel; opaque cloak; pale moths; mirror/crystal |
| axe | Woodchip ground; fallen trunk; stump; axe; branch; woodpile |
| seedmap | Ground; surveyor board; seeds/cloth; map desk; lantern; parchment/compass |
| waterways | Ditch; footbridge; left bank; right bank; crystal lantern post; tools/stones |
| boss | Empty arena; hollow tanuki stump; left roots; right roots; branch canopy; boundary stones |
| spring | Damp ground; rear reeds/stones; left flowers; right stones; low flowers; crescent marker |

The woodland atlas needed a separate imagegen extraction pass to remove its white background while preserving all six cutouts. All 21 final PNG files were checked for real RGBA transparency. Three silver leaves are drawn from an individually detected leaf source rectangle so the scale illustration follows the original clue.

## Runtime boundary

Zone 1 uses its own native secret, repeatable-event, riddle and tale IDs. Shared presentation handles full-screen menus, actor occlusion and return positions. Scenery consumes no encounter RNG; original event handlers continue to own probabilities, rewards, combat and saves. The training-forest theme remains separate.
