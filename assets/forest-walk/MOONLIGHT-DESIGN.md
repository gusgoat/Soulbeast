# Moonlight Forest presentation design

Scope: reuse the released training-forest walking experience for zone 1. This brief changes presentation only; it does not deploy or change gameplay.

## Existing identity

The original zone describes an open woodland beside a stream, with small beasts hiding in grass. Its existing boss is King Tanuki. Keep this identity rather than turning the forest into a dense, frightening dungeon.

## Shared behavior

Reuse the Y paths, original fork randomness, left/right destination labels, Blender class/gender actors, country joystick, and current 1.5x player pace. Native menus fill the content area and return to the same map and contact position. Keep original zone-1 encounters, probabilities, rewards, quests, boss and save rules. Do not copy training-forest story IDs or rewards into zone 1.

## Art direction

Realistic materials, soft blue-silver moonlight, muted purple-blue shadows and green foliage. Keep the path and the player readable. Use clearings, stream banks and tree spacing rather than a continuous dark canopy. Avoid oversized glowing ornaments, neon mushrooms, painted fog walls and large opaque foreground pieces.

## Prop families

| Existing place/contact | Moonlight presentation |
| --- | --- |
| Entrance and fork | Weathered timber sign, pale stones, low silver-green grass and fern edges |
| Beast encounter | Pawprints in damp soil, low hiding grass and disturbed leaves; preserve the existing encounter roll |
| Bandit / traveler | Roadside timber, worn baggage, small camp and natural approach space; retain the actual battle actor identity |
| Shrines | Worn moon-marked stone, shallow offering bowl and climbing moss |
| Existing healing / revival / cleanse springs | Distinct water, stone and flower arrangements for each existing spring type; retain the original basin contacts and effects |
| Bush / mist / ruins searches | Low ferns, pale seed heads, broken stone arch and mossy remnants; use separated PNG depth and restrained atmospheric opacity |
| Village / hospital | Woodland settlement pieces and herbal shelter with visible, open entrances |
| Exit | Timber opening toward the country road, with an unambiguous exit sign |
| Boss | Root-framed clearing, hollow stump and tanuki traces; retain King Tanuki and original combat |
| Native story and puzzle events | Give each actual zone-1 event its own readable place prop after enumerating its existing IDs; never substitute a training event |

## PNG assembly

Each place uses independent floor, rear structure, side supports, overhead part and low detail cutouts. Store generated atlases in ignored media folders and publish through Supabase. Reuse the shared depth/elevation renderer; floors always draw below feet, and obstructing overhead/front pieces fade to reveal the actor. Preserve an open approach to every original contact and avoid resizing the player to fit the artwork.

## Implementation boundary

Introduce an explicit zone theme for scenery selection instead of forking movement or combat code. Preserve existing training-forest assets and behavior. Apply the same full-screen menu/return-position handling to zone-1 native events where currently restricted to zone 7. Confirm the existing well effects still match each new basin image before swapping well artwork.

## Preview and acceptance

Provide a separate zone-1 preview with place selection and walking-only / original-event modes. Check desktop and mobile readability, player visibility in front/inside/behind props, every original contact, branch names, event and combat returns, and unchanged reward guards. Publish only after the moonlight preview has been reviewed.
