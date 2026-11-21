# Island graphics and beast temperament — 2026-11-21

Island scenes share WalkGraphics resolution/pixel limits and FPS caps with country scenes: 20, 25, 30, 30, 30, 60 FPS. Changes from the actual settings iframe apply immediately; orientation changes recalculate canvas size. Only drawing is throttled; simulation, movement, audio, save and minimap timing retain their existing updates.

53 of 177 model appearances are explicitly passive, selected after inspecting the existing model contact sheets (gentle faces, animals and guardians). The list is exported by LivingBeasts.passiveModels. Temperament follows the visible model, including distinctions between gentle first forms and armed evolutions. Passive beasts keep patrolling and allow contact encounters; no encounter pool/progression/group changes. Bosses and bandits keep their existing behavior.

Aggressive aquatic beasts chase only a player wading in the same water body, return when the player leaves water or steps onto a bridge, and remain in their habitat. Passive aquatic beasts allow contact encounters. Island water actors also check the player against their water habitat before chase/contact.

Validation: 36 actual island HUD graphics cases (3 countries x 2 orientations x 6 levels), DPR3 canvas dimensions, independent tick/draw counters, touch joystick movement after settings/orientation, unchanged encounter plans and one shared 3D WebGL context. 22 deterministic temperament/cadence cases at 60/90/120Hz; 48 real country-region aquatic cases. Full reports are under D:/GameDev/soulbeast/outputs/island-graphics-beast-temperament-20261121. Headless Chrome checks do not establish physical-phone FPS.
