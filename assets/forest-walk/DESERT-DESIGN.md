# Golden Tomb Desert · local walking preview

Zone 3 uses the same Y walker, Blender class/gender actors, country joystick, analogue walk/run and 1.5x movement speed as the approved forests. Sand is the main terrain. Deterministic sparse cactus/dead-grass/stone placements replace dense forest scenery, with a few distant buried-city fragments. Decor never consumes native event RNG.

Native events and IDs: sahara, desert, desert-hourglass, desert-scales, desert-storm, desert-scarab, desert-0 through desert-3, encounter-3, after-desert, villager and boss. Each maps to presentation only. Native secret, repeatable event, riddle, tale, reward, trap, combat and save handlers remain authoritative. The unit check derives zone-3 IDs from SECRET_LOCATIONS and WORLD_TALES rather than substituting training or moonlight stories.

Seventeen modular place/environment atlases, six original hazard representations and a sand texture are in generated/desert/. Parts retain independent ground depth and elevation; roofs fade to reveal the actor. The three calibrated healing/revival/cleansing basins keep their existing contacts and effects. Blue irrigation water and white oasis falling water use bounded pixel masks; fire animates on the dry-brush hazard. Reduced-motion mode keeps static art.

The closed sphinx doorway reuses its prepared door kit and the two separate sphinx statues. The approach and battle still call the native sphinx boss. Original event menus fill the scene and return to the same place and position. Scene action buttons use the approved right-hand group above the footer ornament.

Local level-15 launcher: http://127.0.0.1:8834/ . It has 14 event scenes, 14 ordinary-map options and 6 hazard options, plus normal play. Event mode exercises the original game; walking-tour mode allows visual inspection without resolving events. Its disposable localhost save is separate from the production origin.

Launcher sources: D:/GameDev/soulbeast/tmp/desert-forest-preview.html and serve-desert-forest-preview.py. Start the Python server hidden from this repository as working directory. Media can be published through Supabase after the user approves the preview; this task does not publish zone 3.

Validation: native catalogue and source bounds; all native event contacts/full-screen menus/same-place returns; original secret and sphinx battles; desktop/mobile riddle and duplicate-reward guard; all 34 level-15 launcher options; fire/water pixel changes, masks and reduced motion; shared boss/action regressions across zones 7, 1 and 3. Scene screenshots are in D:/GameDev/soulbeast/tmp/desert-forest-qa/ and desert-preview-qa/.
