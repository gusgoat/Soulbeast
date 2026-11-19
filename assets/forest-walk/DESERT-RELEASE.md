# Golden Tomb Desert and faster pursuit · 2026-11-19

User-approved publication of zone 3, with sand terrain, sparse cacti, buried-city/tomb props, 14 native event presentations, shared original combat/rewards/save, full-scene menus and same-place returns. Sphinx doorway and guardian statues use the previously prepared kit. Only walking zones 7, 1 and 3 are enabled.

Pursuit is 1.7 times the previous speed in every walking theme: bandits and hostile travelers move at 14.11 projected world units/second (previously 8.3); beast shadows move at 11.56 (previously 6.8). Player movement, contact radius, obstacles and encounter handlers remain unchanged. tools/test-forest-pursuit.mjs simulates the actual chase function over one second, collision and contact, and can verify the published source through SOULBEAST_TEST_ORIGIN.

Media: 19 new PNGs, about 45.6 MB, stored as immutable Supabase objects and SHA-256 verified by tools/publish-forest-media.mjs --desert-only. The complete published media map contains 56 files, including 37 previously published assets; their object names stay unchanged. Original PNGs and Blender inputs stay out of GitHub. A local credential file outside the repository is used only by the upload tool.

Validation includes native catalogue and RGBA source bounds, a full browser run against public Storage, native secret combat, same-place returns, full-screen/mobile menus, duplicate-reward protection, original sphinx boss, scene actions and the three-forest shared pursuit implementation. GitHub Pages build/deploy and live browser checks are required before release completion.
