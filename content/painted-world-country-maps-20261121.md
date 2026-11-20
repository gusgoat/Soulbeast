# Painted world and country atlas — 2026-11-21

Replace the old world map illustration with the existing approved painted V5 world image, and provide all three painted country maps. The world atlas country selector switches illustrations and displays each country's four region place lists. Optional place pins keep the painted overview uncluttered; current position and quest targets remain available. Country paintings are illustrative and do not introduce extra playable places.

Settlement and forest markers now use the current regional layout; country scene snapshots include region identity so player and live quest positions project into world coordinates. War-map node IDs, the 63 settlements and 84 war edges remain unchanged. Island route display positions move with the artwork without changing ferry rules or island content. Existing quest identity, save progression and the 80 place identities remain intact.

All four approved source paintings remain unchanged. High-quality WebP derivatives are served through immutable SHA-verified public Supabase URLs, totaling 3,053,200 bytes. No new bitmap is committed to Pages. The root game script uses a fresh content-hash name and atlas script references have new cache keys.

This release changes map illustrations and map display coordinates only. Graphics defaults, walking renderer, beast renderer, server code, online data, APKs and signing keys are untouched.

Validation: 3 countries × 2 mobile orientations; all four images decode, all country views show four region lists, current position projects using its region, optional place pins and return-to-current work, closing the atlas resumes play. Static checks preserve war graph/node identities, all 12 region projection models and 80 place identities. Validation artifacts: D:/GameDev/soulbeast/outputs/world-country-map-art-release-20261121.

User also requested settlement markers for teleport scrolls. Each country painting now has all 21 settlement markers; the world map retains all 63. The existing teleport destination action receives only eligible destinations, other markers are disabled/dimmed, and the existing confirmation/ownership/item-consumption handlers remain byte-identical. SVG teleport markers support Enter/Space alongside touch. The legacy dungeon atlas hook avoids adding a duplicate marker when current regional landmark data is present.
